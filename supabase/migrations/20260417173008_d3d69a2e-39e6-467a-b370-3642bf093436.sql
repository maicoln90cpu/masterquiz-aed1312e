-- ============================================================
-- ETAPA 5 — Nutrição (templates) + Card de Saúde do Ciclo
-- ============================================================

-- 1) Coluna para idempotência do aviso de 80%
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_limit_warning_sent_at timestamptz;

-- 2) Novo template: aviso aos 80% do limite de leads
INSERT INTO public.email_recovery_templates
  (name, category, subject, html_content, trigger_days, priority, is_active)
SELECT
  'Aviso — 80% do Limite de Leads',
  'limit_warning',
  '⚠️ Você já usou 80% dos seus leads este mês',
  $html$<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:auto;padding:20px">
<h2>Você está crescendo rápido 🚀</h2>
<p>Olá {{first_name}},</p>
<p>Notamos que você já capturou <strong>{{leads_used}} de {{leads_limit}} leads</strong> permitidos no seu plano <strong>{{plan_name}}</strong> — isso é <strong>80%</strong> do limite mensal.</p>
<p>Para evitar interrupção quando atingir 100%, considere fazer upgrade agora e continuar capturando sem parar:</p>
<p style="text-align:center;margin:30px 0">
  <a href="https://masterquiz.com.br/dashboard/billing" style="background:#7C3AED;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Ver planos disponíveis</a>
</p>
<p>Se preferir, pode aguardar — você ainda tem espaço. Apenas avisamos para você não ser pego de surpresa.</p>
<p>Equipe MasterQuizz</p>
</body></html>$html$,
  0,
  88,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_recovery_templates WHERE category = 'limit_warning'
);

-- 3) Reativar templates D17 e D21 do funil de upgrade
UPDATE public.email_recovery_templates
SET is_active = true
WHERE category IN ('plan_compare','special_offer') AND is_active = false;

-- 4) Função: ao receber lead, verifica se passou de 80% do limite
CREATE OR REPLACE FUNCTION public.check_plan_limit_warning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_full_name text;
  v_plan_name text;
  v_lead_limit int;
  v_leads_used int;
  v_template_id uuid;
  v_already_sent timestamptz;
BEGIN
  -- Apenas se há lead real
  IF NEW.respondent_email IS NULL AND NEW.respondent_whatsapp IS NULL THEN
    RETURN NEW;
  END IF;

  -- Quem é o dono do quiz?
  SELECT q.user_id INTO v_user_id
  FROM public.quizzes q WHERE q.id = NEW.quiz_id;

  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- Já enviado nos últimos 30 dias? Aborta.
  SELECT plan_limit_warning_sent_at, email, full_name
    INTO v_already_sent, v_email, v_full_name
  FROM public.profiles WHERE id = v_user_id;

  IF v_already_sent IS NOT NULL AND v_already_sent > now() - interval '30 days' THEN
    RETURN NEW;
  END IF;

  IF v_email IS NULL THEN RETURN NEW; END IF;

  -- Limites do plano atual
  SELECT sp.plan_name, sp.lead_limit
    INTO v_plan_name, v_lead_limit
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON sp.plan_type = us.plan_type
  WHERE us.user_id = v_user_id AND us.status = 'active'
  ORDER BY us.updated_at DESC
  LIMIT 1;

  -- Sem limite (plano ilimitado) ou sem assinatura → ignora
  IF v_lead_limit IS NULL OR v_lead_limit <= 0 THEN RETURN NEW; END IF;

  -- Leads do mês corrente
  SELECT COUNT(*) INTO v_leads_used
  FROM public.quiz_responses qr
  JOIN public.quizzes q ON q.id = qr.quiz_id
  WHERE q.user_id = v_user_id
    AND qr.completed_at >= date_trunc('month', now())
    AND (qr.respondent_email IS NOT NULL OR qr.respondent_whatsapp IS NOT NULL);

  -- Apenas dispara se cruzou 80% mas ainda < 100%
  IF v_leads_used < (v_lead_limit * 0.8)::int OR v_leads_used >= v_lead_limit THEN
    RETURN NEW;
  END IF;

  -- Template
  SELECT id INTO v_template_id
  FROM public.email_recovery_templates
  WHERE category = 'limit_warning' AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN RETURN NEW; END IF;

  -- Enfileira
  INSERT INTO public.email_recovery_contacts
    (user_id, email, template_id, status, priority, scheduled_at,
     user_lead_count, user_plan_at_contact)
  VALUES
    (v_user_id, v_email, v_template_id, 'pending', 88, now(),
     v_leads_used, v_plan_name);

  -- Marca idempotência
  UPDATE public.profiles
     SET plan_limit_warning_sent_at = now()
   WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quiz_responses_limit_warning ON public.quiz_responses;
CREATE TRIGGER trg_quiz_responses_limit_warning
AFTER INSERT ON public.quiz_responses
FOR EACH ROW
EXECUTE FUNCTION public.check_plan_limit_warning();

-- 5) View de saúde do ciclo de vida (consumida pelo card admin)
CREATE OR REPLACE VIEW public.v_lifecycle_health AS
WITH triggers AS (
  SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    t.tgenabled AS enabled_state
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE NOT t.tgisinternal
    AND t.tgname IN (
      'trg_profiles_welcome_message',          -- T1+T2
      'trg_profiles_welcome_on_whatsapp',      -- T7
      'trg_profiles_auto_company_slug',        -- T8
      'trg_quizzes_first_quiz_message',        -- T4
      'trg_quizzes_first_quiz_tutorial',       -- T3
      'trg_quiz_responses_lead_milestone',     -- T5
      'trg_profiles_upgrade_nudge',            -- T6
      'trg_quiz_responses_limit_warning'       -- novo (Etapa 5)
    )
)
SELECT
  tr.trigger_name,
  tr.table_name,
  tr.function_name,
  (tr.enabled_state = 'O') AS is_active,
  COALESCE((
    SELECT COUNT(*) FROM public.email_recovery_contacts
    WHERE created_at > now() - interval '24 hours'
  ), 0) AS emails_enqueued_24h,
  COALESCE((
    SELECT COUNT(*) FROM public.recovery_contacts
    WHERE created_at > now() - interval '24 hours'
  ), 0) AS whatsapp_enqueued_24h,
  COALESCE((
    SELECT COUNT(*) FROM public.email_recovery_contacts
    WHERE created_at > now() - interval '7 days'
  ), 0) AS emails_enqueued_7d,
  COALESCE((
    SELECT COUNT(*) FROM public.recovery_contacts
    WHERE created_at > now() - interval '7 days'
  ), 0) AS whatsapp_enqueued_7d
FROM triggers tr
ORDER BY tr.trigger_name;

GRANT SELECT ON public.v_lifecycle_health TO authenticated;