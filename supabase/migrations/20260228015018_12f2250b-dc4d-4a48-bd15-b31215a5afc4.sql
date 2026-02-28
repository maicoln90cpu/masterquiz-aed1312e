SELECT
  cron.schedule(
    'blog-auto-generate-daily',
    '0 9 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/blog-cron-trigger',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );