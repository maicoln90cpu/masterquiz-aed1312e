-- =========================================================
-- Onda 4 / Etapa 4 — Snapshots de tamanho do banco
-- =========================================================

-- 1) Tabela de snapshots
CREATE TABLE IF NOT EXISTS public.db_size_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at timestamptz NOT NULL DEFAULT now(),
  total_bytes bigint NOT NULL DEFAULT 0,
  total_rows bigint NOT NULL DEFAULT 0,
  top_tables jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_db_size_snapshots_captured ON public.db_size_snapshots (captured_at DESC);

ALTER TABLE public.db_size_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read db snapshots"
ON public.db_size_snapshots FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Service writes db snapshots"
ON public.db_size_snapshots FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 2) Setting padrão de threshold (8 GB)
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES ('db_size_alert_threshold_mb', '8000')
ON CONFLICT (setting_key) DO NOTHING;

-- 3) Snapshot inicial — captura o estado atual para já termos 1 ponto no gráfico
DO $$
DECLARE
  v_total_bytes bigint;
  v_total_rows bigint;
  v_top jsonb;
BEGIN
  SELECT
    COALESCE(sum(total_bytes), 0),
    COALESCE(sum(row_estimate), 0)
  INTO v_total_bytes, v_total_rows
  FROM public.get_table_sizes();

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_top
  FROM (
    SELECT
      table_name AS name,
      total_bytes AS bytes,
      total_size AS size,
      row_estimate AS rows
    FROM public.get_table_sizes()
    ORDER BY total_bytes DESC
    LIMIT 10
  ) t;

  INSERT INTO public.db_size_snapshots (total_bytes, total_rows, top_tables)
  VALUES (v_total_bytes, v_total_rows, v_top);
END $$;

-- 4) Cron diário 03h UTC chamando a edge function
DO $$
DECLARE
  v_existing_jobid bigint;
  v_url text;
  v_key text;
BEGIN
  SELECT jobid INTO v_existing_jobid FROM cron.job WHERE jobname = 'capture-db-size-daily';
  IF v_existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_existing_jobid);
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;

  IF v_url IS NULL THEN v_url := 'https://kmmdzwoidakmbekqvkmq.supabase.co'; END IF;
  IF v_key IS NULL THEN v_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4'; END IF;

  PERFORM cron.schedule(
    'capture-db-size-daily',
    '0 3 * * *',
    format(
      $cron$SELECT net.http_post(
        url := %L,
        headers := %L::jsonb,
        body := '{}'::jsonb
      )$cron$,
      v_url || '/functions/v1/capture-db-size-snapshot',
      jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key)::text
    )
  );
END $$;

-- 5) Registrar no email_automation_config para aparecer no painel de cron com nome amigável
INSERT INTO public.email_automation_config (automation_key, display_name, description, is_enabled, frequency)
VALUES (
  'capture-db-size-daily',
  'Snapshot diário de tamanho do banco',
  'Captura tamanho total e top tabelas; alerta admins se cruzar 80% do limite ou crescer >20% em 7 dias.',
  true,
  'Diário às 03h UTC'
)
ON CONFLICT (automation_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;