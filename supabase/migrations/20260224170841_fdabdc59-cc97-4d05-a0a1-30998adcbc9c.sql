-- Resetar login_count inflado por bug de token refresh
UPDATE profiles SET login_count = 1 WHERE id = '6c1744fb-8655-4acf-bd8d-948dbddac025';