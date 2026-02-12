
-- Ativar is_active na recovery_settings
UPDATE recovery_settings SET is_active = true, updated_at = now();

-- Inserir os 7 usuários pendentes na fila de welcome
INSERT INTO recovery_contacts (user_id, phone_number, template_id, status, priority, days_inactive_at_contact, scheduled_at)
VALUES
  ('394250f4-6b46-43ee-94f2-702c9924ce5e', '5567992080916', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now()),
  ('b85bfef6-2260-4242-9375-5431bb3e88e4', '5511943997506', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now()),
  ('1ae9541f-eaf4-49b4-9eef-eb447e71d2e4', '5511999136884', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now()),
  ('f5fef786-b9ec-4f02-85d3-238728d9c6f8', '5511999136884', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now()),
  ('495368ca-f940-4cb5-bf54-d41093cdd903', '5555119991368', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now()),
  ('45d8fbe0-2f8a-477c-9e97-56e3b7400ac9', '5511999136884', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now()),
  ('e62daf1e-7204-4223-8bf0-9c5bc674458f', '5511999136884', '2776b38e-7090-411c-a528-c0d0b6877f38', 'pending', -1, 0, now())
ON CONFLICT DO NOTHING;
