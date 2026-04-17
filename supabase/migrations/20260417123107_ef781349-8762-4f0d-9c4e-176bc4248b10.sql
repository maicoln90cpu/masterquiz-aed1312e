-- Correção 1B: custom_link com formato completo {company_slug}/{quiz_slug}
UPDATE public.recovery_contacts
SET custom_link = 'https://masterquiz.com.br/pamella-alinne/como-fazer-uma-renda-extra-usando-apenas-o-celular'
WHERE id = '54ccb900-d2ad-4dab-924a-479da02c8a49';

UPDATE public.recovery_contacts
SET custom_link = 'https://masterquiz.com.br/karen-lyra-graduacaouerj/quiz-lubrax'
WHERE id = 'c60f32c0-df51-4109-aa28-a8118b5cd1a6';

-- Gustavo (f2690399...) já está com formato correto, não precisa update.

-- ETAPA 2 — Tabela de domínios institucionais bloqueados como lead
CREATE TABLE IF NOT EXISTS public.institutional_email_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  reason text NOT NULL DEFAULT 'institutional',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institutional_domains_active
  ON public.institutional_email_domains(domain) WHERE is_active = true;

ALTER TABLE public.institutional_email_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage institutional domains"
  ON public.institutional_email_domains
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'master_admin'::app_role));

CREATE POLICY "Anyone can read active institutional domains"
  ON public.institutional_email_domains
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER trg_institutional_domains_updated_at
  BEFORE UPDATE ON public.institutional_email_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial: 12 domínios institucionais comuns no BR
INSERT INTO public.institutional_email_domains (domain, reason, notes) VALUES
  ('gov.br','government','Governo federal/estadual/municipal'),
  ('edu.br','education','Instituições de ensino brasileiras'),
  ('mil.br','military','Forças armadas'),
  ('jus.br','judicial','Poder judiciário'),
  ('mp.br','judicial','Ministério Público'),
  ('leg.br','legislative','Poder legislativo'),
  ('org.br','non-profit','Organizações sem fins lucrativos (revisar caso a caso)'),
  ('gov','government','Governo internacional (.gov)'),
  ('edu','education','Instituições de ensino internacionais (.edu)'),
  ('mil','military','Forças armadas internacionais (.mil)'),
  ('int','intergovernmental','Organizações intergovernamentais'),
  ('ac.uk','education','Universidades do Reino Unido')
ON CONFLICT (domain) DO NOTHING;