-- Inserir template de ativação 24h para exploradores sem quiz publicado
INSERT INTO public.recovery_templates (name, message_content, category, trigger_days, is_active, priority)
VALUES (
  'Ativação 24h — Explorador sem quiz publicado',
  E'Oi {{nome}}! 👋\n\nVocê começou a montar seu quiz no MasterQuizz, mas ele ainda não está publicado.\n\nQuer que a gente te ajude a finalizar em 2 minutos? É só abrir o editor e clicar em *Publicar*:\n\n👉 https://masterquizz.com.br/dashboard\n\nSe tiver qualquer dúvida, responde aqui que a gente te ajuda! 💬',
  'activation_reminder',
  1,
  true,
  0
)
ON CONFLICT DO NOTHING;