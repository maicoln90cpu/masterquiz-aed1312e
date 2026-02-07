
-- ============================================
-- ENABLE RLS ON ALL TABLES + CREATE POLICIES
-- ============================================

-- ==========================================
-- 1. PROFILES (id = auth.uid())
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Service role / triggers need insert for new signups
CREATE POLICY "Service can manage profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true);

-- ==========================================
-- 2. QUIZZES (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public quizzes readable by anyone (for quiz view)
CREATE POLICY "Public quizzes are viewable"
  ON public.quizzes FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND status = 'active');

-- ==========================================
-- 3. QUIZ_QUESTIONS (via quiz ownership)
-- ==========================================
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz questions"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_questions.quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_questions.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Public quiz questions viewable"
  ON public.quiz_questions FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_questions.quiz_id AND is_public = true AND status = 'active'));

-- ==========================================
-- 4. QUIZ_RESULTS (via quiz ownership)
-- ==========================================
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz results"
  ON public.quiz_results FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_results.quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_results.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Public quiz results viewable"
  ON public.quiz_results FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_results.quiz_id AND is_public = true AND status = 'active'));

-- ==========================================
-- 5. QUIZ_FORM_CONFIG (via quiz ownership)
-- ==========================================
ALTER TABLE public.quiz_form_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz form config"
  ON public.quiz_form_config FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_form_config.quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_form_config.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Public quiz form config viewable"
  ON public.quiz_form_config FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_form_config.quiz_id AND is_public = true AND status = 'active'));

-- ==========================================
-- 6. CUSTOM_FORM_FIELDS (via quiz ownership)
-- ==========================================
ALTER TABLE public.custom_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own custom form fields"
  ON public.custom_form_fields FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = custom_form_fields.quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = custom_form_fields.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Public quiz custom fields viewable"
  ON public.custom_form_fields FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = custom_form_fields.quiz_id AND is_public = true AND status = 'active'));

-- ==========================================
-- 7. QUIZ_TRANSLATIONS (via quiz ownership)
-- ==========================================
ALTER TABLE public.quiz_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz translations"
  ON public.quiz_translations FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_translations.quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_translations.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Public quiz translations viewable"
  ON public.quiz_translations FOR SELECT
  TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_translations.quiz_id AND is_public = true AND status = 'active'));

-- ==========================================
-- 8. QUIZ_QUESTION_TRANSLATIONS (via question -> quiz)
-- ==========================================
ALTER TABLE public.quiz_question_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own question translations"
  ON public.quiz_question_translations FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_question_translations.question_id AND q.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_question_translations.question_id AND q.user_id = auth.uid()
  ));

CREATE POLICY "Public question translations viewable"
  ON public.quiz_question_translations FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_question_translations.question_id AND q.is_public = true AND q.status = 'active'
  ));

-- ==========================================
-- 9. QUIZ_VARIANTS (via quiz ownership)
-- ==========================================
ALTER TABLE public.quiz_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz variants"
  ON public.quiz_variants FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_variants.parent_quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_variants.parent_quiz_id AND user_id = auth.uid()));

-- ==========================================
-- 10. QUIZ_ANALYTICS (via quiz ownership) - SELECT only for owner
-- ==========================================
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quiz analytics"
  ON public.quiz_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_analytics.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Anon can insert quiz analytics"
  ON public.quiz_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update quiz analytics"
  ON public.quiz_analytics FOR UPDATE
  TO anon, authenticated
  USING (true);

-- ==========================================
-- 11. QUIZ_STEP_ANALYTICS (anon insert + owner select)
-- ==========================================
ALTER TABLE public.quiz_step_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert step analytics"
  ON public.quiz_step_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users view own step analytics"
  ON public.quiz_step_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_step_analytics.quiz_id AND user_id = auth.uid()));

-- ==========================================
-- 12. QUIZ_RESPONSES (anon insert + owner select)
-- ==========================================
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit quiz responses"
  ON public.quiz_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users view own quiz responses"
  ON public.quiz_responses FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_responses.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Users update own quiz responses"
  ON public.quiz_responses FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_responses.quiz_id AND user_id = auth.uid()));

CREATE POLICY "Users delete own quiz responses"
  ON public.quiz_responses FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_responses.quiz_id AND user_id = auth.uid()));

-- ==========================================
-- 13. QUIZ_TAGS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.quiz_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz tags"
  ON public.quiz_tags FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 14. QUIZ_TAG_RELATIONS (via quiz ownership)
-- ==========================================
ALTER TABLE public.quiz_tag_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own quiz tag relations"
  ON public.quiz_tag_relations FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_tag_relations.quiz_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_tag_relations.quiz_id AND user_id = auth.uid()));

-- ==========================================
-- 15. USER_SUBSCRIPTIONS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own subscription"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own subscription"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 16. USER_ROLES (user can read own, admin manages)
-- ==========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- ==========================================
-- 17. USER_WEBHOOKS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.user_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own webhooks"
  ON public.user_webhooks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 18. USER_INTEGRATIONS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own integrations"
  ON public.user_integrations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 19. NOTIFICATION_PREFERENCES (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own notification prefs"
  ON public.notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 20. SUPPORT_TICKETS (user_id = auth.uid() + admin)
-- ==========================================
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage all tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- ==========================================
-- 21. TICKET_MESSAGES (via ticket ownership)
-- ==========================================
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own ticket messages"
  ON public.ticket_messages FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()));

