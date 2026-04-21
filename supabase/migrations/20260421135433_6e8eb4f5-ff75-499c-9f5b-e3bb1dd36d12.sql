-- Tabela de feedback dos usuários sobre quizzes gerados pela IA
CREATE TABLE public.ai_quiz_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  comment TEXT,
  would_use_as_is BOOLEAN,
  quiz_mode TEXT,
  model_used TEXT,
  questions_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_quiz_feedback_unique_user_gen UNIQUE (user_id, generation_id)
);

-- Índices para consultas analíticas no painel admin
CREATE INDEX idx_ai_quiz_feedback_generation ON public.ai_quiz_feedback (generation_id);
CREATE INDEX idx_ai_quiz_feedback_user ON public.ai_quiz_feedback (user_id);
CREATE INDEX idx_ai_quiz_feedback_created ON public.ai_quiz_feedback (created_at DESC);
CREATE INDEX idx_ai_quiz_feedback_mode_model ON public.ai_quiz_feedback (quiz_mode, model_used);

-- RLS
ALTER TABLE public.ai_quiz_feedback ENABLE ROW LEVEL SECURITY;

-- Usuário vê só o próprio
CREATE POLICY "Users view own feedback"
ON public.ai_quiz_feedback
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuário cria só o próprio
CREATE POLICY "Users insert own feedback"
ON public.ai_quiz_feedback
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Usuário atualiza só o próprio (caso queira mudar a nota)
CREATE POLICY "Users update own feedback"
ON public.ai_quiz_feedback
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins veem tudo
CREATE POLICY "Admins view all feedback"
ON public.ai_quiz_feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_ai_quiz_feedback_updated_at
BEFORE UPDATE ON public.ai_quiz_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();