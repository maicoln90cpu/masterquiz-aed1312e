
-- FKs com DO block para evitar erro se ja existir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ticket_messages_ticket_id') THEN
    ALTER TABLE public.ticket_messages
      ADD CONSTRAINT fk_ticket_messages_ticket_id
      FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_integration_logs_integration_id') THEN
    ALTER TABLE public.integration_logs
      ADD CONSTRAINT fk_integration_logs_integration_id
      FOREIGN KEY (integration_id) REFERENCES public.user_integrations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_webhook_logs_webhook_id') THEN
    ALTER TABLE public.webhook_logs
      ADD CONSTRAINT fk_webhook_logs_webhook_id
      FOREIGN KEY (webhook_id) REFERENCES public.user_webhooks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_bunny_videos_user_id ON public.bunny_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_fields_quiz_id ON public.custom_form_fields(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_quiz_id ON public.quiz_results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_result_id ON public.quiz_responses(result_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_user_id ON public.validation_requests(user_id);
