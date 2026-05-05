SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'check-activation-24h-daily'),
  schedule := '0 */4 * * *'
);