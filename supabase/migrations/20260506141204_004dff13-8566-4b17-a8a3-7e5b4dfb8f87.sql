
DROP FUNCTION IF EXISTS public.real_users_daily(integer);

CREATE FUNCTION public.real_users_daily(_days integer DEFAULT 30)
RETURNS TABLE(day date, cadastros integer, perfil_on integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (u.created_at AT TIME ZONE 'UTC')::date AS day,
    COUNT(*)::int AS cadastros,
    COUNT(*) FILTER (WHERE p.is_icp_profile = true)::int AS perfil_on
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE p.deleted_at IS NULL
    AND u.created_at >= (now() - (_days || ' days')::interval)
  GROUP BY 1
  ORDER BY 1 DESC;
$$;

REVOKE ALL ON FUNCTION public.real_users_daily(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.real_users_daily(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.icp_daily_breakdown(_days integer DEFAULT 30)
RETURNS TABLE(day date, perfil_on integer, perfil_off integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (u.created_at AT TIME ZONE 'UTC')::date AS day,
    COUNT(*) FILTER (WHERE p.is_icp_profile = true)::int AS perfil_on,
    COUNT(*) FILTER (WHERE p.is_icp_profile IS DISTINCT FROM true)::int AS perfil_off
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE p.deleted_at IS NULL
    AND u.created_at >= (now() - (_days || ' days')::interval)
  GROUP BY 1
  ORDER BY 1 ASC;
$$;

REVOKE ALL ON FUNCTION public.icp_daily_breakdown(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.icp_daily_breakdown(integer) TO authenticated;

COMMENT ON FUNCTION public.icp_daily_breakdown(integer) IS
  'Série diária PerfilON vs PerfilOFF para gráfico em PQL Analytics.';

CREATE OR REPLACE FUNCTION public.enforce_icp_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_icp_profile IS NOT NULL
     AND NEW.is_icp_profile IS DISTINCT FROM OLD.is_icp_profile THEN
    RAISE EXCEPTION 'is_icp_profile is immutable after first write (ADR-014)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_icp_immutable ON public.profiles;
CREATE TRIGGER trg_enforce_icp_immutable
  BEFORE UPDATE OF is_icp_profile ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_icp_immutable();

COMMENT ON FUNCTION public.enforce_icp_immutable() IS
  'P11 - Garante imutabilidade de profiles.is_icp_profile após primeira gravação (ADR-014).';
