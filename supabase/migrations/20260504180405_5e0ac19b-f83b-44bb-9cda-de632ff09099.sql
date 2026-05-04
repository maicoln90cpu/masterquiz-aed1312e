CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_processed int := 0;
  v_errors int := 0;
  v_anonymized int;
  v_user_existed boolean;
  v_error_details jsonb := '[]'::jsonb;
BEGIN
  FOR r IN
    SELECT user_id
    FROM public.scheduled_deletions
    WHERE cancelled_at IS NULL
      AND scheduled_for < now()
    ORDER BY scheduled_for ASC
    LIMIT 100
  LOOP
    BEGIN
      v_user_existed := EXISTS (SELECT 1 FROM auth.users WHERE id = r.user_id);
      v_anonymized := 0;

      IF v_user_existed THEN
        UPDATE public.audit_logs
           SET user_id = NULL,
               metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('anonymized', true)
         WHERE user_id = r.user_id;
        GET DIAGNOSTICS v_anonymized = ROW_COUNT;

        DELETE FROM auth.users WHERE id = r.user_id;
      END IF;

      -- Limpa órfãos não-cascade
      DELETE FROM public.scheduled_deletions WHERE user_id = r.user_id;
      DELETE FROM public.profiles WHERE id = r.user_id;

      INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
      VALUES (
        NULL,
        'support:scheduled_deletion_processed_by_cron',
        'user',
        r.user_id,
        jsonb_build_object(
          'user_existed_in_auth', v_user_existed,
          'audit_logs_anonymized', v_anonymized,
          'processed_at', now()
        )
      );

      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_error_details := v_error_details || jsonb_build_object(
        'user_id', r.user_id,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'processed', v_processed,
    'errors', v_errors,
    'error_details', v_error_details,
    'ran_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_scheduled_deletions() FROM PUBLIC, anon, authenticated;