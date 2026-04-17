INSERT INTO public.landing_ab_tests (
  name,
  description,
  target_element,
  is_active,
  traffic_split,
  variant_a_content,
  variant_b_content
) VALUES (
  'Compare Page - Final CTA',
  'Testa o texto do botão CTA final na página /compare: "Criar conta grátis" vs "Testar 7 dias grátis"',
  'compare_cta_final',
  true,
  50,
  '{"text": "Criar conta grátis", "style": "hero"}'::jsonb,
  '{"text": "Testar 7 dias grátis", "style": "hero"}'::jsonb
)
ON CONFLICT DO NOTHING;