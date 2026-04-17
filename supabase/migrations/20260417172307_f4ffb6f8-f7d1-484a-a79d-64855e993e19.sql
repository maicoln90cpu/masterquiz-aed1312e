-- ============================================
-- CORREÇÃO PROBLEMA 1: Separar saúde de config x histórico de ACKs
-- ============================================
CREATE OR REPLACE VIEW public.v_evolution_webhook_health
WITH (security_invoker=on) AS
SELECT
  ((SELECT count(*) FROM recovery_contacts
    WHERE status = ANY (ARRAY['sent'::recovery_contact_status, 'delivered'::recovery_contact_status, 'read'::recovery_contact_status, 'responded'::recovery_contact_status])))::integer AS total_sent_or_more,
  ((SELECT count(*) FROM recovery_contacts
    WHERE status = 'sent'::recovery_contact_status AND delivered_at IS NULL))::integer AS stuck_sent_no_ack,
  ((SELECT count(*) FROM recovery_contacts
    WHERE status = 'delivered'::recovery_contact_status AND delivery_assumed = false))::integer AS confirmed_delivered_real,
  ((SELECT count(*) FROM recovery_contacts
    WHERE delivery_assumed = true))::integer AS delivered_assumed_count,
  ((SELECT count(*) FROM recovery_contacts
    WHERE read_at IS NOT NULL))::integer AS confirmed_read,
  (SELECT max(delivered_at) FROM recovery_contacts
    WHERE delivery_assumed = false AND delivered_at IS NOT NULL) AS last_real_delivery_ack_at,
  (SELECT max(read_at) FROM recovery_contacts
    WHERE read_at IS NOT NULL) AS last_read_ack_at,
  -- Saúde agora distingue: sem ACK histórico mas SEM mensagens recentes = OK aguardando
  -- Crítico só se houver mensagens nas últimas 48h sem nenhum ACK
  CASE
    WHEN (SELECT count(*) FROM recovery_contacts
          WHERE sent_at > now() - interval '48 hours' AND status IN ('sent','delivered')) = 0
      THEN 'idle_no_recent_messages'::text
    WHEN (SELECT count(*) FROM recovery_contacts
          WHERE delivery_assumed = false AND delivered_at IS NOT NULL) = 0
      AND (SELECT count(*) FROM recovery_contacts
           WHERE sent_at > now() - interval '48 hours') > 5
      THEN 'critical_no_ack_ever'::text
    WHEN (SELECT max(delivered_at) FROM recovery_contacts
          WHERE delivery_assumed = false) < (now() - interval '48 hours')
      THEN 'warning_no_recent_ack'::text
    ELSE 'healthy'::text
  END AS webhook_health;

