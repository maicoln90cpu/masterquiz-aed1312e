-- ============================================================
-- Onda 7 — Etapa 3: Idempotência de Webhooks (P19)
-- ============================================================
-- Cria tabela webhook_events para garantir que o mesmo evento
-- (provider+event_id) nunca seja processado duas vezes.
-- Usada por kiwify-webhook, evolution-webhook (e futuros).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  payload_hash text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed','duplicate')),
  result jsonb,
  trace_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT webhook_events_provider_event_unique UNIQUE (provider, event_id)
);

-- Índices para consulta e limpeza
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_received
  ON public.webhook_events (provider, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status
  ON public.webhook_events (status)
  WHERE status IN ('failed','received');

-- ============================================================
-- RLS — somente service_role
-- ============================================================
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Master_admin pode visualizar (para debug no painel)
CREATE POLICY "Master admins can view webhook events"
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'::public.app_role));

-- ============================================================
-- Função de limpeza (retenção 90 dias)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.webhook_events
  WHERE received_at < now() - interval '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE public.webhook_events IS
  'Onda 7 P19: registro de eventos de webhook recebidos para garantir idempotência. UNIQUE(provider, event_id) bloqueia reprocessamento.';

COMMENT ON FUNCTION public.cleanup_old_webhook_events IS
  'Remove eventos com mais de 90 dias. Chamar via pg_cron semanalmente.';