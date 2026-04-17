-- Etapa 2: Limpar A/B test órfão e corrigir copy do plano free

-- Remover sessões e teste órfão "Hero CTA Test" (variantes nulas, gerando ruído)
DELETE FROM public.landing_ab_sessions
WHERE test_id = 'fe7b08c8-4cc0-4454-92c5-3694ca91737b';

DELETE FROM public.landing_ab_tests
WHERE id = 'fe7b08c8-4cc0-4454-92c5-3694ca91737b';

-- Atualizar variante B do teste "Compare Page - Final CTA"
-- de "Testar 7 dias grátis" -> "Começar grátis agora" (alinha ao plano free real)
UPDATE public.landing_ab_tests
SET variant_b_content = jsonb_build_object('style', 'hero', 'text', 'Começar grátis agora'),
    updated_at = now()
WHERE id = 'c6624e86-331f-4029-b343-eaf2ad3df277';