-- ============================================
-- ETAPA 1 — ICP Tracking: 7 colunas + 2 RPCs
-- ============================================

-- 1. Adicionar colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quiz_shared_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paywall_hit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_limit_hit_type text,
  ADD COLUMN IF NOT EXISTS upgrade_clicked_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS editor_sessions_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS ai_used_on_real_quiz boolean NOT NULL DEFAULT false;

-- Comentários documentando uso
COMMENT ON COLUMN public.profiles.quiz_shared_count IS 'M02: Vezes que o usuário compartilhou link de quiz';
COMMENT ON COLUMN public.profiles.paywall_hit_count IS 'M04: Vezes que viu paywall (Pricing/Checkout)';
COMMENT ON COLUMN public.profiles.plan_limit_hit_type IS 'M05: Primeiro tipo de limite atingido (quiz/response/lead/ai)';
COMMENT ON COLUMN public.profiles.upgrade_clicked_count IS 'M06: Cliques em botões de upgrade sem converter';
COMMENT ON COLUMN public.profiles.editor_sessions_count IS 'M07: Sessões no editor de quiz';
COMMENT ON COLUMN public.profiles.utm_term IS 'M08: Keyword exata do Google Ads que gerou o cadastro';
COMMENT ON COLUMN public.profiles.ai_used_on_real_quiz IS 'M11: Se usou IA em quiz manual (não Express)';

-- 2. RPC: incremento atômico de contador
CREATE OR REPLACE FUNCTION public.increment_profile_counter(_column text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _allowed_columns text[] := ARRAY[
    'quiz_shared_count',
    'paywall_hit_count',
    'upgrade_clicked_count',
    'editor_sessions_count'
  ];
BEGIN
  -- Guard: usuário precisa estar autenticado
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Guard: whitelist de colunas (previne SQL injection)
  IF NOT (_column = ANY(_allowed_columns)) THEN
    RAISE EXCEPTION 'Column % is not allowed for increment', _column;
  END IF;

  -- Atualização atômica (col = col + 1 é atômico no Postgres)
  EXECUTE format(
    'UPDATE public.profiles SET %I = %I + 1, updated_at = now() WHERE id = $1',
    _column, _column
  ) USING _user_id;
END;
$$;

-- 3. RPC: gravar valor apenas na primeira vez (idempotente)
CREATE OR REPLACE FUNCTION public.set_profile_first_value(_column text, _value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _allowed_text_columns text[] := ARRAY['plan_limit_hit_type'];
  _allowed_bool_columns text[] := ARRAY['ai_used_on_real_quiz'];
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Coluna texto: só grava se NULL
  IF _column = ANY(_allowed_text_columns) THEN
    EXECUTE format(
      'UPDATE public.profiles SET %I = $1, updated_at = now() WHERE id = $2 AND %I IS NULL',
      _column, _column
    ) USING _value, _user_id;
    RETURN;
  END IF;

  -- Coluna boolean: só grava se for false (uma vez true, fica true)
  IF _column = ANY(_allowed_bool_columns) THEN
    EXECUTE format(
      'UPDATE public.profiles SET %I = true, updated_at = now() WHERE id = $1 AND %I = false',
      _column, _column
    ) USING _user_id;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Column % is not allowed for set_first_value', _column;
END;
$$;

-- 4. Atualizar trigger de criação de perfil para capturar utm_term
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    whatsapp,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'utm_source',
    NEW.raw_user_meta_data->>'utm_medium',
    NEW.raw_user_meta_data->>'utm_campaign',
    NEW.raw_user_meta_data->>'utm_term'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    utm_source = COALESCE(public.profiles.utm_source, EXCLUDED.utm_source),
    utm_medium = COALESCE(public.profiles.utm_medium, EXCLUDED.utm_medium),
    utm_campaign = COALESCE(public.profiles.utm_campaign, EXCLUDED.utm_campaign),
    utm_term = COALESCE(public.profiles.utm_term, EXCLUDED.utm_term);

  RETURN NEW;
END;
$$;