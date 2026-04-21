-- 1) Tabela permanente de milestones
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  fired_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  CONSTRAINT user_milestones_unique UNIQUE (user_id, milestone_name)
);

CREATE INDEX IF NOT EXISTS idx_user_milestones_user ON public.user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_name ON public.user_milestones(milestone_name);

-- 2) RLS
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

-- Usuário lê apenas seus próprios marcos
CREATE POLICY "Users read own milestones"
  ON public.user_milestones
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins/master_admins leem todos
CREATE POLICY "Admins read all milestones"
  ON public.user_milestones
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- INSERT/UPDATE/DELETE: sem políticas → só service_role (Edge Functions) consegue gravar

-- 3) Backfill — preserva histórico atual de gtm_event_logs
INSERT INTO public.user_milestones (user_id, milestone_name, fired_at, metadata)
SELECT DISTINCT ON (user_id, event_name)
  user_id, event_name, created_at, metadata
FROM public.gtm_event_logs
WHERE event_name IN ('first_response_received', 'first_lead_received', 'aha_threshold_reached')
  AND user_id IS NOT NULL
ORDER BY user_id, event_name, created_at ASC
ON CONFLICT (user_id, milestone_name) DO NOTHING;