
-- Manual merge for maicoln90@hotmail.com
-- Old profile ID: 820549fa-e497-47c3-af43-9f54f3e59944
-- New auth user ID: 95653106-2468-4c98-934a-d5c7c25ddeef

-- 1. Update all tables with user_id
UPDATE quizzes SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE user_subscriptions SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE quiz_tags SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE user_webhooks SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE user_integrations SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE notification_preferences SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE support_tickets SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE ai_quiz_generations SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE bunny_videos SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE audit_logs SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE validation_requests SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE user_onboarding SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE video_analytics SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE video_usage SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE scheduled_deletions SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';
UPDATE integration_logs SET user_id = '95653106-2468-4c98-934a-d5c7c25ddeef' WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';

-- 2. Handle user_roles (avoid duplicates)
INSERT INTO user_roles (user_id, role)
SELECT '95653106-2468-4c98-934a-d5c7c25ddeef', role 
FROM user_roles WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM user_roles WHERE user_id = '820549fa-e497-47c3-af43-9f54f3e59944';

-- 3. Update orphan profile to become the new user's profile
-- (rename old profile to new auth user ID)
UPDATE profiles 
SET id = '95653106-2468-4c98-934a-d5c7c25ddeef'
WHERE id = '820549fa-e497-47c3-af43-9f54f3e59944';
