
-- Table: client_error_logs (frontend error tracking)
CREATE TABLE public.client_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT,
  user_id UUID,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view client error logs"
  ON public.client_error_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Authenticated insert own error logs"
  ON public.client_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anon insert error logs"
  ON public.client_error_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE INDEX idx_client_error_logs_created_at ON public.client_error_logs (created_at DESC);
CREATE INDEX idx_client_error_logs_component ON public.client_error_logs (component_name);

-- Table: performance_logs (operation latency tracking)
CREATE TABLE public.performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  is_slow BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view performance logs"
  ON public.performance_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Authenticated insert performance logs"
  ON public.performance_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon insert performance logs"
  ON public.performance_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_performance_logs_created_at ON public.performance_logs (created_at DESC);
CREATE INDEX idx_performance_logs_operation ON public.performance_logs (operation_name);
