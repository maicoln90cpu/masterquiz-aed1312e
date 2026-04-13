
-- Step 1: Clean up duplicate pending recovery_contacts (keep only the newest per user_id + phone_number)
DELETE FROM recovery_contacts
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, phone_number) id
  FROM recovery_contacts
  WHERE status = 'pending'
  ORDER BY user_id, phone_number, created_at DESC
)
AND status = 'pending';

-- Step 2: Create partial unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_contacts_unique_pending
ON recovery_contacts (user_id, phone_number)
WHERE status = 'pending';

-- Step 3: Add max_agent_retries to whatsapp_ai_settings
ALTER TABLE whatsapp_ai_settings
ADD COLUMN IF NOT EXISTS max_agent_retries integer NOT NULL DEFAULT 2;

-- Add comment for documentation
COMMENT ON COLUMN whatsapp_ai_settings.max_agent_retries IS 'Maximum consecutive AI replies before escalating to human support. Configurable in admin panel.';
