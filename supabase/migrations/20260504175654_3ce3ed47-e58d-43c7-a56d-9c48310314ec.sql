DO $$
DECLARE
  v_target_user uuid := 'b90f4058-2cc6-46ec-bb9d-a006bab02c81';
BEGIN
  -- Confirma que auth.users já não existe (segurança)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_target_user) THEN
    RAISE EXCEPTION 'Abortado: usuário ainda existe em auth.users';
  END IF;

  DELETE FROM public.scheduled_deletions WHERE user_id = v_target_user;
  DELETE FROM public.profiles WHERE id = v_target_user;
END $$;