CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  plan_record RECORD;
  current_site_mode TEXT;
  should_confirm BOOLEAN;
BEGIN
  SELECT quiz_limit, response_limit 
  INTO plan_record
  FROM subscription_plans 
  WHERE plan_type = 'free' 
  LIMIT 1;

  -- Check site mode to determine payment_confirmed default
  SELECT site_mode INTO current_site_mode
  FROM site_settings
  LIMIT 1;

  -- Mode A: payment confirmed by default; Mode B: requires payment
  should_confirm := COALESCE(current_site_mode, 'A') != 'B';

  INSERT INTO public.user_subscriptions (
    user_id, plan_type, status, quiz_limit, response_limit, payment_confirmed
  ) VALUES (
    NEW.id, 'free', 'active', 
    COALESCE(plan_record.quiz_limit, 1), 
    COALESCE(plan_record.response_limit, 100),
    should_confirm
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;