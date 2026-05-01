CREATE OR REPLACE FUNCTION public.delete_user_by_id(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.has_role(auth.uid(), 'admin'::app_role)
          OR public.has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Acesso negado — somente admins podem deletar usuários'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
  RAISE NOTICE 'User % deleted successfully', target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_by_id(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(uuid) TO authenticated;