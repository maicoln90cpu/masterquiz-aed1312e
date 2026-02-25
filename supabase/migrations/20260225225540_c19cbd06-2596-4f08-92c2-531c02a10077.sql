
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_record RECORD;
BEGIN
  SELECT quiz_limit, response_limit 
  INTO plan_record
  FROM subscription_plans 
  WHERE plan_type = 'free' 
  LIMIT 1;

  INSERT INTO public.user_subscriptions (
    user_id, plan_type, status, quiz_limit, response_limit
  ) VALUES (
    NEW.id, 'free', 'active', 
    COALESCE(plan_record.quiz_limit, 1), 
    COALESCE(plan_record.response_limit, 100)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
