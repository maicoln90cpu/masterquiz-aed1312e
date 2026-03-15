
-- Add admin_alert_phone to whatsapp_ai_settings
ALTER TABLE public.whatsapp_ai_settings 
ADD COLUMN IF NOT EXISTS admin_alert_phone text DEFAULT NULL;

-- Drop existing CHECK constraint on whatsapp_conversations.role and add new one with 'human'
ALTER TABLE public.whatsapp_conversations 
DROP CONSTRAINT IF EXISTS whatsapp_conversations_role_check;

ALTER TABLE public.whatsapp_conversations 
ADD CONSTRAINT whatsapp_conversations_role_check 
CHECK (role IN ('user', 'assistant', 'system', 'human'));
