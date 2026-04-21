-- Adiciona coluna de versão para optimistic locking
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- Função que incrementa a versão a cada UPDATE
CREATE OR REPLACE FUNCTION public.increment_quiz_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só incrementa se a versão não foi explicitamente alterada nesta operação
  -- (evita double-increment quando o cliente já está enviando version+1)
  IF NEW.version IS NOT DISTINCT FROM OLD.version THEN
    NEW.version := COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger BEFORE UPDATE para incrementar versão
DROP TRIGGER IF EXISTS trg_increment_quiz_version ON public.quizzes;
CREATE TRIGGER trg_increment_quiz_version
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.increment_quiz_version();

-- Garante que registros existentes tenham versão 1
UPDATE public.quizzes SET version = 1 WHERE version IS NULL;