-- ============================================
-- CORREÇÃO PROBLEMA 2: Recalcular contadores de TODAS as campanhas
-- ============================================
CREATE OR REPLACE FUNCTION public.recalc_recovery_campaign_counts(_campaign_id uuid DEFAULT NULL)
RETURNS TABLE(campaign_id uuid, name text, total_targets integer, queued_count integer, sent_count integer, delivered_count integer, read_count integer, responded_count integer, failed_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE recovery_campaigns c
  SET
    total_targets = sub.total,
    queued_count = sub.queued,
    sent_count = sub.sent_or_more,
    delivered_count = sub.delivered_or_more,
    read_count = sub.read_or_more,
    responded_count = sub.responded,
    failed_count = sub.failed,
    updated_at = now()
  FROM (
    SELECT
      rc.campaign_id AS cid,
      count(*)::int AS total,
      count(*) FILTER (WHERE rc.status = 'pending')::int AS queued,
      count(*) FILTER (WHERE rc.status IN ('sent','delivered','read','responded'))::int AS sent_or_more,
      count(*) FILTER (WHERE rc.status IN ('delivered','read','responded') OR rc.delivered_at IS NOT NULL)::int AS delivered_or_more,
      count(*) FILTER (WHERE rc.status IN ('read','responded') OR rc.read_at IS NOT NULL)::int AS read_or_more,
      count(*) FILTER (WHERE rc.status = 'responded')::int AS responded,
      count(*) FILTER (WHERE rc.status = 'failed')::int AS failed
    FROM recovery_contacts rc
    WHERE _campaign_id IS NULL OR rc.campaign_id = _campaign_id
    GROUP BY rc.campaign_id
  ) sub
  WHERE c.id = sub.cid
    AND (_campaign_id IS NULL OR c.id = _campaign_id);

  RETURN QUERY
  SELECT c.id, c.name, c.total_targets, c.queued_count, c.sent_count, c.delivered_count, c.read_count, c.responded_count, c.failed_count
  FROM recovery_campaigns c
  WHERE _campaign_id IS NULL OR c.id = _campaign_id;
END;
$$;

-- Recalcular agora para todas as campanhas existentes
SELECT public.recalc_recovery_campaign_counts(NULL);

-- ============================================
-- ETAPA 3 — PARTE 1: Triggers SQL (T1, T2, T7, T8)
-- Boas-vindas (email + WA) + auto company_slug
-- ============================================

-- Garante que set_company_slug_on_signup esteja com search_path seguro
CREATE OR REPLACE FUNCTION public.set_company_slug_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  counter int := 0;
BEGIN
  IF NEW.company_slug IS NOT NULL AND NEW.company_slug <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := lower(regexp_replace(
    coalesce(split_part(NEW.email, '@', 1), 'user'),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' OR length(base_slug) < 3 THEN
    base_slug := 'user-' || substr(NEW.id::text, 1, 8);
  END IF;

  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE company_slug = candidate AND id <> NEW.id) LOOP
    counter := counter + 1;
    candidate := base_slug || '-' || counter;
    IF counter > 50 THEN
      candidate := base_slug || '-' || substr(NEW.id::text, 1, 6);
      EXIT;
    END IF;
  END LOOP;

  NEW.company_slug := candidate;
  RETURN NEW;
END;
$$;

-- T8: BEFORE INSERT em profiles → auto company_slug
DROP TRIGGER IF EXISTS trg_profiles_auto_company_slug ON public.profiles;
CREATE TRIGGER trg_profiles_auto_company_slug
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_company_slug_on_signup();

-- T1+T2: AFTER INSERT em profiles → invoca send-welcome-message (email + WA juntos)
-- A função trigger_welcome_message já existe; aqui criamos o trigger
DROP TRIGGER IF EXISTS trg_profiles_welcome_message ON public.profiles;
CREATE TRIGGER trg_profiles_welcome_message
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_welcome_message();

-- T7: AFTER UPDATE OF whatsapp em profiles → boas-vindas WA quando user adiciona WA depois do cadastro
DROP TRIGGER IF EXISTS trg_profiles_welcome_on_whatsapp ON public.profiles;
CREATE TRIGGER trg_profiles_welcome_on_whatsapp
AFTER UPDATE OF whatsapp ON public.profiles
FOR EACH ROW
WHEN (OLD.whatsapp IS DISTINCT FROM NEW.whatsapp AND NEW.whatsapp IS NOT NULL AND NEW.whatsapp <> '')
EXECUTE FUNCTION public.trigger_welcome_on_whatsapp_update();

-- ============================================
-- Documentação dos triggers ativos
-- ============================================
COMMENT ON TRIGGER trg_profiles_auto_company_slug ON public.profiles IS 'Etapa 3 parte 1 — gera company_slug único automaticamente no cadastro';
COMMENT ON TRIGGER trg_profiles_welcome_message ON public.profiles IS 'Etapa 3 parte 1 — dispara email+WhatsApp de boas-vindas (T1+T2)';
COMMENT ON TRIGGER trg_profiles_welcome_on_whatsapp ON public.profiles IS 'Etapa 3 parte 1 — dispara WA de boas-vindas quando usuário adiciona WhatsApp depois (T7)';