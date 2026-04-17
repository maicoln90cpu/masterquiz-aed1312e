-- Função que sincroniza limites em user_subscriptions quando subscription_plans muda
CREATE OR REPLACE FUNCTION public.sync_user_subscription_limits_on_plan_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só sincroniza se algum dos limites relevantes mudou
  IF (NEW.quiz_limit IS DISTINCT FROM OLD.quiz_limit)
     OR (NEW.response_limit IS DISTINCT FROM OLD.response_limit) THEN

    UPDATE public.user_subscriptions
    SET 
      quiz_limit = NEW.quiz_limit,
      response_limit = NEW.response_limit,
      updated_at = now()
    WHERE plan_type = NEW.plan_type
      AND plan_type <> 'admin';

    RAISE NOTICE 'Synced limits for plan %: quiz_limit=%, response_limit=%',
      NEW.plan_type, NEW.quiz_limit, NEW.response_limit;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger antigo se existir
DROP TRIGGER IF EXISTS trg_sync_user_subscription_limits ON public.subscription_plans;

-- Cria o trigger
CREATE TRIGGER trg_sync_user_subscription_limits
AFTER UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_subscription_limits_on_plan_update();