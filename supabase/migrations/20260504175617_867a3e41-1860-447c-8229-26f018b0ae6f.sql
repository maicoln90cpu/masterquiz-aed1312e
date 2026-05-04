DO $$
DECLARE
  v_target_user uuid := 'b90f4058-2cc6-46ec-bb9d-a006bab02c81';
  v_orphan_exists boolean;
  v_user_exists boolean;
  v_anonymized_count int := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.scheduled_deletions
    WHERE user_id = v_target_user
      AND cancelled_at IS NULL
      AND scheduled_for < now()
  ) INTO v_orphan_exists;

  IF NOT v_orphan_exists THEN
    RAISE NOTICE '[scheduled_deletions cleanup] Nenhum registro órfão para %, nada a fazer.', v_target_user;
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_user) INTO v_user_exists;

  IF v_user_exists THEN
    UPDATE public.audit_logs
       SET user_id = NULL,
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('anonymized', true)
     WHERE user_id = v_target_user;
    GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;

    DELETE FROM auth.users WHERE id = v_target_user;

    RAISE NOTICE '[scheduled_deletions cleanup] Usuário % deletado (audit_logs anonimizados: %).',
      v_target_user, v_anonymized_count;
  ELSE
    DELETE FROM public.scheduled_deletions WHERE user_id = v_target_user;
    RAISE NOTICE '[scheduled_deletions cleanup] Usuário % já não existia; órfão removido.', v_target_user;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    NULL,
    'support:scheduled_deletion_processed_manually',
    'user',
    v_target_user,
    jsonb_build_object(
      'reason', 'cron de scheduled_deletions inexistente; deleção vencida desde 2026-03-20',
      'user_existed_in_auth', v_user_exists,
      'audit_logs_anonymized', v_anonymized_count,
      'processed_at', now()
    )
  );
END $$;