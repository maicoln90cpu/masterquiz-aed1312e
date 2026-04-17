-- Etapa 5: RPC get_all_cron_jobs — unifica cron.job + email_automation_config + cron.job_run_details
CREATE OR REPLACE FUNCTION public.get_all_cron_jobs()
RETURNS TABLE (
  jobid BIGINT,
  jobname TEXT,
  schedule TEXT,
  active BOOLEAN,
  display_name TEXT,
  description TEXT,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_duration_ms INT,
  total_runs_24h INT,
  total_failures_24h INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    j.jobid,
    j.jobname::text,
    j.schedule::text,
    j.active,
    COALESCE(c.display_name, j.jobname)::text AS display_name,
    c.description::text,
    last_run.start_time AS last_run_at,
    last_run.status::text AS last_run_status,
    CASE
      WHEN last_run.end_time IS NOT NULL AND last_run.start_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (last_run.end_time - last_run.start_time))::int * 1000
      ELSE NULL
    END AS last_run_duration_ms,
    COALESCE(stats.total_24h, 0)::int AS total_runs_24h,
    COALESCE(stats.failures_24h, 0)::int AS total_failures_24h
  FROM cron.job j
  LEFT JOIN public.email_automation_config c ON c.automation_key = j.jobname
  LEFT JOIN LATERAL (
    SELECT start_time, end_time, status
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC NULLS LAST
    LIMIT 1
  ) last_run ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total_24h,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failures_24h
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid AND d.start_time >= now() - interval '24 hours'
  ) stats ON TRUE
  ORDER BY j.jobname;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_cron_jobs() TO authenticated;