-- Agendar cron horário para rollup de performance
DO $$
DECLARE
  v_existing_jobid bigint;
BEGIN
  SELECT jobid INTO v_existing_jobid FROM cron.job WHERE jobname = 'rollup-performance-hourly';
  IF v_existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_jobid);
  END IF;

  PERFORM cron.schedule(
    'rollup-performance-hourly',
    '5 * * * *',
    $cron$SELECT public.run_performance_rollup();$cron$
  );
END $$;