-- Etapa 4: Trigger upgrade_nudge_lead_limit_trigger
-- Captura primeira transição de plan_limit_hit_type → 'lead' e enfileira email de upgrade

CREATE OR REPLACE FUNCTION public.fn_upgrade_nudge_on_lead_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _template_id UUID;
  _user_email TEXT;
  _user_plan TEXT;
  _quiz_count INT;
  _lead_count INT;
  _is_unsubscribed BOOLEAN;
BEGIN
  -- Só dispara se transição real para 'lead' (de NULL ou de outro valor)
  IF NEW.plan_limit_hit_type IS DISTINCT FROM 'lead' THEN
    RETURN NEW;
  END IF;
  IF OLD.plan_limit_hit_type IS NOT DISTINCT FROM NEW.plan_limit_hit_type THEN
    RETURN NEW;
  END IF;

  -- Email obrigatório
  _user_email := NEW.email;
  IF _user_email IS NULL OR _user_email = '' THEN RETURN NEW; END IF;

  -- Filtro institucional
  IF _user_email ILIKE '%@professor%' OR _user_email ILIKE '%@aluno%' OR _user_email ILIKE '%@edu.%' THEN
    INSERT INTO public.email_automation_logs (automation_key, status, emails_sent, details)
    VALUES ('upgrade_nudge_lead_limit', 'skipped', 0,
      jsonb_build_object('reason', 'institutional_email', 'user_id', NEW.id));
    RETURN NEW;
  END IF;

  -- Verifica unsubscribe
  SELECT EXISTS(SELECT 1 FROM public.email_unsubscribes WHERE email = _user_email)
    INTO _is_unsubscribed;
  IF _is_unsubscribed THEN
    INSERT INTO public.email_automation_logs (automation_key, status, emails_sent, details)
    VALUES ('upgrade_nudge_lead_limit', 'skipped', 0,
      jsonb_build_object('reason', 'unsubscribed', 'user_id', NEW.id));
    RETURN NEW;
  END IF;

  -- Busca template ativo upgrade_nudge
  SELECT id INTO _template_id
  FROM public.email_recovery_templates
  WHERE category = 'upgrade_nudge' AND is_active = TRUE
  ORDER BY priority DESC, created_at ASC
  LIMIT 1;

  IF _template_id IS NULL THEN
    INSERT INTO public.email_automation_logs (automation_key, status, emails_sent, details, error_message)
    VALUES ('upgrade_nudge_lead_limit', 'error', 0,
      jsonb_build_object('user_id', NEW.id),
      'No active upgrade_nudge template found');
    RETURN NEW;
  END IF;

  -- Plano e estatísticas
  SELECT COALESCE(plan_type, 'free') INTO _user_plan
  FROM public.user_subscriptions WHERE user_id = NEW.id LIMIT 1;
  _user_plan := COALESCE(_user_plan, 'free');

  SELECT COUNT(*) INTO _quiz_count FROM public.quizzes WHERE user_id = NEW.id;
  SELECT COUNT(*) INTO _lead_count
    FROM public.quiz_responses qr
    JOIN public.quizzes q ON q.id = qr.quiz_id
    WHERE q.user_id = NEW.id;

  -- Enfileira contato (idempotente via UNIQUE constraint)
  INSERT INTO public.email_recovery_contacts (
    user_id, email, template_id, status, priority,
    days_inactive_at_contact, user_plan_at_contact,
    user_quiz_count, user_lead_count, scheduled_at
  ) VALUES (
    NEW.id, _user_email, _template_id, 'pending', 100,
    0, _user_plan, _quiz_count, _lead_count, NOW()
  )
  ON CONFLICT (user_id, template_id, campaign_id) DO NOTHING;

  INSERT INTO public.email_automation_logs (automation_key, status, emails_sent, details)
  VALUES ('upgrade_nudge_lead_limit', 'success', 1,
    jsonb_build_object('user_id', NEW.id, 'template_id', _template_id, 'plan', _user_plan));

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.email_automation_logs (automation_key, status, emails_sent, error_message, details)
  VALUES ('upgrade_nudge_lead_limit', 'error', 0, SQLERRM,
    jsonb_build_object('user_id', NEW.id));
  RETURN NEW;
END;
$$;

-- Trigger: dispara apenas quando plan_limit_hit_type muda
DROP TRIGGER IF EXISTS upgrade_nudge_lead_limit_trigger ON public.profiles;
CREATE TRIGGER upgrade_nudge_lead_limit_trigger
AFTER UPDATE OF plan_limit_hit_type ON public.profiles
FOR EACH ROW
WHEN (OLD.plan_limit_hit_type IS DISTINCT FROM NEW.plan_limit_hit_type)
EXECUTE FUNCTION public.fn_upgrade_nudge_on_lead_limit();

-- Registrar na tabela de configuração de automações para visibilidade
INSERT INTO public.email_automation_config (
  automation_key, display_name, description, frequency, is_enabled
) VALUES (
  'upgrade_nudge_lead_limit',
  'Upgrade Nudge — Limite de Leads',
  'Trigger automático: quando o usuário (free) atinge o limite de leads pela primeira vez (plan_limit_hit_type=lead), enfileira o template "Upgrade Nudge — Limite de Leads Atingido".',
  'on-event (trigger)',
  true
) ON CONFLICT (automation_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  frequency = EXCLUDED.frequency,
  updated_at = now();