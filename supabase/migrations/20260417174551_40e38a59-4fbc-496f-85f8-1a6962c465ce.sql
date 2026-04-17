-- Reagenda o cron com JSON válido (jsonb_build_object em vez de concatenação)
SELECT cron.unschedule('check-expired-trials-hourly');

SELECT cron.schedule(
  'check-expired-trials-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/check-expired-trials',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key')
    ),
    body := jsonb_build_object('time', now())
  ) AS request_id;
  $$
);