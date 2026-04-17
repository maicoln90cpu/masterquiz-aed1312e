-- 1A: Adicionar coluna custom_link em recovery_contacts
ALTER TABLE public.recovery_contacts
ADD COLUMN IF NOT EXISTS custom_link TEXT NULL;

-- 1B: RPC preview_zombie_recipients (admin-only)
CREATE OR REPLACE FUNCTION public.preview_zombie_recipients()
RETURNS TABLE (
  user_id UUID,
  nome TEXT,
  email TEXT,
  whatsapp TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Acesso negado: requer privilégios de administrador';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name AS nome,
    p.email,
    p.whatsapp
  FROM public.profiles p
  WHERE COALESCE(p.login_count, 0) <= 1
    AND p.whatsapp IS NOT NULL
    AND length(trim(p.whatsapp)) >= 10
    AND p.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.user_id = p.id
        AND COALESCE(q.creation_source, '') <> 'express_auto'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.recovery_blacklist rb
      WHERE rb.user_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.recovery_contacts rc
      WHERE rc.user_id = p.id
        AND rc.created_at >= now() - interval '7 days'
    );
END;
$$;

-- 1C: RPC enqueue_zombie_campaign (admin-only)
CREATE OR REPLACE FUNCTION public.enqueue_zombie_campaign(p_campaign_id UUID, p_template_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master_admin'::app_role)) THEN
    RAISE EXCEPTION 'Acesso negado: requer privilégios de administrador';
  END IF;

  INSERT INTO public.recovery_contacts (
    user_id, campaign_id, template_id, phone_number, status, priority, scheduled_at
  )
  SELECT
    p.id,
    p_campaign_id,
    p_template_id,
    p.whatsapp,
    'pending',
    10,
    now()
  FROM public.profiles p
  WHERE COALESCE(p.login_count, 0) <= 1
    AND p.whatsapp IS NOT NULL
    AND length(trim(p.whatsapp)) >= 10
    AND p.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.user_id = p.id
        AND COALESCE(q.creation_source, '') <> 'express_auto'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.recovery_blacklist rb
      WHERE rb.user_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.recovery_contacts rc
      WHERE rc.user_id = p.id
        AND rc.created_at >= now() - interval '7 days'
    )
  ON CONFLICT (user_id, template_id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;