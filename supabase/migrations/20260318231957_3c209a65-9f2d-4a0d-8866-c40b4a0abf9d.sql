
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT DEFAULT 'user_request',
  unsubscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can view unsubscribes" ON public.email_unsubscribes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

ALTER TABLE public.email_recovery_templates ADD COLUMN IF NOT EXISTS subject_b TEXT;
ALTER TABLE public.email_recovery_contacts ADD COLUMN IF NOT EXISTS ab_variant TEXT;

UPDATE public.email_recovery_templates SET trigger_days = 10 WHERE category = 'integration_guide' AND trigger_days = 7;
UPDATE public.email_recovery_templates SET trigger_days = 17 WHERE category = 'plan_compare' AND trigger_days = 14;
UPDATE public.email_recovery_templates SET trigger_days = 25 WHERE category = 're_engagement' AND trigger_days = 21;
UPDATE public.email_recovery_templates SET trigger_days = 28 WHERE category = 're_engagement' AND trigger_days = 24;
UPDATE public.email_recovery_templates SET trigger_days = 31 WHERE category = 're_engagement' AND trigger_days = 27;
UPDATE public.email_recovery_templates SET trigger_days = 35 WHERE category = 'reactivation' AND trigger_days = 30;
UPDATE public.email_recovery_templates SET trigger_days = 38 WHERE category = 'survey' AND trigger_days = 30;

SELECT cron.schedule(
  'send-blog-digest-daily',
  '30 12 * * *',
  $$SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-blog-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'send-weekly-tip-monday',
  '0 13 * * 1',
  $$SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-weekly-tip',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'send-monthly-summary-first',
  '0 12 1 * *',
  $$SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-monthly-summary',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)),
    body := '{}'::jsonb
  )$$
);

SELECT cron.schedule(
  'send-success-story-monthly',
  '0 14 1 * *',
  $$SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1) || '/functions/v1/send-success-story',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1)),
    body := '{}'::jsonb
  )$$
);
