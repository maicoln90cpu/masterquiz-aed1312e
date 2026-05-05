ALTER TABLE public.user_subscriptions
  ALTER COLUMN quiz_limit SET DEFAULT 1,
  ALTER COLUMN response_limit SET DEFAULT 30;