DO $$
DECLARE
  v_existing_jobid bigint;
BEGIN
  SELECT jobid INTO v_existing_jobid FROM cron.job WHERE jobname = 'process-scheduled-deletions-daily';
  IF v_existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_jobid);
  END IF;

  PERFORM cron.schedule(
    'process-scheduled-deletions-daily',
    '10 3 * * *',
    $job$ SELECT public.process_scheduled_deletions(); $job$
  );
END $$;