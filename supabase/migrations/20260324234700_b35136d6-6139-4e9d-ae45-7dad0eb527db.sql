ALTER TABLE public.quizzes 
  ADD COLUMN IF NOT EXISTS global_text_align text DEFAULT 'left',
  ADD COLUMN IF NOT EXISTS global_font_size text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS global_font_family text DEFAULT 'sans';