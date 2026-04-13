-- Add human pause duration to whatsapp_ai_settings
ALTER TABLE public.whatsapp_ai_settings 
ADD COLUMN IF NOT EXISTS human_pause_minutes integer NOT NULL DEFAULT 30;

COMMENT ON COLUMN public.whatsapp_ai_settings.human_pause_minutes IS 'Minutes to pause AI bot after human intervention. After this time, bot resumes automatically.';

-- Add admin RLS policy for webhook_logs so admins can see Kiwify payment logs
CREATE POLICY "Admins can view all webhook logs"
ON public.webhook_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin')
);