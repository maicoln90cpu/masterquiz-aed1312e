-- Etapa 2: Trigger do 1º quiz publicado (tutorial email após 3 dias)

-- 1) Atualizar função: filtrar express_auto, checar unsubscribes, priority 5
CREATE OR REPLACE FUNCTION public.check_first_quiz_tutorial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_real_quiz_count bigint;
  v_template_id uuid;
  v_owner_email text;
BEGIN
  -- Ignorar quizzes auto-criados pelo modo Express
  IF COALESCE(NEW.creation_source, 'manual') = 'express_auto' THEN
    RETURN NEW;
  END IF;

  -- Contar apenas quizzes REAIS deste usuário (incluindo o novo)
  SELECT count(*) INTO v_real_quiz_count
  FROM quizzes
  WHERE user_id = NEW.user_id
    AND COALESCE(creation_source, 'manual') != 'express_auto';

  -- Só dispara no 1º quiz real
  IF v_real_quiz_count = 1 THEN
    -- Pega template ativo da categoria 'tutorial'
    SELECT id INTO v_template_id
    FROM email_recovery_templates
    WHERE category = 'tutorial' AND is_active = true
    ORDER BY priority DESC
    LIMIT 1;

    -- Sem template? loga aviso e sai sem quebrar
    IF v_template_id IS NULL THEN
      INSERT INTO email_automation_logs (automation_key, status, emails_sent, error_message, details)
      VALUES (
        'first_quiz_tutorial_trigger',
        'skipped',
        0,
        'Template ativo na categoria tutorial não encontrado',
        jsonb_build_object('user_id', NEW.user_id, 'quiz_id', NEW.id)
      );
      RETURN NEW;
    END IF;

    -- Pega email do owner
    SELECT email INTO v_owner_email
    FROM profiles WHERE id = NEW.user_id;

    IF v_owner_email IS NULL THEN
      RETURN NEW;
    END IF;

    -- Skip se usuário cancelou inscrição
    IF EXISTS (
      SELECT 1 FROM email_unsubscribes WHERE email = v_owner_email
    ) THEN
      RETURN NEW;
    END IF;

    -- Skip se já enfileirado
    IF EXISTS (
      SELECT 1 FROM email_recovery_contacts
      WHERE user_id = NEW.user_id AND template_id = v_template_id
    ) THEN
      RETURN NEW;
    END IF;

    -- Enfileirar email para 3 dias
    INSERT INTO email_recovery_contacts (
      user_id, email, template_id, status, priority,
      days_inactive_at_contact, user_quiz_count, user_lead_count,
      scheduled_at, user_plan_at_contact
    ) VALUES (
      NEW.user_id, v_owner_email, v_template_id, 'pending', 5,
      0, 1, 0,
      now() + interval '3 days', 'free'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Criar trigger que estava faltando
DROP TRIGGER IF EXISTS trigger_first_quiz_tutorial ON public.quizzes;

CREATE TRIGGER trigger_first_quiz_tutorial
AFTER INSERT ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.check_first_quiz_tutorial();