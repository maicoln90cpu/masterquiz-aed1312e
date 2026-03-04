UPDATE profiles
SET account_created_event_sent = false
WHERE created_at >= now() - interval '5 days';