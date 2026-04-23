-- 1. Add utm_content column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS utm_content text;

-- 2. Update handle_new_user_profile to capture utm_content
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    whatsapp,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'whatsapp',
    NEW.raw_user_meta_data->>'utm_source',
    NEW.raw_user_meta_data->>'utm_medium',
    NEW.raw_user_meta_data->>'utm_campaign',
    NEW.raw_user_meta_data->>'utm_term',
    NEW.raw_user_meta_data->>'utm_content'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    utm_source = COALESCE(public.profiles.utm_source, EXCLUDED.utm_source),
    utm_medium = COALESCE(public.profiles.utm_medium, EXCLUDED.utm_medium),
    utm_campaign = COALESCE(public.profiles.utm_campaign, EXCLUDED.utm_campaign),
    utm_term = COALESCE(public.profiles.utm_term, EXCLUDED.utm_term),
    utm_content = COALESCE(public.profiles.utm_content, EXCLUDED.utm_content);

  RETURN NEW;
END;
$$;