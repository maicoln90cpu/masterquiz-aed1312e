-- =========================================================
-- Onda 4 / Etapa 1 — Fingerprint estável de erros
-- =========================================================

-- 1) Função IMMUTABLE para normalizar mensagens e gerar fingerprint
CREATE OR REPLACE FUNCTION public.compute_error_fingerprint(
  p_component text,
  p_message text
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_component text;
  v_message text;
BEGIN
  v_component := COALESCE(NULLIF(trim(p_component), ''), 'Unknown');
  v_message := COALESCE(p_message, '');

  -- Normalizações em cascata (cada uma reduz ruído):
  -- a) UUIDs
  v_message := regexp_replace(v_message, '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<UUID>', 'gi');
  -- b) Hashes longos hex (chunk-abc123def456.js)
  v_message := regexp_replace(v_message, '[0-9a-f]{8,}', '<HASH>', 'gi');
  -- c) URLs http(s)://...
  v_message := regexp_replace(v_message, 'https?://[^\s"'')]+', '<URL>', 'gi');
  -- d) Caminhos de arquivo (/path/to/file.ext ou C:\...)
  v_message := regexp_replace(v_message, '(/[\w\-./]+\.[a-z]{2,5})', '<PATH>', 'gi');
  -- e) Números (timestamps, IDs numéricos, portas)
  v_message := regexp_replace(v_message, '\d+', '<N>', 'g');
  -- f) Aspas com conteúdo variável "abc" → "<STR>"
  v_message := regexp_replace(v_message, '"[^"]{3,}"', '"<STR>"', 'g');
  -- g) Espaços extras
  v_message := regexp_replace(trim(v_message), '\s+', ' ', 'g');
  -- h) Lowercase
  v_message := lower(v_message);

  RETURN md5(v_component || '::' || v_message);
END;
$$;

COMMENT ON FUNCTION public.compute_error_fingerprint IS
'Gera fingerprint MD5 estável de um erro normalizando UUIDs, hashes, URLs, paths e números. IMMUTABLE para permitir uso em índices.';

-- 2) Tabela de fingerprints agregados
CREATE TABLE IF NOT EXISTS public.error_fingerprints (
  fingerprint text PRIMARY KEY,
  component_name text NOT NULL,
  sample_message text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  total_count integer NOT NULL DEFAULT 1,
  last_user_id uuid,
  last_url text
);

CREATE INDEX IF NOT EXISTS idx_error_fingerprints_last_seen ON public.error_fingerprints (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_fingerprints_count ON public.error_fingerprints (total_count DESC);

ALTER TABLE public.error_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read error fingerprints"
ON public.error_fingerprints FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Service writes error fingerprints"
ON public.error_fingerprints FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 3) Tabela de documentação de erros conhecidos
CREATE TABLE IF NOT EXISTS public.known_errors (
  fingerprint text PRIMARY KEY REFERENCES public.error_fingerprints(fingerprint) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  resolution text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_ignored boolean NOT NULL DEFAULT false,
  documented_by uuid,
  documented_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_known_errors_ignored ON public.known_errors (is_ignored);

ALTER TABLE public.known_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage known errors"
ON public.known_errors FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Trigger updated_at em known_errors
CREATE OR REPLACE FUNCTION public.update_known_errors_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_known_errors_updated_at ON public.known_errors;
CREATE TRIGGER trg_known_errors_updated_at
BEFORE UPDATE ON public.known_errors
FOR EACH ROW EXECUTE FUNCTION public.update_known_errors_updated_at();

-- 4) Trigger AFTER INSERT em client_error_logs → upsert fingerprint
CREATE OR REPLACE FUNCTION public.upsert_error_fingerprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fp text;
  v_component text;
BEGIN
  BEGIN
    v_component := COALESCE(NULLIF(trim(NEW.component_name), ''), 'Unknown');
    v_fp := compute_error_fingerprint(v_component, NEW.error_message);

    INSERT INTO public.error_fingerprints (
      fingerprint, component_name, sample_message,
      first_seen_at, last_seen_at, total_count,
      last_user_id, last_url
    ) VALUES (
      v_fp, v_component, NEW.error_message,
      NEW.created_at, NEW.created_at, 1,
      NEW.user_id, NEW.url
    )
    ON CONFLICT (fingerprint) DO UPDATE SET
      last_seen_at = GREATEST(error_fingerprints.last_seen_at, EXCLUDED.last_seen_at),
      total_count = error_fingerprints.total_count + 1,
      last_user_id = EXCLUDED.last_user_id,
      last_url = EXCLUDED.last_url,
      sample_message = CASE
        WHEN length(EXCLUDED.sample_message) > length(error_fingerprints.sample_message)
          AND length(EXCLUDED.sample_message) < 500
        THEN EXCLUDED.sample_message
        ELSE error_fingerprints.sample_message
      END;

  EXCEPTION WHEN OTHERS THEN
    -- Nunca quebrar o INSERT do log original
    RETURN NEW;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_upsert_error_fingerprint ON public.client_error_logs;
