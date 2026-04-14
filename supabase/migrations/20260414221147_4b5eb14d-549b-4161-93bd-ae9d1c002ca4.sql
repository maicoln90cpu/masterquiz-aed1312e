-- Tabela de histórico de trials
CREATE TABLE public.trial_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  trial_plan_type text NOT NULL,
  original_plan_type text NOT NULL,
  trial_days integer NOT NULL,
  trial_end_date timestamptz NOT NULL,
  started_by uuid,
  status text NOT NULL DEFAULT 'active',
  converted_at timestamptz,
  reverted_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.trial_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all trial logs"
ON public.trial_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Service role manages trial logs"
ON public.trial_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Índices
CREATE INDEX idx_trial_logs_user_id ON public.trial_logs(user_id);
CREATE INDEX idx_trial_logs_status ON public.trial_logs(status);
CREATE INDEX idx_trial_logs_created_at ON public.trial_logs(created_at DESC);