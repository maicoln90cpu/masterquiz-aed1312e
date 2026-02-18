
-- 1. RLS: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master_admin'::app_role)
  );

-- 2. Corrigir handle_new_user_subscription para ler da tabela de planos
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  plan_record RECORD;
BEGIN
  SELECT quiz_limit, response_limit 
  INTO plan_record
  FROM subscription_plans 
  WHERE plan_type = 'free' 
  LIMIT 1;

  INSERT INTO public.user_subscriptions (
    user_id, plan_type, status, quiz_limit, response_limit
  ) VALUES (
    NEW.id, 'free', 'active', 
    COALESCE(plan_record.quiz_limit, 1), 
    COALESCE(plan_record.response_limit, 100)
  );
  RETURN NEW;
END;
$function$;

-- 3. Corrigir subscricoes existentes com limites errados
UPDATE user_subscriptions us
SET quiz_limit = sp.quiz_limit,
    response_limit = sp.response_limit
FROM subscription_plans sp
WHERE us.plan_type = sp.plan_type
  AND us.plan_type = 'free'
  AND us.quiz_limit != sp.quiz_limit;

-- 4. Atualizar trigger_welcome_message para buscar template_id e evitar duplicatas
CREATE OR REPLACE FUNCTION public.trigger_welcome_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  welcome_template_id UUID;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  -- Buscar template de welcome ativo
  SELECT id INTO welcome_template_id
  FROM recovery_templates
  WHERE category = 'welcome' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  IF welcome_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar se ja existe registro para este usuario
  IF EXISTS (
    SELECT 1 FROM recovery_contacts
    WHERE user_id = NEW.id AND template_id = welcome_template_id
  ) THEN
    RETURN NEW;
  END IF;

  -- Inserir na fila COM template_id
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id
  ) ON CONFLICT DO NOTHING;

  -- Disparar envio imediato via pg_net
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;

  IF supabase_url IS NULL THEN
    supabase_url := 'https://kmmdzwoidakmbekqvkmq.supabase.co';
  END IF;
  IF anon_key IS NULL THEN
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4';
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'phone_number', NEW.whatsapp,
      'user_name', COALESCE(NEW.full_name, '')
    )
  );

  RETURN NEW;
END;
$function$;

-- 5. Atualizar trigger_welcome_on_whatsapp_update
CREATE OR REPLACE FUNCTION public.trigger_welcome_on_whatsapp_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  already_contacted BOOLEAN;
  welcome_template_id UUID;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- So dispara se WhatsApp foi adicionado (era null/vazio e agora tem valor)
  IF (OLD.whatsapp IS NOT NULL AND OLD.whatsapp != '') THEN
    RETURN NEW;
  END IF;
  
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM recovery_contacts 
    WHERE user_id = NEW.id
  ) INTO already_contacted;

  IF already_contacted THEN
    RETURN NEW;
  END IF;

  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  -- Buscar template welcome
  SELECT id INTO welcome_template_id
  FROM recovery_templates
  WHERE category = 'welcome' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  -- Adiciona na fila COM template_id
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id
  ) ON CONFLICT DO NOTHING;

  -- Disparar envio imediato via pg_net
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;

  IF supabase_url IS NULL THEN
    supabase_url := 'https://kmmdzwoidakmbekqvkmq.supabase.co';
  END IF;
  IF anon_key IS NULL THEN
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4';
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'phone_number', NEW.whatsapp,
      'user_name', COALESCE(NEW.full_name, '')
    )
  );

  RETURN NEW;
END;
$function$;

-- 6. Atualizar trigger_first_quiz_message
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
  user_name TEXT;
  first_quiz_template_id UUID;
  supabase_url TEXT;
  anon_key TEXT;
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

  SELECT whatsapp, full_name INTO user_whatsapp, user_name
  FROM profiles
  WHERE id = NEW.user_id;

  IF user_whatsapp IS NULL OR user_whatsapp = '' THEN
    RETURN NEW;
  END IF;

  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  -- Buscar template first_quiz
  SELECT id INTO first_quiz_template_id
  FROM recovery_templates
  WHERE category = 'first_quiz' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  -- Verificar se ja recebeu mensagem de first_quiz
  IF EXISTS (
    SELECT 1 FROM recovery_contacts rc
    WHERE rc.user_id = NEW.user_id
      AND rc.template_id = first_quiz_template_id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id
  ) VALUES (
    NEW.user_id, user_whatsapp, 'pending', 0, 0,
    now() + interval '5 minutes', first_quiz_template_id
  ) ON CONFLICT DO NOTHING;

  -- Disparar envio via pg_net
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;

  IF supabase_url IS NULL THEN
    supabase_url := 'https://kmmdzwoidakmbekqvkmq.supabase.co';
  END IF;
  IF anon_key IS NULL THEN
    anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4';
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'phone_number', user_whatsapp,
      'user_name', COALESCE(user_name, ''),
      'category', 'first_quiz'
    )
  );

  RETURN NEW;
END;
$function$;

-- 7. Limpar registros orfaos/duplicados na fila
UPDATE recovery_contacts
SET status = 'cancelled', error_message = 'Duplicata orfã - limpa por migration'
WHERE template_id IS NULL
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM recovery_contacts rc2
    WHERE rc2.user_id = recovery_contacts.user_id
      AND rc2.template_id IS NOT NULL
      AND rc2.status IN ('sent', 'failed')
  );
