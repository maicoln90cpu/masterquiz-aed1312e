ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objective_selected_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.objective_selected_at IS
  'Timestamp imutável da PRIMEIRA seleção de objetivo em /start (carimbo de dedup do evento GTM objective_selected). Atualizações subsequentes preservam o valor original.';