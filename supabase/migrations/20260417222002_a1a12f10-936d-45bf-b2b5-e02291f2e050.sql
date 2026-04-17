-- Etapa C: ajustes nos testes A/B da landing

-- #1 hero_headline (atualizar A e B, manter ativo)
UPDATE landing_ab_tests
SET variant_a_content = '{"text":"Crie um quiz que qualifica seus leads antes do checkout"}'::jsonb,
    variant_b_content = '{"text":"Crie quizzes que vendem — em 5 minutos, sem código"}'::jsonb,
    updated_at = now()
WHERE target_element = 'hero_headline';

-- #2 hero_subheadline (atualizar A e B, manter ativo)
UPDATE landing_ab_tests
SET variant_a_content = '{"text":"Em menos de 10 minutos, sem código"}'::jsonb,
    variant_b_content = '{"text":"Sem código. Sem complicação. Leads qualificados de verdade."}'::jsonb,
    updated_at = now()
WHERE target_element = 'hero_subheadline';

-- #3 hero_cta_primary (atualizar A e B, manter ativo, preservar style:gradient)
UPDATE landing_ab_tests
SET variant_a_content = '{"text":"Criar quiz grátis","style":"gradient"}'::jsonb,
    variant_b_content = '{"text":"Criar meu primeiro quiz grátis","style":"gradient"}'::jsonb,
    updated_at = now()
WHERE target_element = 'hero_cta_primary';

-- #4 hero_cta_secondary (desativar — fixar "Ver como funciona")
UPDATE landing_ab_tests
SET is_active = false, updated_at = now()
WHERE target_element = 'hero_cta_secondary';

-- #5 pricing_free_cta (desativar — fixar "Começar grátis")
UPDATE landing_ab_tests
SET is_active = false, updated_at = now()
WHERE target_element = 'pricing_free_cta';

-- #6 pricing_paid_cta (desativar — fixar Variante B "Liberar tudo agora")
-- Garantir que landing_content tenha "Liberar tudo agora" como vencedor
UPDATE landing_ab_tests
SET is_active = false,
    variant_a_content = '{"text":"Liberar tudo agora"}'::jsonb,
    updated_at = now()
WHERE target_element = 'pricing_paid_cta';

-- #7 testimonials_title (atualizar B, manter ativo)
UPDATE landing_ab_tests
SET variant_b_content = '{"text":"Mais de 500 times já usam o MasterQuizz"}'::jsonb,
    updated_at = now()
WHERE target_element = 'testimonials_title';

-- #8 final_cta_section (desativar — fixar Variante B "Comece agora")
UPDATE landing_ab_tests
SET is_active = false,
    variant_a_content = '{"text":"Comece agora — leva 2 minutos"}'::jsonb,
    updated_at = now()
WHERE target_element = 'final_cta_section';

-- Garantir que landing_content (Modo A) tenha os vencedores fixados como fallback
-- pricing_paid_cta_text → "Liberar tudo agora"
INSERT INTO landing_content (key, value_pt, value_en, value_es, site_mode, category, description)
VALUES ('pricing_paid_cta_text', 'Liberar tudo agora', 'Unlock everything now', 'Desbloquear todo ahora', 'A', 'pricing', 'CTA do plano pago (vencedor A/B fixado)')
ON CONFLICT (key, site_mode) DO UPDATE SET value_pt = EXCLUDED.value_pt, updated_at = now();

-- final_cta_text → "Comece agora — leva 2 minutos"
INSERT INTO landing_content (key, value_pt, value_en, value_es, site_mode, category, description)
VALUES ('final_cta_text', 'Comece agora — leva 2 minutos', 'Start now — takes 2 minutes', 'Empieza ahora — tarda 2 minutos', 'A', 'final_cta', 'Headline do CTA final (vencedor A/B fixado)')
ON CONFLICT (key, site_mode) DO UPDATE SET value_pt = EXCLUDED.value_pt, updated_at = now();