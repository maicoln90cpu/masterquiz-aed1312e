-- Etapa 5.D: Unificar triggers de boas-vindas (Welcome + Cadastro)
-- Remove os 2 triggers duplicados e cria 1 único consolidado

-- 1) Drop dos triggers antigos
DROP TRIGGER IF EXISTS trg_profiles_welcome_message ON public.profiles;
DROP TRIGGER IF EXISTS trg_profiles_welcome_on_whatsapp ON public.profiles;

-- 2) Drop das funções antigas (substituídas pela consolidada)
DROP FUNCTION IF EXISTS public.trigger_welcome_message();
DROP FUNCTION IF EXISTS public.trigger_welcome_on_whatsapp_update();

-- 3) Criar função unificada que cobre INSERT + UPDATE (whatsapp NULL -> preenchido)
CREATE OR REPLACE FUNCTION public.trigger_welcome_unified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  settings_record RECORD;
  welcome_template_id UUID;
  auto_campaign_id UUID := '00000000-0000-0000-0000-00000000aaaa';
  supabase_url TEXT;
  anon_key TEXT;
  should_fire BOOLEAN := false;
BEGIN
  -- Decide se este evento deve disparar a mensagem
  IF TG_OP = 'INSERT' THEN
    -- Cadastro com whatsapp já preenchido
    should_fire := (NEW.whatsapp IS NOT NULL AND NEW.whatsapp != '');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Whatsapp passou de vazio para preenchido (cadastro tardio)
    should_fire := (
      (OLD.whatsapp IS NULL OR OLD.whatsapp = '')
      AND NEW.whatsapp IS NOT NULL
      AND NEW.whatsapp != ''
    );
  END IF;

  IF NOT should_fire THEN
    RETURN NEW;
  END IF;

  -- Verifica conexão WhatsApp
  SELECT is_connected INTO settings_record FROM recovery_settings LIMIT 1;
  IF NOT FOUND OR NOT settings_record.is_connected THEN
    RETURN NEW;
  END IF;

  -- Pega template ativo de boas-vindas
  SELECT id INTO welcome_template_id
  FROM recovery_templates
  WHERE category = 'welcome' AND is_active = true
  ORDER BY priority ASC
  LIMIT 1;

  IF welcome_template_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insere na fila com dedup por (user_id, template_id) — garante 1 envio por usuário
  INSERT INTO recovery_contacts (
    user_id, phone_number, status, priority,
    days_inactive_at_contact, scheduled_at, template_id, campaign_id
  ) VALUES (
    NEW.id, NEW.whatsapp, 'pending', -1, 0, now(), welcome_template_id, auto_campaign_id
  ) ON CONFLICT (user_id, template_id) DO NOTHING;

  -- Se nada foi inserido (já enviado antes), não chama edge function
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Dispara edge function de envio
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
$$;

-- 4) Criar 1 único trigger consolidado
CREATE TRIGGER trg_profiles_welcome_message
AFTER INSERT OR UPDATE OF whatsapp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_welcome_unified();

-- 5) Atualizar a view v_lifecycle_health para refletir 7 triggers (sem o trg_profiles_welcome_on_whatsapp)
CREATE OR REPLACE VIEW public.v_lifecycle_health AS
WITH triggers AS (
  SELECT t.tgname AS trigger_name,
         c.relname AS table_name,
         p.proname AS function_name,
         t.tgenabled AS enabled_state
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE NOT t.tgisinternal
    AND t.tgname = ANY (ARRAY[
      'trg_profiles_welcome_message'::name,
      'trg_profiles_auto_company_slug'::name,
      'trg_quizzes_first_quiz_message'::name,
      'trg_quizzes_first_quiz_tutorial'::name,
      'trg_quiz_responses_lead_milestone'::name,
      'trg_profiles_upgrade_nudge'::name,
      'trg_quiz_responses_limit_warning'::name
    ])
)
SELECT trigger_name,
       table_name,
       function_name,
       enabled_state = 'O'::"char" AS is_active,
       COALESCE((SELECT count(*) FROM email_recovery_contacts WHERE created_at > (now() - interval '24 hours')), 0::bigint) AS emails_enqueued_24h,
       COALESCE((SELECT count(*) FROM recovery_contacts        WHERE created_at > (now() - interval '24 hours')), 0::bigint) AS whatsapp_enqueued_24h,
       COALESCE((SELECT count(*) FROM email_recovery_contacts WHERE created_at > (now() - interval '7 days')),  0::bigint) AS emails_enqueued_7d,
       COALESCE((SELECT count(*) FROM recovery_contacts        WHERE created_at > (now() - interval '7 days')),  0::bigint) AS whatsapp_enqueued_7d
FROM triggers tr
ORDER BY trigger_name;