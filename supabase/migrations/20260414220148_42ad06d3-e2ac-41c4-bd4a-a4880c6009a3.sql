-- Adicionar colunas de trial em user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS original_plan_type text,
ADD COLUMN IF NOT EXISTS trial_end_date timestamptz,
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_started_by uuid;

-- Índice para o cron job encontrar trials expirados rapidamente
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial_end_date 
ON public.user_subscriptions (trial_end_date) 
WHERE trial_end_date IS NOT NULL;