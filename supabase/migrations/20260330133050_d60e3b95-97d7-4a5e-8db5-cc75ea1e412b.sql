-- Drop both existing UNIQUE constraints on (user_id, template_id)
ALTER TABLE public.email_recovery_contacts DROP CONSTRAINT IF EXISTS email_recovery_contacts_user_id_template_id_key;
ALTER TABLE public.email_recovery_contacts DROP CONSTRAINT IF EXISTS email_recovery_contacts_user_template_unique;

-- Create new UNIQUE constraint including campaign_id
ALTER TABLE public.email_recovery_contacts ADD CONSTRAINT email_recovery_contacts_user_template_campaign_unique UNIQUE (user_id, template_id, campaign_id);