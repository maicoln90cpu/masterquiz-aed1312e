
CREATE OR REPLACE FUNCTION public.sync_plan_limits_to_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only sync if quiz_limit or response_limit changed
  IF OLD.quiz_limit IS DISTINCT FROM NEW.quiz_limit 
     OR OLD.response_limit IS DISTINCT FROM NEW.response_limit THEN
    
    UPDATE public.user_subscriptions
    SET 
      quiz_limit = NEW.quiz_limit,
      response_limit = NEW.response_limit,
      updated_at = now()
    WHERE plan_type = NEW.plan_type
      AND plan_type != 'admin';
    
    RAISE NOTICE 'Synced limits for plan % — quiz: %, response: %', 
      NEW.plan_type, NEW.quiz_limit, NEW.response_limit;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_sync_plan_limits
AFTER UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.sync_plan_limits_to_subscriptions();
