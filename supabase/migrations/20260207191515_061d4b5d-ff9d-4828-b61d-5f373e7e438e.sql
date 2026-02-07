
-- Add foreign keys for quiz_id references (safe - all data is consistent)
-- NOT adding user_id -> auth.users FKs because of 24 orphan profiles

-- quiz_questions.quiz_id -> quizzes(id)
ALTER TABLE public.quiz_questions
  ADD CONSTRAINT fk_quiz_questions_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- quiz_results.quiz_id -> quizzes(id)
ALTER TABLE public.quiz_results
  ADD CONSTRAINT fk_quiz_results_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- quiz_form_config.quiz_id -> quizzes(id)
ALTER TABLE public.quiz_form_config
  ADD CONSTRAINT fk_quiz_form_config_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- custom_form_fields.quiz_id -> quizzes(id)
ALTER TABLE public.custom_form_fields
  ADD CONSTRAINT fk_custom_form_fields_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- quiz_translations.quiz_id -> quizzes(id)
ALTER TABLE public.quiz_translations
  ADD CONSTRAINT fk_quiz_translations_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- quiz_question_translations.question_id -> quiz_questions(id)
ALTER TABLE public.quiz_question_translations
  ADD CONSTRAINT fk_quiz_question_translations_question_id
  FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;

-- quiz_variants.parent_quiz_id -> quizzes(id)
ALTER TABLE public.quiz_variants
  ADD CONSTRAINT fk_quiz_variants_parent_quiz_id
  FOREIGN KEY (parent_quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- quiz_tag_relations.quiz_id -> quizzes(id)
ALTER TABLE public.quiz_tag_relations
  ADD CONSTRAINT fk_quiz_tag_relations_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- quiz_tag_relations.tag_id -> quiz_tags(id)
ALTER TABLE public.quiz_tag_relations
  ADD CONSTRAINT fk_quiz_tag_relations_tag_id
  FOREIGN KEY (tag_id) REFERENCES public.quiz_tags(id) ON DELETE CASCADE;

-- quiz_step_analytics.quiz_id -> quizzes(id)
ALTER TABLE public.quiz_step_analytics
  ADD CONSTRAINT fk_quiz_step_analytics_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- ab_test_sessions.quiz_id -> quizzes(id)
ALTER TABLE public.ab_test_sessions
  ADD CONSTRAINT fk_ab_test_sessions_quiz_id
  FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;

-- ticket_messages.ticket_id -> support_tickets(id)
ALTER TABLE public.ticket_messages
  ADD CONSTRAINT fk_ticket_messages_ticket_id
  FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;
