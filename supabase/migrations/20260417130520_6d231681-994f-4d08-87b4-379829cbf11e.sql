-- 1) Atualizar função fn_upgrade_nudge_on_lead_limit:
--    - Bloqueio explícito de plano não-free
--    - Cooldown de 30 dias antes de reenviar
CREATE OR REPLACE FUNCTION public.fn_upgrade_nudge_on_lead_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _template_id uuid;
  _user_email text;
  _user_plan text;
  _is_unsubscribed boolean;
  _recent_count int;
BEGIN
  -- Só age em transição real
  IF (OLD.plan_limit_hit_type IS NOT DISTINCT FROM NEW.plan_limit_hit_type)
     OR NEW.plan_limit_hit_type IS DISTINCT FROM 'lead' THEN
    RETURN NEW;
  END IF;

  BEGIN
    -- Email do usuário
    _user_email := NEW.email;
    IF _user_email IS NULL OR _user_email = '' THEN
      INSERT INTO email_automation_logs (automation_key, status, emails_sent, details)
      VALUES ('upgrade_nudge_lead_limit', 'skipped', 0, jsonb_build_object('reason','no_email','user_id',NEW.id));
      RETURN NEW;
    END IF;

    -- Plano atual
    SELECT plan_type INTO _user_plan
    FROM user_subscriptions
    WHERE user_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;
    _user_plan := COALESCE(_user_plan, 'free');

    -- BLOQUEIO EXPLÍCITO: planos pagos não recebem upgrade nudge
    IF _user_plan != 'free' THEN
      INSERT INTO email_automation_logs (automation_key, status, emails_sent, details)
      VALUES ('upgrade_nudge_lead_limit', 'skipped', 0,
              jsonb_build_object('reason','paid_plan','plan',_user_plan,'user_id',NEW.id));
      RETURN NEW;
    END IF;

    -- Unsubscribe
    SELECT EXISTS(SELECT 1 FROM email_unsubscribes WHERE email = _user_email) INTO _is_unsubscribed;
    IF _is_unsubscribed THEN
      INSERT INTO email_automation_logs (automation_key, status, emails_sent, details)
      VALUES ('upgrade_nudge_lead_limit', 'skipped', 0,
              jsonb_build_object('reason','unsubscribed','user_id',NEW.id));
      RETURN NEW;
    END IF;

    -- Template ativo
    SELECT id INTO _template_id
    FROM email_recovery_templates
    WHERE category = 'upgrade_nudge' AND is_active = true
    ORDER BY priority DESC NULLS LAST, created_at DESC
    LIMIT 1;
    IF _template_id IS NULL THEN
      INSERT INTO email_automation_logs (automation_key, status, emails_sent, details)
      VALUES ('upgrade_nudge_lead_limit', 'skipped', 0,
              jsonb_build_object('reason','no_template','user_id',NEW.id));
      RETURN NEW;
    END IF;

    -- COOLDOWN 30 dias: não reenfileirar se já recebeu nudge recente
    SELECT COUNT(*) INTO _recent_count
    FROM email_recovery_contacts
    WHERE user_id = NEW.id
      AND template_id = _template_id
      AND created_at > now() - interval '30 days';
    IF _recent_count > 0 THEN
      INSERT INTO email_automation_logs (automation_key, status, emails_sent, details)
      VALUES ('upgrade_nudge_lead_limit', 'skipped', 0,
              jsonb_build_object('reason','cooldown_30d','user_id',NEW.id,'recent_count',_recent_count));
      RETURN NEW;
    END IF;

    -- Enfileira
    INSERT INTO email_recovery_contacts (
      user_id, email, template_id, status, priority,
      user_plan_at_contact, scheduled_at
    ) VALUES (
      NEW.id, _user_email, _template_id, 'pending', 100,
      _user_plan, now()
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO email_automation_logs (automation_key, status, emails_sent, details)
    VALUES ('upgrade_nudge_lead_limit', 'success', 1,
            jsonb_build_object('user_id',NEW.id,'template_id',_template_id));

  EXCEPTION WHEN OTHERS THEN
    INSERT INTO email_automation_logs (automation_key, status, emails_sent, details, error_message)
    VALUES ('upgrade_nudge_lead_limit', 'error', 0,
            jsonb_build_object('user_id',NEW.id), SQLERRM);
  END;

  RETURN NEW;
END;
$$;

-- 2) WhatsApp cooldown: 7 → 10 dias
UPDATE recovery_settings SET user_cooldown_days = 10 WHERE user_cooldown_days != 10;