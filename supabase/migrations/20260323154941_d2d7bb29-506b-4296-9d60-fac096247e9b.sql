
CREATE TABLE public.email_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view email generation logs"
ON public.email_generation_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin')
);

CREATE POLICY "Service role insert email generation logs"
ON public.email_generation_logs FOR INSERT
TO authenticated
WITH CHECK (true);
