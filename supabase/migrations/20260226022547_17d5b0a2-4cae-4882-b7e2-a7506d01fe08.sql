
-- =============================================
-- ITEM 1: Fix duplicate welcome messages
-- =============================================

-- 1a. Remove duplicate recovery_contacts keeping oldest per (user_id, template_id)
DELETE FROM recovery_contacts
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, template_id) id
  FROM recovery_contacts
  WHERE template_id IS NOT NULL
  ORDER BY user_id, template_id, created_at ASC
)
AND template_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM recovery_contacts rc2
  WHERE rc2.user_id = recovery_contacts.user_id
    AND rc2.template_id = recovery_contacts.template_id
    AND rc2.id != recovery_contacts.id
    AND rc2.created_at < recovery_contacts.created_at
);

-- 1b. Add UNIQUE constraint
ALTER TABLE recovery_contacts
ADD CONSTRAINT uq_recovery_user_template UNIQUE (user_id, template_id);

-- 1c. Update trigger_welcome_message to use proper ON CONFLICT
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

  SELECT id INTO welcome_template_id
  FROM recovery_templates
  WHERE category = 'welcome' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  IF welcome_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use proper UNIQUE conflict target
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id
  ) ON CONFLICT (user_id, template_id) DO NOTHING;

  -- Check if insert actually happened (row was new)
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

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

-- 1d. Update trigger_welcome_on_whatsapp_update
CREATE OR REPLACE FUNCTION public.trigger_welcome_on_whatsapp_update()
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
  -- Only fire if WhatsApp was added (was null/empty and now has value)
  IF (OLD.whatsapp IS NOT NULL AND OLD.whatsapp != '') THEN
    RETURN NEW;
  END IF;
  
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN
    RETURN NEW;
  END IF;

  SELECT is_connected INTO settings_record
  FROM recovery_settings
  LIMIT 1;

  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  SELECT id INTO welcome_template_id
  FROM recovery_templates
  WHERE category = 'welcome' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  IF welcome_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use proper UNIQUE conflict target
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id
  ) ON CONFLICT (user_id, template_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

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

-- 1e. Update trigger_first_quiz_message with express guard
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
  quiz_source TEXT;
BEGIN
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- ITEM 3: Skip if quiz was auto-created by express mode
  quiz_source := COALESCE(NEW.creation_source, 'manual');
  IF quiz_source = 'express_auto' THEN
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

  SELECT id INTO first_quiz_template_id
  FROM recovery_templates
  WHERE category = 'first_quiz' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  -- Use proper UNIQUE conflict target
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id
  ) VALUES (
    NEW.user_id, user_whatsapp, 'pending', 0, 0,
    now() + interval '5 minutes', first_quiz_template_id
  ) ON CONFLICT (user_id, template_id) DO NOTHING;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

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

-- =============================================
-- ITEM 3: Add creation_source column to quizzes
-- =============================================
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS creation_source TEXT DEFAULT 'manual';

-- =============================================
-- ITEM 4b: Normalize null user_stage to 'explorador'
-- =============================================
UPDATE profiles SET user_stage = 'explorador' WHERE user_stage IS NULL;
