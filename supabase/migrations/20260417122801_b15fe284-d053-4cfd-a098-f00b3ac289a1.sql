-- ETAPA 1 — BACKFILL CONSOLIDADO (4 ações idempotentes)

-- 1A) Blacklist dos bounces reais (gmail/hotmail/etc) já marcados como bounce
INSERT INTO public.email_unsubscribes (email, reason, unsubscribed_at)
SELECT DISTINCT lower(email), 'bounce', now()
FROM public.email_recovery_contacts
WHERE status='failed'
  AND error_message ILIKE '%bounce%'
  AND email ~* '@(gmail|hotmail|outlook|yahoo|icloud|live|uol|bol|terra|globo|me|protonmail)\.[a-z]+$'
ON CONFLICT (email) DO NOTHING;

-- Também cancelar futuros disparos para esses emails
UPDATE public.email_recovery_contacts
SET status='cancelled', error_message='bounce: blacklisted'
WHERE status='pending'
  AND lower(email) IN (SELECT email FROM public.email_unsubscribes WHERE reason='bounce');

-- 1B) Atualizar custom_link dos 3 contatos legados (Karen Lyra, Pamela, Gustavo Borges)
UPDATE public.recovery_contacts rc
SET custom_link = 'https://masterquiz.com.br/' || p.company_slug
FROM public.profiles p
WHERE rc.user_id = p.id
  AND rc.id IN (
    'c60f32c0-df51-4109-aa28-a8118b5cd1a6',  -- Karen Lyra
    '54ccb900-d2ad-4dab-924a-479da02c8a49',  -- Pamela Aline
    'f2690399-df9a-4b84-a63c-af482d580200'   -- Gustavo Borges
  )
  AND rc.custom_link LIKE '%/quiz/%';

-- 1C) Backfill tutorial: usuários com quiz manual antes de 15/abr e sem tutorial enviado
INSERT INTO public.email_recovery_contacts (user_id, email, template_id, status, scheduled_at, priority)
SELECT
  u.id,
  u.email,
  '34f9d99a-601c-4b1b-8102-c98155af4bab',
  'pending',
  now() + (random() * interval '6 hours'),  -- spread leve para não sobrecarregar fila
  50
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email IS NOT NULL
  AND p.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.user_id = u.id
      AND COALESCE(q.creation_source,'') != 'express_auto'
      AND q.created_at < '2026-04-15'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.email_recovery_contacts erc
    WHERE erc.user_id = u.id
      AND erc.template_id = '34f9d99a-601c-4b1b-8102-c98155af4bab'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.email_unsubscribes eu
    WHERE lower(eu.email) = lower(u.email)
  )
ON CONFLICT DO NOTHING;

-- 1D) Reprocessar fila travada por saldo zero (261 emails)
UPDATE public.email_recovery_contacts
SET status='pending',
    retry_count=0,
    error_message=NULL,
    scheduled_at=now() + (random() * interval '2 hours')
WHERE status='failed'
  AND (error_message ILIKE '%INSUFICIENT%'
    OR error_message ILIKE '%balance%'
    OR error_message ILIKE '%saldo%'
    OR error_message ILIKE '%credit%');