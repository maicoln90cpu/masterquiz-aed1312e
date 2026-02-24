
-- Add column to track unread tickets for admin
ALTER TABLE public.support_tickets ADD COLUMN has_unread_admin boolean NOT NULL DEFAULT true;

-- Mark existing non-open tickets as read
UPDATE public.support_tickets SET has_unread_admin = false WHERE status IN ('resolved', 'closed');
