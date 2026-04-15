
-- Tabela para controle de integração de eventos no GTM
CREATE TABLE public.gtm_event_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT UNIQUE NOT NULL,
  is_integrated BOOLEAN DEFAULT false,
  gtm_event_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.gtm_event_integrations ENABLE ROW LEVEL SECURITY;

-- Admins podem ler
CREATE POLICY "Admins can read gtm_event_integrations"
  ON public.gtm_event_integrations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin')
  );

-- Admins podem inserir
CREATE POLICY "Admins can insert gtm_event_integrations"
  ON public.gtm_event_integrations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin')
  );

-- Admins podem atualizar
CREATE POLICY "Admins can update gtm_event_integrations"
  ON public.gtm_event_integrations FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin')
  );

-- Admins podem deletar
CREATE POLICY "Admins can delete gtm_event_integrations"
  ON public.gtm_event_integrations FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin')
  );

-- Trigger updated_at
CREATE TRIGGER update_gtm_event_integrations_updated_at
  BEFORE UPDATE ON public.gtm_event_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
