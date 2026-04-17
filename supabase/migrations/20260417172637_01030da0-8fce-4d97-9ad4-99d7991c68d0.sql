
-- ============================================================
-- ETAPA 3 — PARTE 2: Triggers T3, T4, T5, T6
-- ============================================================

-- T3 + T4: AFTER INSERT em quizzes
-- (T4) Mensagem WhatsApp de parabéns no 1º quiz real
-- (T3) Tutorial por email agendado para 3 dias depois
DROP TRIGGER IF EXISTS trg_quizzes_first_quiz_message ON public.quizzes;
CREATE TRIGGER trg_quizzes_first_quiz_message
AFTER INSERT ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_first_quiz_message();

DROP TRIGGER IF EXISTS trg_quizzes_first_quiz_tutorial ON public.quizzes;
CREATE TRIGGER trg_quizzes_first_quiz_tutorial
AFTER INSERT ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.check_first_quiz_tutorial();

-- T5: AFTER INSERT em quiz_responses → marcos 10/50/100/500 leads
DROP TRIGGER IF EXISTS trg_quiz_responses_lead_milestone ON public.quiz_responses;
CREATE TRIGGER trg_quiz_responses_lead_milestone
AFTER INSERT ON public.quiz_responses
FOR EACH ROW
WHEN (NEW.respondent_email IS NOT NULL OR NEW.respondent_whatsapp IS NOT NULL)
EXECUTE FUNCTION public.check_lead_milestone();

-- T6: AFTER UPDATE OF plan_limit_hit_type em profiles → upgrade nudge
DROP TRIGGER IF EXISTS trg_profiles_upgrade_nudge ON public.profiles;
CREATE TRIGGER trg_profiles_upgrade_nudge
AFTER UPDATE OF plan_limit_hit_type ON public.profiles
FOR EACH ROW
WHEN (NEW.plan_limit_hit_type IS DISTINCT FROM OLD.plan_limit_hit_type
      AND NEW.plan_limit_hit_type IS NOT NULL)
EXECUTE FUNCTION public.fn_upgrade_nudge_on_lead_limit();
