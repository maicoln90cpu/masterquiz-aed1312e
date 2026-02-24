
-- Add login_count column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;
