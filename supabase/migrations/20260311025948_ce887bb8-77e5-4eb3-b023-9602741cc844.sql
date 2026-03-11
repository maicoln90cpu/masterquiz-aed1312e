
-- Tabela site_settings para controlar modo A/B do site
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_mode text NOT NULL DEFAULT 'A',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler (frontend precisa saber o modo)
CREATE POLICY "Anyone can view site settings"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Apenas master_admin pode alterar
CREATE POLICY "Master admins manage site settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'master_admin'::app_role));

-- Inserir registro inicial
INSERT INTO public.site_settings (site_mode) VALUES ('A');

-- Adicionar payment_confirmed em user_subscriptions (retrocompatível: default true)
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS payment_confirmed boolean DEFAULT true;
