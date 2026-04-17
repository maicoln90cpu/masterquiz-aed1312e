CREATE OR REPLACE FUNCTION public.set_company_slug_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_slug IS NULL OR NEW.company_slug = '' THEN
    NEW.company_slug := public.generate_company_slug(NEW.email, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_set_company_slug ON public.profiles;

CREATE TRIGGER auto_set_company_slug
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_company_slug_on_signup();