
UPDATE recovery_contacts 
SET template_id = '2776b38e-7090-411c-a528-c0d0b6877f38'
WHERE status = 'pending' AND template_id IS NULL AND days_inactive_at_contact = 0;
