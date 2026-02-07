
-- Add foreign key relationships that are missing for PostgREST joins

-- quiz_analytics -> quizzes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quiz_analytics_quiz_id_fkey' AND table_name = 'quiz_analytics'
  ) THEN
    ALTER TABLE public.quiz_analytics 
      ADD CONSTRAINT quiz_analytics_quiz_id_fkey 
      FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- quiz_responses -> quizzes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quiz_responses_quiz_id_fkey' AND table_name = 'quiz_responses'
  ) THEN
    ALTER TABLE public.quiz_responses 
      ADD CONSTRAINT quiz_responses_quiz_id_fkey 
      FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- quiz_responses -> quiz_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quiz_responses_result_id_fkey' AND table_name = 'quiz_responses'
  ) THEN
    ALTER TABLE public.quiz_responses 
      ADD CONSTRAINT quiz_responses_result_id_fkey 
      FOREIGN KEY (result_id) REFERENCES public.quiz_results(id) ON DELETE SET NULL;
  END IF;
END $$;

-- recovery_contacts -> profiles (user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'recovery_contacts_user_id_fkey' AND table_name = 'recovery_contacts'
  ) THEN
    ALTER TABLE public.recovery_contacts 
      ADD CONSTRAINT recovery_contacts_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- recovery_contacts -> recovery_templates (template_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'recovery_contacts_template_id_fkey' AND table_name = 'recovery_contacts'
  ) THEN
    ALTER TABLE public.recovery_contacts 
      ADD CONSTRAINT recovery_contacts_template_id_fkey 
      FOREIGN KEY (template_id) REFERENCES public.recovery_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- recovery_contacts -> recovery_campaigns (campaign_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'recovery_contacts_campaign_id_fkey' AND table_name = 'recovery_contacts'
  ) THEN
    ALTER TABLE public.recovery_contacts 
      ADD CONSTRAINT recovery_contacts_campaign_id_fkey 
      FOREIGN KEY (campaign_id) REFERENCES public.recovery_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;
