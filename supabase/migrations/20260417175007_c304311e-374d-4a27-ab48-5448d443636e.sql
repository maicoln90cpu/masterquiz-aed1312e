-- 1) Criar campanha automática WA (idempotente)
INSERT INTO public.recovery_campaigns (id, name, description, status, is_automatic, template_id)
VALUES (
  '00000000-0000-0000-0000-00000000aaaa',
  'Welcome Automático — WhatsApp',
  'Campanha permanente que agrupa todos os WhatsApps de boas-vindas enfileirados via trigger no signup ou ao adicionar WhatsApp.',
  'running',
  true,
  (SELECT id FROM public.recovery_templates WHERE category = 'welcome' AND is_active = true ORDER BY priority ASC LIMIT 1)
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_automatic = true,
  status = 'running';

-- 2) Ajustar trigger_welcome_message
CREATE OR REPLACE FUNCTION public.trigger_welcome_message()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  welcome_template_id UUID;
  auto_campaign_id UUID := '00000000-0000-0000-0000-00000000aaaa';
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN RETURN NEW; END IF;
  SELECT is_connected INTO settings_record FROM recovery_settings LIMIT 1;
  IF NOT FOUND OR NOT settings_record.is_connected THEN RETURN NEW; END IF;
  SELECT id INTO welcome_template_id FROM recovery_templates WHERE category = 'welcome' AND is_active = true ORDER BY priority ASC LIMIT 1;
  IF welcome_template_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id, campaign_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id, auto_campaign_id
  ) ON CONFLICT (user_id, template_id) DO NOTHING;

  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;
  IF supabase_url IS NULL THEN supabase_url := 'https://kmmdzwoidakmbekqvkmq.supabase.co'; END IF;
  IF anon_key IS NULL THEN anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4'; END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-message',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || anon_key),
    body := jsonb_build_object('user_id', NEW.id, 'phone_number', NEW.whatsapp, 'user_name', COALESCE(NEW.full_name, ''))
  );
  RETURN NEW;
END;
$function$;

-- 3) Ajustar trigger_welcome_on_whatsapp_update
CREATE OR REPLACE FUNCTION public.trigger_welcome_on_whatsapp_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  settings_record RECORD;
  welcome_template_id UUID;
  auto_campaign_id UUID := '00000000-0000-0000-0000-00000000aaaa';
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  IF (OLD.whatsapp IS NOT NULL AND OLD.whatsapp != '') THEN RETURN NEW; END IF;
  IF NEW.whatsapp IS NULL OR NEW.whatsapp = '' THEN RETURN NEW; END IF;
  SELECT is_connected INTO settings_record FROM recovery_settings LIMIT 1;
  IF NOT FOUND OR NOT settings_record.is_connected THEN RETURN NEW; END IF;
  SELECT id INTO welcome_template_id FROM recovery_templates WHERE category = 'welcome' AND is_active = true ORDER BY priority ASC LIMIT 1;
  IF welcome_template_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id, campaign_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id, auto_campaign_id
  ) ON CONFLICT (user_id, template_id) DO NOTHING;

  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1;
  SELECT decrypted_secret INTO anon_key FROM vault.decrypted_secrets WHERE name = 'supabase_anon_key' LIMIT 1;
  IF supabase_url IS NULL THEN supabase_url := 'https://kmmdzwoidakmbekqvkmq.supabase.co'; END IF;
  IF anon_key IS NULL THEN anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttbWR6d29pZGFrbWJla3F2a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Nzg3NjgsImV4cCI6MjA4NjA1NDc2OH0.3AmuXo0aVzMS_iM_pzLG7Wrk_lvnjMcl8aCl9J-Qco4'; END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-welcome-message',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || anon_key),
    body := jsonb_build_object('user_id', NEW.id, 'phone_number', NEW.whatsapp, 'user_name', COALESCE(NEW.full_name, ''))
  );
  RETURN NEW;
END;
$function$;

-- 4) Backfill órfãos
UPDATE public.recovery_contacts
SET campaign_id = '00000000-0000-0000-0000-00000000aaaa'
WHERE campaign_id IS NULL
  AND template_id = (SELECT id FROM public.recovery_templates WHERE category = 'welcome' AND is_active = true ORDER BY priority ASC LIMIT 1);

-- 5) Recalcular contadores via SELECT (não PERFORM)
SELECT * FROM public.recalc_recovery_campaign_counts('00000000-0000-0000-0000-00000000aaaa');