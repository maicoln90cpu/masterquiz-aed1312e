
-- Enable pg_net if not already
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron: WhatsApp daily target update at 08:00
SELECT cron.schedule(
  'check-inactive-users-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/check-inactive-users',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4"}'::jsonb,
    body:='{"time": "daily-auto"}'::jsonb
  ) as request_id;
  $$
);

-- Cron: Email daily target check at 08:15
SELECT cron.schedule(
  'check-inactive-email-daily',
  '15 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/check-inactive-users-email',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4"}'::jsonb,
    body:='{"time": "daily-auto"}'::jsonb
  ) as request_id;
  $$
);

-- Cron: Process email queue every 5 min
SELECT cron.schedule(
  'process-email-queue-auto',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/process-email-recovery-queue',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4"}'::jsonb,
    body:='{"time": "auto"}'::jsonb
  ) as request_id;
  $$
);
