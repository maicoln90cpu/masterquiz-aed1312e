-- Correção 4: índices duplicados
DROP INDEX IF EXISTS public.idx_quiz_responses_completed_at;
DROP INDEX IF EXISTS public.idx_quiz_responses_quiz_id;

-- Correção 5: índices em FKs críticas
CREATE INDEX IF NOT EXISTS idx_email_recovery_contacts_template_id
  ON public.email_recovery_contacts(template_id);

CREATE INDEX IF NOT EXISTS idx_recovery_contacts_user_id_fk
  ON public.recovery_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_institutional_email_domains_created_by
  ON public.institutional_email_domains(created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id_fk
  ON public.whatsapp_conversations(user_id);