
-- Insert vault secrets for pg_cron jobs to call Edge Functions
SELECT vault.create_secret(
  'https://kmmdzwoidakmbekqvkmq.supabase.co',
  'supabase_url',
  'Supabase project URL for pg_cron jobs'
);

SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4',
  'supabase_anon_key',
  'Supabase anon key for pg_cron jobs'
);