CREATE TRIGGER trg_upsert_error_fingerprint
AFTER INSERT ON public.client_error_logs
FOR EACH ROW EXECUTE FUNCTION public.upsert_error_fingerprint();

-- 5) Backfill dos logs existentes
DO $$
DECLARE
  r record;
  v_fp text;
  v_component text;
BEGIN
  FOR r IN SELECT id, component_name, error_message, created_at, user_id, url
           FROM public.client_error_logs
           ORDER BY created_at ASC
  LOOP
    BEGIN
      v_component := COALESCE(NULLIF(trim(r.component_name), ''), 'Unknown');
      v_fp := compute_error_fingerprint(v_component, r.error_message);

      INSERT INTO public.error_fingerprints (
        fingerprint, component_name, sample_message,
        first_seen_at, last_seen_at, total_count,
        last_user_id, last_url
      ) VALUES (
        v_fp, v_component, r.error_message,
        r.created_at, r.created_at, 1,
        r.user_id, r.url
      )
      ON CONFLICT (fingerprint) DO UPDATE SET
        last_seen_at = GREATEST(error_fingerprints.last_seen_at, EXCLUDED.last_seen_at),
        first_seen_at = LEAST(error_fingerprints.first_seen_at, EXCLUDED.first_seen_at),
        total_count = error_fingerprints.total_count + 1;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;
END $$;

-- 6) RPC get_top_errors com guard de role
CREATE OR REPLACE FUNCTION public.get_top_errors(
  p_days integer DEFAULT 7,
  p_limit integer DEFAULT 50
) RETURNS TABLE (
  fingerprint text,
  component_name text,
  sample_message text,
  count_period bigint,
  total_count integer,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  last_url text,
  known_title text,
  known_severity text,
  known_resolution text,
  is_ignored boolean,
  is_documented boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admin ou master_admin podem consultar top errors';
  END IF;

  RETURN QUERY
  WITH period AS (
    SELECT
      compute_error_fingerprint(COALESCE(NULLIF(trim(cel.component_name), ''), 'Unknown'), cel.error_message) AS fp,
      count(*)::bigint AS cnt
    FROM public.client_error_logs cel
    WHERE cel.created_at >= now() - (p_days || ' days')::interval
    GROUP BY 1
  )
  SELECT
    ef.fingerprint,
    ef.component_name,
    ef.sample_message,
    COALESCE(p.cnt, 0)::bigint AS count_period,
    ef.total_count,
    ef.first_seen_at,
    ef.last_seen_at,
    ef.last_url,
    ke.title AS known_title,
    ke.severity AS known_severity,
    ke.resolution AS known_resolution,
    COALESCE(ke.is_ignored, false) AS is_ignored,
    (ke.fingerprint IS NOT NULL) AS is_documented
  FROM public.error_fingerprints ef
  LEFT JOIN period p ON p.fp = ef.fingerprint
  LEFT JOIN public.known_errors ke ON ke.fingerprint = ef.fingerprint
  WHERE COALESCE(p.cnt, 0) > 0
  ORDER BY count_period DESC, ef.last_seen_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_top_errors IS
'Retorna top N erros do período (em dias). Apenas admin/master_admin. Já une com known_errors para mostrar status de documentação.';

-- 7) RPC para listar últimas ocorrências de um fingerprint (para o dialog)
CREATE OR REPLACE FUNCTION public.get_error_occurrences(
  p_fingerprint text,
  p_limit integer DEFAULT 10
) RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  error_message text,
  url text,
  user_id uuid,
  user_agent text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT cel.id, cel.created_at, cel.error_message, cel.url, cel.user_id, cel.user_agent
  FROM public.client_error_logs cel
  WHERE compute_error_fingerprint(COALESCE(NULLIF(trim(cel.component_name), ''), 'Unknown'), cel.error_message) = p_fingerprint
  ORDER BY cel.created_at DESC
  LIMIT p_limit;
END;
$$;