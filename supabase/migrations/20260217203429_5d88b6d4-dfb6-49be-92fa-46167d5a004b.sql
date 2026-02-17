
-- Habilitar pg_net
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1) trigger_welcome_message: disparo imediato via pg_net
CREATE OR REPLACE FUNCTION public.trigger_welcome_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  welcome_enabled BOOLEAN;
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

  SELECT EXISTS (
    SELECT 1 FROM recovery_templates 
    WHERE category = 'welcome' AND is_active = true
  ) INTO welcome_enabled;

  IF NOT welcome_enabled THEN
    RETURN NEW;
  END IF;

  -- Inserir na fila (backup/historico)
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now()
  ) ON CONFLICT DO NOTHING;

  -- Disparar envio imediato via pg_net
  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;

  -- Fallback para URL hardcoded se vault nao tiver
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

-- 2) trigger_welcome_on_whatsapp_update: disparo imediato via pg_net
CREATE OR REPLACE FUNCTION public.trigger_welcome_on_whatsapp_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  already_contacted BOOLEAN;
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

  -- Adiciona na fila
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now()
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

-- 3) trigger_first_quiz_message: disparo imediato via pg_net (com delay de 5min via scheduled_at)
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

  IF EXISTS (
    SELECT 1 FROM recovery_contacts rc
    JOIN recovery_templates rt ON rc.template_id = rt.id
    WHERE rc.user_id = NEW.user_id
      AND rt.category = 'first_quiz'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at
  ) VALUES (
    NEW.user_id, user_whatsapp, 'pending', 0, 0,
    now() + interval '5 minutes'
  ) ON CONFLICT DO NOTHING;

  -- Disparar envio imediato via pg_net (first_quiz usa send-welcome-message com category detection)
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
