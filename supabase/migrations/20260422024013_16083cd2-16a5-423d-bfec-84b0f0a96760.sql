-- Agendamento semanal do cleanup de webhook_events (toda segunda às 03:15 UTC)
-- Idempotente: remove qualquer agendamento anterior com o mesmo nome.
DO $$
BEGIN
  PERFORM cron.unschedule('weekly_cleanup_webhook_events');
EXCEPTION WHEN OTHERS THEN
  -- ignora se não existia
  NULL;
END $$;

SELECT cron.schedule(
  'weekly_cleanup_webhook_events',
  '15 3 * * 1',
  $$ SELECT public.cleanup_old_webhook_events(); $$
);