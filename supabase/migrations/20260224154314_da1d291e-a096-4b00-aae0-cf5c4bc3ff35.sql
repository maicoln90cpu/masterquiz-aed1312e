
-- Função para incrementar login_count
CREATE OR REPLACE FUNCTION public.increment_login_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET login_count = COALESCE(login_count, 0) + 1
  WHERE id = p_user_id;
END;
$$;
