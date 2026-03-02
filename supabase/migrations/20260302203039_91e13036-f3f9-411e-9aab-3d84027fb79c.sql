-- Reset all profiles to re-fire AccountCreated event with correct name
UPDATE profiles SET account_created_event_sent = false WHERE account_created_event_sent = true;