CREATE POLICY "Admins manage all ticket messages"
  ON public.ticket_messages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- ==========================================
-- 22. AI_QUIZ_GENERATIONS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.ai_quiz_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI generations"
  ON public.ai_quiz_generations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own AI generations"
  ON public.ai_quiz_generations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 23. BUNNY_VIDEOS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.bunny_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own bunny videos"
  ON public.bunny_videos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 24. VALIDATION_REQUESTS (user_id = auth.uid() + admin)
-- ==========================================
ALTER TABLE public.validation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own validation requests"
  ON public.validation_requests FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage validation requests"
  ON public.validation_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- ==========================================
-- 25. AUDIT_LOGS (insert own + admin select)
-- ==========================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anon insert audit logs"
  ON public.audit_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- ==========================================
-- 26. USER_ONBOARDING (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own onboarding"
  ON public.user_onboarding FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 27. VIDEO_ANALYTICS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own video analytics"
  ON public.video_analytics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anon insert video analytics"
  ON public.video_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ==========================================
-- 28. VIDEO_USAGE (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.video_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own video usage"
  ON public.video_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own video usage"
  ON public.video_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own video usage"
  ON public.video_usage FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 29. SCHEDULED_DELETIONS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.scheduled_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scheduled deletions"
  ON public.scheduled_deletions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own scheduled deletions"
  ON public.scheduled_deletions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own scheduled deletions"
  ON public.scheduled_deletions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ==========================================
-- 30. INTEGRATION_LOGS (user_id = auth.uid())
-- ==========================================
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own integration logs"
  ON public.integration_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own integration logs"
  ON public.integration_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- 31. WEBHOOK_LOGS (via webhook ownership)
-- ==========================================
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own webhook logs"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_webhooks WHERE id = webhook_logs.webhook_id AND user_id = auth.uid()));

CREATE POLICY "Anon insert webhook logs"
  ON public.webhook_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ==========================================
-- PUBLIC READ-ONLY TABLES
-- ==========================================

-- 32. SUBSCRIPTION_PLANS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage subscription plans"
  ON public.subscription_plans FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 33. QUIZ_TEMPLATES
ALTER TABLE public.quiz_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz templates"
  ON public.quiz_templates FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage quiz templates"
  ON public.quiz_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 34. LANDING_CONTENT
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view landing content"
  ON public.landing_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage landing content"
  ON public.landing_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 35. LANDING_AB_TESTS
ALTER TABLE public.landing_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view landing AB tests"
  ON public.landing_ab_tests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage landing AB tests"
  ON public.landing_ab_tests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- ==========================================
-- ANONYMOUS WRITE TABLES
-- ==========================================

-- 36. AB_TEST_SESSIONS
ALTER TABLE public.ab_test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert AB test sessions"
  ON public.ab_test_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update AB test sessions"
  ON public.ab_test_sessions FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users view own quiz AB sessions"
  ON public.ab_test_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = ab_test_sessions.quiz_id AND user_id = auth.uid()));

-- 37. LANDING_AB_SESSIONS
ALTER TABLE public.landing_ab_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert landing AB sessions"
  ON public.landing_ab_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update landing AB sessions"
  ON public.landing_ab_sessions FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins view landing AB sessions"
  ON public.landing_ab_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 38. COOKIE_CONSENTS
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert cookie consents"
  ON public.cookie_consents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users view own cookie consents"
  ON public.cookie_consents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 39. RATE_LIMIT_TRACKER
ALTER TABLE public.rate_limit_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert rate limit"
  ON public.rate_limit_tracker FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update rate limit"
  ON public.rate_limit_tracker FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can select rate limit"
  ON public.rate_limit_tracker FOR SELECT
  TO anon, authenticated
  USING (true);

-- ==========================================
-- ADMIN-ONLY TABLES
-- ==========================================

-- 40. MASTER_ADMIN_EMAILS
ALTER TABLE public.master_admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins manage admin emails"
  ON public.master_admin_emails FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Allow reading for the trigger (handle_new_user_role) via service_role
CREATE POLICY "Service can read admin emails"
  ON public.master_admin_emails FOR SELECT
  TO service_role
  USING (true);

-- 41. RECOVERY_SETTINGS
ALTER TABLE public.recovery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recovery settings"
  ON public.recovery_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 42. RECOVERY_TEMPLATES
ALTER TABLE public.recovery_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recovery templates"
  ON public.recovery_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 43. RECOVERY_CAMPAIGNS
ALTER TABLE public.recovery_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recovery campaigns"
  ON public.recovery_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 44. RECOVERY_CONTACTS
ALTER TABLE public.recovery_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recovery contacts"
  ON public.recovery_contacts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 45. RECOVERY_BLACKLIST
ALTER TABLE public.recovery_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recovery blacklist"
  ON public.recovery_blacklist FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 46. SYSTEM_HEALTH_METRICS
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage health metrics"
  ON public.system_health_metrics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));

-- 47. SYSTEM_SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage system settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master_admin'));
