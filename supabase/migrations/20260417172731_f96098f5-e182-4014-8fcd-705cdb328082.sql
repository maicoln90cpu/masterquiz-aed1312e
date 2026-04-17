
DO $$
DECLARE
  v_url text;
  v_key text;
  v_existing_jobid bigint;
BEGIN
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets WHERE name = 'supabase_url';

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key';

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'Secrets supabase_url / supabase_anon_key não encontrados no vault';
  END IF;

  -- Remover cron antigo se existir (idempotente)
  SELECT jobid INTO v_existing_jobid FROM cron.job WHERE jobname = 'send-platform-news-monthly';
  IF v_existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_jobid);
  END IF;

  -- Toda primeira terça-feira do mês, 11h UTC
  PERFORM cron.schedule(
    'send-platform-news-monthly',
    '0 11 1-7 * 2',
    format($f$
      SELECT net.http_post(
        url := %L,
        headers := %L::jsonb,
        body := '{"source":"cron"}'::jsonb
      ) AS request_id;
    $f$,
      v_url || '/functions/v1/send-platform-news',
      jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_key
      )::text
    )
  );
END $$;
