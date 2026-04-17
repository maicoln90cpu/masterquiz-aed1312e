-- Etapa A.2: ativar mobile_sticky_cta como comportamento padrão (sem A/B real)
-- Mesma copy nas duas variantes = não há "teste" estatístico, apenas garante que
-- o componente renderize quando lê is_active=true.
UPDATE public.landing_ab_tests
SET 
  is_active = true,
  variant_a_content = '{"text":"Criar quiz grátis"}'::jsonb,
  variant_b_content = '{"text":"Criar quiz grátis"}'::jsonb,
  description = 'Sticky CTA fixo no rodapé do mobile. Sem teste real — copy fixa.',
  updated_at = now()
WHERE target_element = 'mobile_sticky_cta';