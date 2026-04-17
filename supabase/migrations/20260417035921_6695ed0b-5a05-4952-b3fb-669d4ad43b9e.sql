-- =========================================================
-- FASE 1.A: Backfill de blog_generation_logs (16 posts existentes)
-- =========================================================
INSERT INTO public.blog_generation_logs (
  post_id,
  model_used,
  status,
  generation_type,
  text_cost_usd,
  image_cost_usd,
  total_cost_usd,
  created_at
)
SELECT
  bp.id AS post_id,
  COALESCE(bp.model_used, 'gpt-4o-mini') AS model_used,
  'success'::text AS status,
  CASE
    WHEN COALESCE(bp.image_generation_cost_usd, 0) > 0 AND COALESCE(bp.generation_cost_usd, 0) > 0 THEN 'both'
    WHEN COALESCE(bp.image_generation_cost_usd, 0) > 0 THEN 'image'
    ELSE 'article'
  END AS generation_type,
  COALESCE(bp.generation_cost_usd, 0) AS text_cost_usd,
  COALESCE(bp.image_generation_cost_usd, 0) AS image_cost_usd,
  COALESCE(bp.generation_cost_usd, 0) + COALESCE(bp.image_generation_cost_usd, 0) AS total_cost_usd,
  bp.created_at
FROM public.blog_posts bp
WHERE bp.is_ai_generated = true
  AND NOT EXISTS (
    SELECT 1 FROM public.blog_generation_logs bgl WHERE bgl.post_id = bp.id
  );

-- =========================================================
-- FASE 1.B: Criar 9 novos testes A/B (totalizando 10 com o existente)
-- Idempotente: pula se já existir teste com o mesmo target_element
-- =========================================================
INSERT INTO public.landing_ab_tests (name, description, target_element, is_active, traffic_split, variant_a_content, variant_b_content)
SELECT * FROM (VALUES
  (
    'Hero Headline',
    'Teste do título principal do hero da landing page',
    'hero_headline',
    true,
    50,
    jsonb_build_object('text', 'Transforme visitantes em leads qualificados'),
    jsonb_build_object('text', 'Crie quizzes que vendem em 5 minutos')
  ),
  (
    'Hero Subheadline',
    'Teste do subtítulo do hero',
    'hero_subheadline',
    true,
    50,
    jsonb_build_object('text', 'A plataforma completa para criar quizzes interativos'),
    jsonb_build_object('text', 'Sem código. Sem complicação. Resultados reais.')
  ),
  (
    'Hero CTA Primary',
    'Teste do botão primário do hero',
    'hero_cta_primary',
    true,
    50,
    jsonb_build_object('text', 'Começar grátis', 'style', 'gradient'),
    jsonb_build_object('text', 'Criar meu primeiro quiz', 'style', 'gradient')
  ),
  (
    'Hero CTA Secondary',
    'Teste do botão secundário do hero',
    'hero_cta_secondary',
    true,
    50,
    jsonb_build_object('text', 'Ver demo', 'style', 'outline'),
    jsonb_build_object('text', 'Ver exemplos prontos', 'style', 'outline')
  ),
  (
    'Pricing Free Plan CTA',
    'Teste do CTA do plano grátis na seção de preços',
    'pricing_free_cta',
    true,
    50,
    jsonb_build_object('text', 'Começar grátis'),
    jsonb_build_object('text', 'Quero o plano grátis')
  ),
  (
    'Pricing Paid Plan CTA',
    'Teste do CTA do plano pago na seção de preços',
    'pricing_paid_cta',
    true,
    50,
    jsonb_build_object('text', 'Assinar Pro'),
    jsonb_build_object('text', 'Liberar tudo agora')
  ),
  (
    'Testimonials Title',
    'Teste do título da seção de depoimentos',
    'testimonials_title',
    true,
    50,
    jsonb_build_object('text', 'O que dizem nossos clientes'),
    jsonb_build_object('text', 'Mais de 500 negócios já confiam')
  ),
  (
    'Final CTA Section',
    'Teste do título da seção final de CTA',
    'final_cta_section',
    true,
    50,
    jsonb_build_object('text', 'Pronto para começar?'),
    jsonb_build_object('text', 'Comece agora — leva 2 minutos')
  ),
  (
    'Mobile Sticky CTA',
    'Teste do CTA fixo no mobile',
    'mobile_sticky_cta',
    true,
    50,
    jsonb_build_object('text', 'Criar quiz grátis'),
    jsonb_build_object('text', 'Começar agora')
  )
) AS new_tests(name, description, target_element, is_active, traffic_split, variant_a_content, variant_b_content)
WHERE NOT EXISTS (
  SELECT 1 FROM public.landing_ab_tests t WHERE t.target_element = new_tests.target_element
);