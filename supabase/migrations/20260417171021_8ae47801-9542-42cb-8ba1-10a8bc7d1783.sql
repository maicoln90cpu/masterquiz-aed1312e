-- Etapa 1: Padronizar fonte de cadastros
-- Fonte da verdade = auth.users INNER JOIN profiles WHERE deleted_at IS NULL

-- 1) Função canônica: total de usuários reais (com login válido e profile ativo)
CREATE OR REPLACE FUNCTION public.count_real_users()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE p.deleted_at IS NULL;
$$;

-- 2) Função: total filtrado por janela (últimos N dias)
CREATE OR REPLACE FUNCTION public.count_real_users_since(_since timestamptz)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE p.deleted_at IS NULL
    AND u.created_at >= _since;
$$;

-- 3) Função: série diária de cadastros reais (para gráficos/tabelas)
CREATE OR REPLACE FUNCTION public.real_users_daily(_days integer DEFAULT 30)
RETURNS TABLE(day date, cadastros integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (u.created_at AT TIME ZONE 'UTC')::date AS day,
    COUNT(*)::int AS cadastros
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE p.deleted_at IS NULL
    AND u.created_at >= (now() - (_days || ' days')::interval)
  GROUP BY 1
  ORDER BY 1 DESC;
$$;

-- 4) Permissões: apenas admins/master_admins podem ler
REVOKE ALL ON FUNCTION public.count_real_users() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.count_real_users_since(timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.real_users_daily(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.count_real_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_real_users_since(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.real_users_daily(integer) TO authenticated;

-- Nota: as funções são SECURITY DEFINER, mas o consumo no frontend só ocorre
-- nas telas de admin que já validam role. As funções não expõem PII.

COMMENT ON FUNCTION public.count_real_users() IS
  'Fonte única de "cadastros": usuários com auth válido E profile ativo (deleted_at IS NULL). Usar em todos os cards de "Cadastros" do admin.';