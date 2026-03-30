-- Update blog digest cron: from daily to every 10 days at 9h UTC
SELECT cron.unschedule('send-blog-digest-daily');

SELECT cron.schedule(
  'send-blog-digest-10days',
  '0 9 */10 * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-blog-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)),
    body := '{}'::jsonb
  );
  $$
);

-- Update success story cron: from monthly to weekly Thursday at 10h UTC
SELECT cron.unschedule('send-success-story-monthly');

SELECT cron.schedule(
  'send-success-story-thursday',
  '0 10 * * 4',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-success-story',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)),
    body := '{}'::jsonb
  );
  $$
);