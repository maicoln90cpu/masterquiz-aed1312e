
-- Tabela para rastrear cliques em CTAs da última etapa de quizzes funil
CREATE TABLE public.quiz_cta_click_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE SET NULL,
  block_id TEXT,
  cta_text TEXT,
  cta_url TEXT NOT NULL,
  step_number INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas de analytics
CREATE INDEX idx_cta_clicks_quiz_id ON public.quiz_cta_click_analytics(quiz_id);
CREATE INDEX idx_cta_clicks_quiz_date ON public.quiz_cta_click_analytics(quiz_id, date);
CREATE INDEX idx_cta_clicks_session ON public.quiz_cta_click_analytics(quiz_id, session_id);

-- RLS
ALTER TABLE public.quiz_cta_click_analytics ENABLE ROW LEVEL SECURITY;

-- Anon/auth podem inserir (tracking público)
CREATE POLICY "Anyone can insert CTA clicks"
  ON public.quiz_cta_click_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Owner do quiz pode ler
CREATE POLICY "Quiz owner can read CTA clicks"
  ON public.quiz_cta_click_analytics
  FOR SELECT
  TO authenticated
  USING (
    quiz_id IN (SELECT id FROM public.quizzes WHERE user_id = auth.uid())
  );
