-- Etapa 1: Reduzir limites do plano Free
-- O trigger sync_plan_limits_to_subscriptions propagará para user_subscriptions automaticamente
UPDATE public.subscription_plans 
SET quiz_limit = 1, response_limit = 30, updated_at = now()
WHERE plan_type = 'free' AND is_active = true;