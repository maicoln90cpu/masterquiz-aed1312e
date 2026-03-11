
-- Drop unique INDEX on key
DROP INDEX IF EXISTS public.landing_content_key_key;

-- Add site_mode column
ALTER TABLE public.landing_content ADD COLUMN site_mode TEXT NOT NULL DEFAULT 'A';

-- Create composite unique
CREATE UNIQUE INDEX landing_content_key_site_mode_key ON public.landing_content (key, site_mode);

-- Duplicate hero entries for Mode B
INSERT INTO public.landing_content (key, value_pt, value_en, value_es, category, description, site_mode)
SELECT 
  lc.key,
  CASE lc.key
    WHEN 'hero_cta_primary' THEN 'Escolher meu plano'
    WHEN 'hero_cta_secondary' THEN 'Ver planos'
    WHEN 'hero_trust_1' THEN '15 dias de garantia'
    WHEN 'hero_trust_2' THEN 'Acesso imediato'
    WHEN 'hero_trust_3' THEN 'Suporte prioritário'
    WHEN 'hero_badge' THEN 'Plataforma completa de quizzes'
    WHEN 'hero_bullet_1' THEN 'Editor visual intuitivo com blocos'
    WHEN 'hero_bullet_2' THEN 'CRM integrado para gestão de leads'
    WHEN 'hero_bullet_3' THEN 'Analytics em tempo real'
    WHEN 'hero_bullet_4' THEN 'Integrações com Kiwify, GTM e Pixel'
    WHEN 'hero_bullet_5' THEN 'Suporte prioritário incluído'
    ELSE lc.value_pt
  END,
  CASE lc.key
    WHEN 'hero_cta_primary' THEN 'Choose my plan'
    WHEN 'hero_cta_secondary' THEN 'See plans'
    WHEN 'hero_trust_1' THEN '15-day guarantee'
    WHEN 'hero_trust_2' THEN 'Instant access'
    WHEN 'hero_trust_3' THEN 'Priority support'
    WHEN 'hero_badge' THEN 'Complete quiz platform'
    ELSE lc.value_en
  END,
  CASE lc.key
    WHEN 'hero_cta_primary' THEN 'Elegir mi plan'
    WHEN 'hero_cta_secondary' THEN 'Ver planes'
    WHEN 'hero_trust_1' THEN 'Garantía de 15 días'
    WHEN 'hero_trust_2' THEN 'Acceso inmediato'
    WHEN 'hero_trust_3' THEN 'Soporte prioritario'
    WHEN 'hero_badge' THEN 'Plataforma completa de quizzes'
    ELSE lc.value_es
  END,
  lc.category,
  lc.description,
  'B'
FROM public.landing_content lc
WHERE lc.category = 'hero' AND lc.site_mode = 'A';
