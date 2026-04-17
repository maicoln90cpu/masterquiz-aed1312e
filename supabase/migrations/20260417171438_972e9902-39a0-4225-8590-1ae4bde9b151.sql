-- Etapa 2: Tratamento honesto de "0 entregues"
-- Adiciona coluna para distinguir entrega confirmada vs assumida e cria função de diagnóstico

-- 1) Coluna para marcar entregas presumidas (sem ack do WhatsApp)
ALTER TABLE public.recovery_contacts
  ADD COLUMN IF NOT EXISTS delivery_assumed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.recovery_contacts.delivery_assumed IS
  'TRUE quando o status delivered foi inferido pelo backfill (sem ack real da Evolution API). FALSE quando veio do webhook DELIVERY_ACK.';

-- 2) Backfill: mensagens enviadas há mais de 7 dias sem failure → marcar como entregues (assumido)
UPDATE public.recovery_contacts
SET status = 'delivered',
    delivered_at = COALESCE(delivered_at, sent_at + interval '5 minutes'),
    delivery_assumed = true,
    updated_at = now()
WHERE status = 'sent'
  AND sent_at IS NOT NULL
  AND sent_at < (now() - interval '7 days')
  AND delivered_at IS NULL;

-- 3) View de saúde do webhook Evolution (para diagnóstico no painel)
CREATE OR REPLACE VIEW public.v_evolution_webhook_health AS
SELECT
  -- Totais gerais
  (SELECT COUNT(*) FROM recovery_contacts WHERE status IN ('sent','delivered','read','responded'))::int AS total_sent_or_more,
  (SELECT COUNT(*) FROM recovery_contacts WHERE status = 'sent' AND delivered_at IS NULL)::int AS stuck_sent_no_ack,
  (SELECT COUNT(*) FROM recovery_contacts WHERE status = 'delivered' AND delivery_assumed = false)::int AS confirmed_delivered_real,
  (SELECT COUNT(*) FROM recovery_contacts WHERE delivery_assumed = true)::int AS delivered_assumed_count,
  (SELECT COUNT(*) FROM recovery_contacts WHERE read_at IS NOT NULL)::int AS confirmed_read,
  -- Última confirmação real recebida (qualquer ack via webhook)
  (SELECT MAX(delivered_at) FROM recovery_contacts WHERE delivery_assumed = false AND delivered_at IS NOT NULL) AS last_real_delivery_ack_at,
  (SELECT MAX(read_at) FROM recovery_contacts WHERE read_at IS NOT NULL) AS last_read_ack_at,
  -- Diagnóstico booleano
  CASE
    WHEN (SELECT COUNT(*) FROM recovery_contacts WHERE delivery_assumed = false AND delivered_at IS NOT NULL) = 0
      THEN 'critical_no_ack_ever'
    WHEN (SELECT MAX(delivered_at) FROM recovery_contacts WHERE delivery_assumed = false) < (now() - interval '48 hours')
      THEN 'warning_no_recent_ack'
    ELSE 'healthy'
  END AS webhook_health;

GRANT SELECT ON public.v_evolution_webhook_health TO authenticated;

COMMENT ON VIEW public.v_evolution_webhook_health IS
  'Diagnóstico de saúde do webhook Evolution. Indica se DELIVERY_ACK e READ estão chegando do WhatsApp.';