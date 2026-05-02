UPDATE public.email_recovery_contacts
SET status = 'cancelled', updated_at = now()
WHERE template_id = (
  SELECT id FROM public.email_recovery_templates
  WHERE category = 'plan_compare'
  LIMIT 1
)
AND status = 'pending';