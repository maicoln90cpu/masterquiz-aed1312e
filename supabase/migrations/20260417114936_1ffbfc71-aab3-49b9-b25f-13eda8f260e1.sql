-- Etapa 6: Slugs reservados + validação backend
-- ============================================================

-- 1) Função is_reserved_slug
CREATE OR REPLACE FUNCTION public.is_reserved_slug(_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(_slug, '')) = ANY(ARRAY[
    'admin','app','api','dashboard','blog','support','masteradm','auth','login','signup',
    'settings','quiz','public','www','mail','help','docs','status','about','contact',
    'pricing','precos','privacy','terms','assets','static','root','system','undefined','null',
    'masterquiz','masterquizz','master','administrator','administrador','config','configuracoes',
    'webhook','webhooks','functions','cron','health','metrics','analytics','crm','dev','test'
  ]);
$$;

GRANT EXECUTE ON FUNCTION public.is_reserved_slug(text) TO anon, authenticated;

-- 2) Atualizar generate_company_slug para evitar gerar slug reservado
CREATE OR REPLACE FUNCTION public.generate_company_slug(p_email text, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base TEXT;
  v_slug TEXT;
  v_counter INTEGER := 2;
BEGIN
  IF p_email IS NULL OR p_email = '' THEN
    RETURN 'user-' || left(p_user_id::text, 8);
  END IF;

  v_base := lower(split_part(p_email, '@', 1));
  v_base := regexp_replace(v_base, '[^a-z0-9\-]', '-', 'g');
  v_base := regexp_replace(v_base, '-+', '-', 'g');
  v_base := trim(both '-' from v_base);

  IF length(v_base) < 2 THEN
    v_base := 'user-' || left(p_user_id::text, 8);
  END IF;

  -- Se base for reservado, prefixar 'user-' para nunca gerar slug protegido
  IF public.is_reserved_slug(v_base) THEN
    v_base := 'user-' || v_base;
  END IF;

  v_slug := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_slug = v_slug AND id != p_user_id
  ) LOOP
    v_slug := v_base || '-' || v_counter;
    v_counter := v_counter + 1;
  END LOOP;

  RETURN v_slug;
END;
$$;

-- 3) Trigger de validação BEFORE INSERT/UPDATE em profiles
CREATE OR REPLACE FUNCTION public.fn_validate_company_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- NULL ou vazio é permitido (perfil sem slug customizado)
  IF NEW.company_slug IS NULL OR NEW.company_slug = '' THEN
    RETURN NEW;
  END IF;

  -- Só valida se houve mudança (evita falhar em UPDATEs de outras colunas)
  IF TG_OP = 'UPDATE' AND OLD.company_slug IS NOT DISTINCT FROM NEW.company_slug THEN
    RETURN NEW;
  END IF;

  -- Formato
  IF NEW.company_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug inválido: use apenas letras minúsculas, números e hífens'
      USING ERRCODE = '22023';
  END IF;

  IF length(NEW.company_slug) < 2 THEN
    RAISE EXCEPTION 'Slug deve ter pelo menos 2 caracteres' USING ERRCODE = '22023';
  END IF;

  IF length(NEW.company_slug) > 50 THEN
    RAISE EXCEPTION 'Slug deve ter no máximo 50 caracteres' USING ERRCODE = '22023';
  END IF;

  -- Reservado
  IF public.is_reserved_slug(NEW.company_slug) THEN
    RAISE EXCEPTION 'Slug reservado: "%" é um nome reservado do sistema', NEW.company_slug
      USING ERRCODE = '23514';
  END IF;

  -- Unicidade (defesa em profundidade — também há índice/check no app)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE company_slug = NEW.company_slug AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Slug "%" já está em uso por outro usuário', NEW.company_slug
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_company_slug ON public.profiles;
CREATE TRIGGER validate_company_slug
BEFORE INSERT OR UPDATE OF company_slug ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_company_slug();

-- 4) RPC check_slug_available — combina reservado + unicidade em 1 chamada
CREATE OR REPLACE FUNCTION public.check_slug_available(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _exists BOOLEAN;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'unauthorized');
  END IF;

  IF _slug IS NULL OR _slug = '' THEN
    RETURN jsonb_build_object('available', true, 'reason', 'empty');
  END IF;

  IF _slug !~ '^[a-z0-9-]+$' OR length(_slug) < 2 OR length(_slug) > 50 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'invalid_format');
  END IF;

  IF public.is_reserved_slug(_slug) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'reserved');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE company_slug = _slug AND id != _uid
  ) INTO _exists;

  IF _exists THEN
    RETURN jsonb_build_object('available', false, 'reason', 'taken');
  END IF;

  RETURN jsonb_build_object('available', true, 'reason', 'ok');
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO authenticated;