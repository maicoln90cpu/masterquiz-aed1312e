ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS price_monthly_mode_b numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kiwify_checkout_url_mode_b text DEFAULT NULL;