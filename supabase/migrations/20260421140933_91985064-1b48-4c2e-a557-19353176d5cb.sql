
-- ============================================================
-- ONDA 3: Editor de Prompts com Versionamento + A/B Test
-- ============================================================

-- 1. Tabela de versões de prompts
CREATE TABLE public.ai_prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('form', 'pdf', 'educational', 'pdf_educational', 'pdf_traffic')),
  version_label TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  change_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  UNIQUE (mode, version_label)
);

CREATE INDEX idx_ai_prompt_versions_mode_status ON public.ai_prompt_versions (mode, status);

-- Apenas 1 versão active por modo (parcial unique index)
CREATE UNIQUE INDEX idx_ai_prompt_versions_one_active_per_mode
  ON public.ai_prompt_versions (mode) WHERE status = 'active';

ALTER TABLE public.ai_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prompt versions"
  ON public.ai_prompt_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Service role precisa ler versões ativas (edge function usa anon + auth do user, mas vai ler via select com policy)
CREATE POLICY "Authenticated read active prompt versions"
  ON public.ai_prompt_versions FOR SELECT TO authenticated
  USING (status = 'active');

-- 2. Tabela de A/B tests entre prompts
CREATE TABLE public.ai_prompt_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('form', 'pdf', 'educational', 'pdf_educational', 'pdf_traffic')),
  name TEXT NOT NULL,
  variant_a_id UUID NOT NULL REFERENCES public.ai_prompt_versions(id) ON DELETE RESTRICT,
  variant_b_id UUID NOT NULL REFERENCES public.ai_prompt_versions(id) ON DELETE RESTRICT,
  traffic_split_b INTEGER NOT NULL DEFAULT 50 CHECK (traffic_split_b BETWEEN 1 AND 99),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hypothesis TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  CHECK (variant_a_id <> variant_b_id)
);

CREATE INDEX idx_ai_prompt_ab_tests_mode_active ON public.ai_prompt_ab_tests (mode, is_active);

-- Apenas 1 teste ativo por modo
CREATE UNIQUE INDEX idx_ai_prompt_ab_tests_one_active_per_mode
  ON public.ai_prompt_ab_tests (mode) WHERE is_active = true;

ALTER TABLE public.ai_prompt_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prompt ab tests"
  ON public.ai_prompt_ab_tests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Authenticated read active prompt ab tests"
  ON public.ai_prompt_ab_tests FOR SELECT TO authenticated
  USING (is_active = true);

-- 3. Adicionar prompt_version_id em ai_quiz_generations para correlacionar
ALTER TABLE public.ai_quiz_generations
  ADD COLUMN prompt_version_id UUID REFERENCES public.ai_prompt_versions(id) ON DELETE SET NULL,
  ADD COLUMN ab_test_id UUID REFERENCES public.ai_prompt_ab_tests(id) ON DELETE SET NULL,
  ADD COLUMN ab_variant TEXT CHECK (ab_variant IN ('A', 'B'));

CREATE INDEX idx_ai_quiz_generations_prompt_version ON public.ai_quiz_generations (prompt_version_id);
CREATE INDEX idx_ai_quiz_generations_ab_test ON public.ai_quiz_generations (ab_test_id);

-- 4. Trigger para updated_at
CREATE TRIGGER trg_ai_prompt_versions_updated_at
  BEFORE UPDATE ON public.ai_prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_ai_prompt_ab_tests_updated_at
  BEFORE UPDATE ON public.ai_prompt_ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Trigger: ao ativar uma versão, arquivar a anterior do mesmo modo
CREATE OR REPLACE FUNCTION public.archive_previous_active_prompt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status <> 'active') THEN
    UPDATE public.ai_prompt_versions
       SET status = 'archived', archived_at = now()
     WHERE mode = NEW.mode
       AND status = 'active'
       AND id <> NEW.id;
    NEW.activated_at := now();
  END IF;
  IF NEW.status = 'archived' AND OLD.status <> 'archived' THEN
    NEW.archived_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_archive_previous_active_prompt
  BEFORE INSERT OR UPDATE ON public.ai_prompt_versions
  FOR EACH ROW EXECUTE FUNCTION public.archive_previous_active_prompt();

-- 6. View para análise de performance por versão (junta feedback + gerações)
CREATE OR REPLACE VIEW public.ai_prompt_version_performance
WITH (security_invoker = true) AS
SELECT
  v.id AS version_id,
  v.mode,
  v.version_label,
  v.status,
  COUNT(DISTINCT g.id) AS total_generations,
  COUNT(DISTINCT f.id) AS total_feedbacks,
  ROUND(AVG(f.rating)::numeric, 2) AS avg_rating,
  ROUND(AVG(CASE WHEN f.would_use_as_is THEN 1.0 ELSE 0.0 END) * 100, 1) AS pct_would_use_as_is,
  ROUND(AVG(g.estimated_cost_usd)::numeric, 6) AS avg_cost_usd,
  ROUND(AVG(g.total_tokens)::numeric, 0) AS avg_tokens
FROM public.ai_prompt_versions v
LEFT JOIN public.ai_quiz_generations g ON g.prompt_version_id = v.id
LEFT JOIN public.ai_quiz_feedback f ON f.generation_id = g.id
GROUP BY v.id, v.mode, v.version_label, v.status;
