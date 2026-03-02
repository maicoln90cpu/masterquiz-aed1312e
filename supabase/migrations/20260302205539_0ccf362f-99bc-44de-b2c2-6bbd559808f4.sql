
-- Table to persist GTM event dispatches for admin dashboard
CREATE TABLE public.gtm_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gtm_events_name_created ON public.gtm_event_logs(event_name, created_at DESC);
CREATE INDEX idx_gtm_events_created ON public.gtm_event_logs(created_at DESC);

ALTER TABLE public.gtm_event_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY "Users insert own gtm events"
  ON public.gtm_event_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Anon can insert events (for public quiz tracking)
CREATE POLICY "Anon insert gtm events"
  ON public.gtm_event_logs
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Admins can view all events
CREATE POLICY "Admins view all gtm events"
  ON public.gtm_event_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master_admin'::app_role));

-- Auto-cleanup: delete logs older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_gtm_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.gtm_event_logs
  WHERE created_at < now() - interval '30 days';
END;
$$;
