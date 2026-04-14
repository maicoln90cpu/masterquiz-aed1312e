
-- Add UTM tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

-- Index for analytics grouping by source
CREATE INDEX IF NOT EXISTS idx_profiles_utm_source ON public.profiles (utm_source) WHERE utm_source IS NOT NULL;
