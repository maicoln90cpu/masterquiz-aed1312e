-- Automation config table for email automations
CREATE TABLE IF NOT EXISTS public.email_automation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_key text UNIQUE NOT NULL, -- e.g. blog_digest, weekly_tip, success_story, monthly_summary, platform_news
  display_name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT true,
  frequency text, -- e.g. 'daily', 'weekly', 'monthly', 'manual'
  last_executed_at timestamptz,
  last_result jsonb, -- { sent: N, error: "..." }
  execution_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_automation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage email_automation_config" ON public.email_automation_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- Automation execution log
CREATE TABLE IF NOT EXISTS public.email_automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_key text NOT NULL,
  status text NOT NULL DEFAULT 'success', -- success, error
  emails_sent integer DEFAULT 0,
  details jsonb,
  error_message text,
  executed_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view email_automation_logs" ON public.email_automation_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- Seed default automations
INSERT INTO public.email_automation_config (automation_key, display_name, description, frequency, is_enabled) VALUES
  ('blog_digest', 'Blog Digest', 'Envia resumo dos últimos artigos publicados quando há 3+ novos posts', 'daily', true),
  ('weekly_tip', 'Dica da Semana', 'Envia dica educativa gerada por IA toda segunda-feira', 'weekly', true),
  ('success_story', 'Caso de Sucesso', 'Envia case study fictício gerado por IA mensalmente', 'monthly', true),
  ('monthly_summary', 'Resumo Mensal', 'Envia relatório personalizado de resultados no 1º dia do mês', 'monthly', true),
  ('platform_news', 'Novidades da Plataforma', 'Disparo manual pelo admin com atualizações da plataforma', 'manual', true)
ON CONFLICT (automation_key) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_email_automation_config_updated_at
  BEFORE UPDATE ON public.email_automation_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();