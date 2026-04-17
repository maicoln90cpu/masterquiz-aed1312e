UPDATE public.landing_ab_tests
SET is_active = false,
    description = COALESCE(description, '') || ' [Desativado: aguardando componente Mobile Sticky CTA na landing page]',
    updated_at = now()
WHERE target_element = 'mobile_sticky_cta';