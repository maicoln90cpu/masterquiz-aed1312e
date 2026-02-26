-- Add column to track if account_created event was sent
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_created_event_sent boolean DEFAULT false;

-- Mark all existing users (created before today) as already sent to avoid false positives
UPDATE public.profiles 
SET account_created_event_sent = true 
WHERE created_at < now() - interval '7 days';
