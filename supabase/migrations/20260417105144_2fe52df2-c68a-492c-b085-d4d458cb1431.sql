-- Limpeza prévia: remover pendente órfão da Pamela
DELETE FROM recovery_contacts
WHERE id = '0e6c0482-e3a8-4d89-80e2-822a8c7e1dd4'
  AND status = 'pending'
  AND template_id IS NULL
  AND campaign_id IS NULL;

-- 3A: confirma horário fim 20:00
UPDATE recovery_settings
SET allowed_hours_end = '20:00:00', updated_at = now()
WHERE id = (SELECT id FROM recovery_settings ORDER BY created_at LIMIT 1);

-- 3B: auditoria — desativa categoria inválida (general)
UPDATE recovery_templates
SET is_active = false, updated_at = now()
WHERE category NOT IN (
  'welcome','first_quiz','zombie','no_response','inactive','recovery',
  'activation_reminder','first_contact','check_in','reminder','special_offer','final_contact'
) OR category IS NULL;

-- 3C: Template Zombie
INSERT INTO recovery_templates (name, category, message_content, trigger_days, priority, is_active)
VALUES (
  'Zombie — Cria Seu Quiz Real',
  'zombie',
  E'Oi {{nome}}! 👋\n\nVocê criou sua conta no MasterQuizz mas ainda não criou seu quiz de verdade.\n\nEm 2 minutos a IA monta tudo pra você — é só descrever seu negócio em uma frase.\n\nQuer ver como fica? 👇\nhttps://masterquiz.com.br/create-quiz',
  30, 10, true
);

-- 3D: Template Quiz Sem Resposta
INSERT INTO recovery_templates (name, category, message_content, trigger_days, priority, is_active)
VALUES (
  'Quiz Publicado — Sem Resposta',
  'no_response',
  E'Oi {{nome}}! 🎯\n\nSeu quiz está publicado mas ainda não recebeu respostas.\n\nTenho 3 formas rápidas de divulgá-lo ainda hoje — funciona mesmo sem verba em anúncio.\n\nQuer que eu te mostre? 👇\n{{link}}',
  7, 8, true
);

-- 3E: Campanha Quiz Sem Resposta
INSERT INTO recovery_campaigns (name, description, template_id, status, is_automatic, scheduled_at)
VALUES (
  'Abril 2026 — Quiz Sem Resposta',
  'Campanha manual para usuários que publicaram quiz real mas não receberam nenhuma resposta.',
  (SELECT id FROM recovery_templates WHERE name = 'Quiz Publicado — Sem Resposta' LIMIT 1),
  'draft', false, now()
);

-- 3F: Enfileira 3 destinatários
WITH camp AS (
  SELECT id AS campaign_id, template_id
  FROM recovery_campaigns
  WHERE name = 'Abril 2026 — Quiz Sem Resposta'
  ORDER BY created_at DESC LIMIT 1
)
INSERT INTO recovery_contacts
  (user_id, campaign_id, template_id, phone_number, custom_link, status, priority, scheduled_at)
SELECT v.user_id, camp.campaign_id, camp.template_id, v.whatsapp, v.link, 'pending', 10, now()
FROM camp,
(VALUES
  ('02662abd-9cb5-4c56-860a-f727015e7a15'::uuid, '5511951471944', 'https://masterquiz.com.br/borges-videomaker/descubra-como-potencializar-o-canal-do-seu-negcio-no-youtube'),
  ('dd3882fd-83a8-4e3e-a9c7-5a986b5fd467'::uuid, '5521998441672', 'https://masterquiz.com.br/quiz/quiz-lubrax'),
  ('ab49fba8-cc97-4214-a4bf-47a39b4e25c9'::uuid, '5547999839993', 'https://masterquiz.com.br/quiz/como-fazer-uma-renda-extra-usando-apenas-o-celular')
) AS v(user_id, whatsapp, link)
ON CONFLICT (user_id, template_id) DO NOTHING;

-- 3G: Campanha Reativação Zombies (sem enfileirar agora — botão na UI faz)
INSERT INTO recovery_campaigns (name, description, template_id, status, is_automatic, scheduled_at)
VALUES (
  'Abril 2026 — Reativação Zombies',
  'Campanha manual para usuários com login_count <= 1 que nunca criaram quiz real. Enfileirar via botão Confirmar no painel.',
  (SELECT id FROM recovery_templates WHERE name = 'Zombie — Cria Seu Quiz Real' LIMIT 1),
  'draft', false, now()
);