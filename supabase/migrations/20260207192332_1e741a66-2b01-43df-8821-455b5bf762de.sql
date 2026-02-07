-- Confirmar email do usuário migrado
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'maicoln90@hotmail.com' AND email_confirmed_at IS NULL;