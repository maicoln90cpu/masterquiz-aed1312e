CREATE OR REPLACE FUNCTION public.generate_company_slug(p_email TEXT, p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_counter INTEGER := 2;
BEGIN
  -- Fallback se email for nulo/vazio
  IF p_email IS NULL OR p_email = '' THEN
    RETURN 'user-' || left(p_user_id::text, 8);
  END IF;

  -- Pega prefixo do email e normaliza
  v_base := lower(split_part(p_email, '@', 1));
  v_base := regexp_replace(v_base, '[^a-z0-9\-]', '-', 'g');
  v_base := regexp_replace(v_base, '-+', '-', 'g');
  v_base := trim(both '-' from v_base);

  -- Fallback se ficar muito curto
  IF length(v_base) < 2 THEN
    v_base := 'user-' || left(p_user_id::text, 8);
  END IF;

  v_slug := v_base;

  -- Garante unicidade
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_slug = v_slug
      AND id != p_user_id
  ) LOOP
    v_slug := v_base || '-' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN v_slug;
END;
$$;