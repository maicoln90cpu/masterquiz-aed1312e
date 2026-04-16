
-- ═══════════════════════════════════════════════════════════════
-- ETAPA 2 — ICP Tracking: M01, M03, M09, M10
-- ═══════════════════════════════════════════════════════════════

-- 1. Novas colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_lead_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS form_collection_configured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS landing_variant_seen TEXT,
  ADD COLUMN IF NOT EXISTS crm_interactions_count INTEGER NOT NULL DEFAULT 0;

-- 2. Estender set_profile_first_value para suportar TIMESTAMPTZ
-- (já existe da Etapa 1; recriamos para incluir colunas novas)
CREATE OR REPLACE FUNCTION public.set_profile_first_value(
  _column TEXT,
  _value TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  -- Whitelist explícita
  IF _column NOT IN (
    'plan_limit_hit_type',
    'ai_used_on_real_quiz',
    'landing_variant_seen',
    'first_lead_received_at',
    'form_collection_configured_at'
  ) THEN
    RAISE EXCEPTION 'Invalid column: %', _column;
  END IF;

  -- Bool: sempre marca true (idempotente)
  IF _column = 'ai_used_on_real_quiz' THEN
    UPDATE public.profiles SET ai_used_on_real_quiz = TRUE WHERE id = _uid;
    RETURN;
  END IF;

  -- Timestamps: grava só se IS NULL
  IF _column IN ('first_lead_received_at','form_collection_configured_at') THEN
    EXECUTE format(
      'UPDATE public.profiles SET %I = COALESCE(%I, NOW()) WHERE id = $1 AND %I IS NULL',
      _column, _column, _column
    ) USING _uid;
    RETURN;
  END IF;

  -- Texto: grava só se IS NULL
  EXECUTE format(
    'UPDATE public.profiles SET %I = COALESCE(%I, $1) WHERE id = $2 AND %I IS NULL',
    _column, _column, _column
  ) USING _value, _uid;
END;
$$;

-- 3. RPC para incrementar crm_interactions_count
-- (estender increment_profile_counter)
CREATE OR REPLACE FUNCTION public.increment_profile_counter(_column TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  IF _column NOT IN (
    'quiz_shared_count',
    'paywall_hit_count',
    'upgrade_clicked_count',
    'editor_sessions_count',
    'crm_interactions_count'
  ) THEN
    RAISE EXCEPTION 'Invalid column: %', _column;
  END IF;

  EXECUTE format(
    'UPDATE public.profiles SET %I = %I + 1 WHERE id = $1',
    _column, _column
  ) USING _uid;
END;
$$;

-- 4. Trigger em quiz_form_config: marca form_collection_configured_at
-- quando o quiz owner ativa pelo menos um campo de coleta
CREATE OR REPLACE FUNCTION public.mark_form_collection_configured()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner UUID;
BEGIN
  -- Só marca se algum campo de coleta está ativo
  IF NEW.collect_name OR NEW.collect_email OR NEW.collect_whatsapp THEN
    SELECT user_id INTO _owner FROM public.quizzes WHERE id = NEW.quiz_id;
    IF _owner IS NOT NULL THEN
      UPDATE public.profiles
      SET form_collection_configured_at = COALESCE(form_collection_configured_at, NOW())
      WHERE id = _owner AND form_collection_configured_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_form_collection_configured ON public.quiz_form_config;
CREATE TRIGGER trg_mark_form_collection_configured
AFTER INSERT OR UPDATE ON public.quiz_form_config
FOR EACH ROW
EXECUTE FUNCTION public.mark_form_collection_configured();

-- 5. RPC para marcar first_lead_received_at do owner do quiz
-- (chamada da edge function save-quiz-response que já roda como service_role)
CREATE OR REPLACE FUNCTION public.mark_first_lead_received(_owner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET first_lead_received_at = COALESCE(first_lead_received_at, NOW())
  WHERE id = _owner_id AND first_lead_received_at IS NULL;
END;
$$;
