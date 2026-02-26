-- Add progress_style column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS progress_style text DEFAULT 'counter';

-- Add comment for documentation
COMMENT ON COLUMN public.quizzes.progress_style IS 'Progress display style: counter (X de Y), bar (progress bar), none (hidden)';