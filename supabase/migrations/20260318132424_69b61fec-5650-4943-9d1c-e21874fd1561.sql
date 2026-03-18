-- Email Recovery Settings (singleton)
CREATE TABLE IF NOT EXISTS public.email_recovery_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT false,
  sender_email text DEFAULT NULL,
  sender_name text DEFAULT 'MasterQuizz',
  daily_email_limit integer DEFAULT 100,
  hourly_email_limit integer DEFAULT 30,
  batch_size integer DEFAULT 10,
  allowed_hours_start text DEFAULT '09:00',
  allowed_hours_end text DEFAULT '18:00',
  inactivity_days_trigger integer DEFAULT 7,
  user_cooldown_days integer DEFAULT 14,
  exclude_plan_types jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_recovery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email recovery settings" ON public.email_recovery_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Email Recovery Templates
CREATE TABLE IF NOT EXISTS public.email_recovery_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'recovery',
  html_content text NOT NULL DEFAULT '',
  trigger_days integer DEFAULT 7,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  open_rate numeric DEFAULT 0,
  click_rate numeric DEFAULT 0,
  created_by uuid DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_recovery_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email recovery templates" ON public.email_recovery_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Email Recovery Contacts (queue)
CREATE TABLE IF NOT EXISTS public.email_recovery_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  template_id uuid REFERENCES public.email_recovery_templates(id),
  campaign_id uuid DEFAULT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled', 'opened', 'clicked')),
  priority integer DEFAULT 0,
  days_inactive_at_contact integer DEFAULT 0,
  user_plan_at_contact text DEFAULT 'free',
  user_quiz_count integer DEFAULT 0,
  user_lead_count integer DEFAULT 0,
  scheduled_at timestamptz DEFAULT now(),
  sent_at timestamptz DEFAULT NULL,
  opened_at timestamptz DEFAULT NULL,
  clicked_at timestamptz DEFAULT NULL,
  error_message text DEFAULT NULL,
  retry_count integer DEFAULT 0,
  egoi_message_id text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

ALTER TABLE public.email_recovery_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email recovery contacts" ON public.email_recovery_contacts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Insert default settings
INSERT INTO public.email_recovery_settings (id) VALUES (gen_random_uuid());