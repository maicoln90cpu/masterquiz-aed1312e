UPDATE user_subscriptions 
SET plan_type = 'partner', 
    status = 'active', 
    quiz_limit = 5, 
    response_limit = 25000, 
    payment_confirmed = true, 
    updated_at = now() 
WHERE user_id = 'fc1906d0-44db-4d74-9668-0e2e5f04c4ad';