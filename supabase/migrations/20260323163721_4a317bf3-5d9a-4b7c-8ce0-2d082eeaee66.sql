ALTER TABLE public.quiz_responses ADD COLUMN session_id TEXT;
CREATE UNIQUE INDEX idx_quiz_responses_session ON public.quiz_responses(quiz_id, session_id) WHERE session_id IS NOT NULL;