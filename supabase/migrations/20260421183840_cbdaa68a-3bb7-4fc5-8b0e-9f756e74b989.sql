-- =========================================================
-- Onda 4 / Etapa 2 — Rollups horários de performance
-- =========================================================

-- 1) Tabela de rollup
CREATE TABLE IF NOT EXISTS public.metrics_hourly_rollup (
  hour_bucket timestamptz NOT NULL,
  operation_name text NOT NULL,
  operation_type text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  p50_ms integer NOT NULL DEFAULT 0,
  p95_ms integer NOT NULL DEFAULT 0,
  p99_ms integer NOT NULL DEFAULT 0,
  max_ms integer NOT NULL DEFAULT 0,
  avg_ms integer NOT NULL DEFAULT 0,
  slow_count integer NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hour_bucket, operation_name, operation_type)
);

CREATE INDEX IF NOT EXISTS idx_metrics_rollup_hour ON public.metrics_hourly_rollup (hour_bucket DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_rollup_op ON public.metrics_hourly_rollup (operation_name, operation_type, hour_bucket DESC);

ALTER TABLE public.metrics_hourly_rollup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read rollups"
ON public.metrics_hourly_rollup FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Service writes rollups"
ON public.metrics_hourly_rollup FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 2) Função de agregação por hora
CREATE OR REPLACE FUNCTION public.rollup_performance_hour(p_hour timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bucket timestamptz;
  v_rows integer := 0;
BEGIN
  v_bucket := date_trunc('hour', p_hour);

  WITH agg AS (
    SELECT
      v_bucket AS hour_bucket,
      operation_name,
      operation_type,
      count(*)::int AS cnt,
      COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms), 0)::int AS p50,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), 0)::int AS p95,
      COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms), 0)::int AS p99,
      COALESCE(max(duration_ms), 0)::int AS mx,
      COALESCE(avg(duration_ms), 0)::int AS avgv,
      count(*) FILTER (WHERE is_slow = true)::int AS slow
    FROM public.performance_logs
    WHERE created_at >= v_bucket
      AND created_at < v_bucket + interval '1 hour'
    GROUP BY operation_name, operation_type
  )
  INSERT INTO public.metrics_hourly_rollup (
    hour_bucket, operation_name, operation_type,
    count, p50_ms, p95_ms, p99_ms, max_ms, avg_ms, slow_count, computed_at
  )
  SELECT
    hour_bucket, operation_name, operation_type,
    cnt, p50, p95, p99, mx, avgv, slow, now()
  FROM agg
  ON CONFLICT (hour_bucket, operation_name, operation_type) DO UPDATE SET
    count = EXCLUDED.count,
    p50_ms = EXCLUDED.p50_ms,
    p95_ms = EXCLUDED.p95_ms,
    p99_ms = EXCLUDED.p99_ms,
    max_ms = EXCLUDED.max_ms,
    avg_ms = EXCLUDED.avg_ms,
    slow_count = EXCLUDED.slow_count,
    computed_at = now();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;

COMMENT ON FUNCTION public.rollup_performance_hour IS
'Agrega performance_logs de uma hora específica usando percentile_cont. Upsert idempotente — pode ser re-rodado.';

-- 3) Helper chamado pelo cron — agrega a hora COMPLETA anterior
CREATE OR REPLACE FUNCTION public.run_performance_rollup()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target timestamptz;
BEGIN
  -- Hora anterior já fechada
  v_target := date_trunc('hour', now() - interval '1 hour');
  RETURN rollup_performance_hour(v_target);
END;
$$;

-- 4) Backfill das últimas 168 horas (7 dias)
DO $$
DECLARE
  i integer;
  v_hour timestamptz;
BEGIN
  FOR i IN 1..168 LOOP
    v_hour := date_trunc('hour', now() - (i || ' hours')::interval);
    PERFORM rollup_performance_hour(v_hour);
  END LOOP;
END $$;