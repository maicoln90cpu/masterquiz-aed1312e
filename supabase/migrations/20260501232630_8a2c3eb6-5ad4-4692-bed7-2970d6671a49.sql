-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role));

-- quizzes
DROP POLICY IF EXISTS "Users CRUD own quizzes" ON public.quizzes;
CREATE POLICY "Users CRUD own quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- quiz_responses
DROP POLICY IF EXISTS "Users view own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users view own quiz responses" ON public.quiz_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = quiz_responses.quiz_id
      AND quizzes.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users update own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users update own quiz responses" ON public.quiz_responses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = quiz_responses.quiz_id
      AND quizzes.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Users delete own quiz responses" ON public.quiz_responses;
CREATE POLICY "Users delete own quiz responses" ON public.quiz_responses
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = quiz_responses.quiz_id
      AND quizzes.user_id = (SELECT auth.uid())
  ));

-- email_recovery_contacts
DROP POLICY IF EXISTS "Admins manage email recovery contacts" ON public.email_recovery_contacts;
CREATE POLICY "Admins manage email recovery contacts" ON public.email_recovery_contacts
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role));

-- email_recovery_templates
DROP POLICY IF EXISTS "Admins manage email recovery templates" ON public.email_recovery_templates;
CREATE POLICY "Admins manage email recovery templates" ON public.email_recovery_templates
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role));

-- recovery_contacts
DROP POLICY IF EXISTS "Admins manage recovery contacts" ON public.recovery_contacts;
CREATE POLICY "Admins manage recovery contacts" ON public.recovery_contacts
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role)
      OR public.has_role((SELECT auth.uid()), 'master_admin'::app_role));

-- user_subscriptions
DROP POLICY IF EXISTS "Users view own subscription" ON public.user_subscriptions;
CREATE POLICY "Users view own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users update own subscription" ON public.user_subscriptions;
CREATE POLICY "Users update own subscription" ON public.user_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Users insert own subscription" ON public.user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'master_admin'::app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'master_admin'::app_role));