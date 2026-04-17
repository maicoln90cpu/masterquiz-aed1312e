-- Etapa 3: Cron diário check-activation-24h-daily (08h30 UTC)
-- Garante que pg_cron e pg_net estão habilitados
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove cron antigo se existir (idempotente)
DO $$
BEGIN
  PERFORM cron.unschedule('check-activation-24h-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Agendar invocação diária 08h30 UTC da edge function check-activation-24h
SELECT cron.schedule(
  'check-activation-24h-daily',
  '30 8 * * *',
  $$
  SELECT net.http_post(
    url := COALESCE(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1),
      'https://kmmdzwoidakmbekqvkmq.supabase.co'
    ) || '/functions/v1/check-activation-24h',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1),
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4'
      )
    ),
    body := jsonb_build_object('triggered_at', now()::text, 'source', 'pg_cron')
  );
  $$
);

-- Registrar na tabela de configuração de automações de email para visibilidade
INSERT INTO public.email_automation_config (
  automation_key, display_name, description, frequency, is_enabled
) VALUES (
  'check-activation-24h-daily',
  'Ativação 24h (Exploradores sem quiz)',
  'Cron diário 08h30 UTC. Identifica usuários no estágio explorador há mais de 24h sem quiz publicado e enfileira mensagem WhatsApp de ativação.',
  'daily 08:30 UTC',
  true
) ON CONFLICT (automation_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  frequency = EXCLUDED.frequency,
  updated_at = now();