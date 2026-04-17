-- Remove triggers duplicados em profiles
DROP TRIGGER IF EXISTS on_new_user_welcome ON public.profiles;
DROP TRIGGER IF EXISTS on_whatsapp_added ON public.profiles;
DROP TRIGGER IF EXISTS auto_set_company_slug ON public.profiles;
DROP TRIGGER IF EXISTS upgrade_nudge_lead_limit_trigger ON public.profiles;

-- Remove triggers duplicados em quizzes
DROP TRIGGER IF EXISTS on_first_quiz_created ON public.quizzes;
DROP TRIGGER IF EXISTS trigger_first_quiz_tutorial ON public.quizzes;

-- Remove trigger duplicado em quiz_responses
DROP TRIGGER IF EXISTS trigger_lead_milestone ON public.quiz_responses;

-- Comentários canônicos para evitar regressão futura
COMMENT ON TRIGGER trg_profiles_welcome_message ON public.profiles IS 'Canonical T2 — WA welcome no signup. NÃO duplicar com on_new_user_welcome.';
COMMENT ON TRIGGER trg_profiles_welcome_on_whatsapp ON public.profiles IS 'Canonical T7 — WA welcome quando WhatsApp é adicionado depois. NÃO duplicar com on_whatsapp_added.';
COMMENT ON TRIGGER trg_profiles_auto_company_slug ON public.profiles IS 'Canonical T8 — auto-slug no signup. NÃO duplicar com auto_set_company_slug.';
COMMENT ON TRIGGER trg_profiles_upgrade_nudge ON public.profiles IS 'Canonical T6 — upgrade nudge ao bater 100%. NÃO duplicar com upgrade_nudge_lead_limit_trigger.';
COMMENT ON TRIGGER trg_quizzes_first_quiz_message ON public.quizzes IS 'Canonical T4 — WA no 1º quiz real. NÃO duplicar com on_first_quiz_created.';
COMMENT ON TRIGGER trg_quizzes_first_quiz_tutorial ON public.quizzes IS 'Canonical T3 — email tutorial 3d. NÃO duplicar com trigger_first_quiz_tutorial.';
COMMENT ON TRIGGER trg_quiz_responses_lead_milestone ON public.quiz_responses IS 'Canonical T5 — milestones 10/50/100/500. NÃO duplicar com trigger_lead_milestone.';