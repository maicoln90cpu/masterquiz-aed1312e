
-- 1) Desacoplar trigger_welcome_message de is_active
-- Welcome deve depender apenas de is_connected
CREATE OR REPLACE FUNCTION public.trigger_welcome_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  welcome_enabled BOOLEAN;
BEGIN
  -- Só dispara se o usuário tem WhatsApp
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  -- Verifica se o WhatsApp está conectado (NÃO verifica is_active)
  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  -- Verifica se existe template de welcome ativo
  SELECT EXISTS (
    SELECT 1 FROM recovery_templates 
    WHERE category = 'welcome' AND is_active = true
  ) INTO welcome_enabled;

  IF NOT welcome_enabled THEN
    RETURN NEW;
  END IF;

  -- Adiciona na fila de recovery_contacts para ser processado
  INSERT INTO recovery_contacts (
    user_id,
    phone_number,
    status,
    priority,
    days_inactive_at_contact,
    scheduled_at
  ) VALUES (
    NEW.id,
    NEW.whatsapp,
    'pending',
    -1,
    0,
    now()
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 2) Desacoplar trigger_welcome_on_whatsapp_update de is_active
CREATE OR REPLACE FUNCTION public.trigger_welcome_on_whatsapp_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  already_contacted BOOLEAN;
BEGIN
  -- Só dispara se WhatsApp foi adicionado (era null/vazio e agora tem valor)
  IF (OLD.whatsapp IS NOT NULL AND OLD.whatsapp != '') THEN
    RETURN NEW;
  END IF;
  
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  -- Verifica se já foi contatado antes
  SELECT EXISTS (
    SELECT 1 FROM recovery_contacts 
    WHERE user_id = NEW.id
  ) INTO already_contacted;

  IF already_contacted THEN
    RETURN NEW;
  END IF;

  -- Verifica se o WhatsApp está conectado (NÃO verifica is_active)
  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  -- Adiciona na fila
  INSERT INTO recovery_contacts (
    user_id,
    phone_number,
    status,
    priority,
    days_inactive_at_contact,
    scheduled_at
  ) VALUES (
    NEW.id,
    NEW.whatsapp,
    'pending',
    -1,
    0,
    now()
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 3) Desacoplar trigger_first_quiz_message de is_active
CREATE OR REPLACE FUNCTION public.trigger_first_quiz_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  quiz_count INTEGER;
  user_whatsapp TEXT;
BEGIN
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO quiz_count
  FROM quizzes
  WHERE user_id = NEW.user_id
    AND status = 'active'
    AND id != NEW.id;

  IF quiz_count > 0 THEN
    RETURN NEW;
  END IF;

  SELECT whatsapp INTO user_whatsapp
  FROM profiles
  WHERE id = NEW.user_id;

  IF user_whatsapp IS NULL OR user_whatsapp = '' THEN
    RETURN NEW;
  END IF;

  -- Verifica se o WhatsApp está conectado (NÃO verifica is_active)
  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM recovery_contacts rc
    JOIN recovery_templates rt ON rc.template_id = rt.id
    WHERE rc.user_id = NEW.user_id
      AND rt.category = 'first_quiz'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO recovery_contacts (
    user_id,
    phone_number,
    status,
    priority,
    days_inactive_at_contact,
    scheduled_at
  ) VALUES (
    NEW.user_id,
    user_whatsapp,
    'pending',
    0,
    0,
    now() + interval '5 minutes'
  ) ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
