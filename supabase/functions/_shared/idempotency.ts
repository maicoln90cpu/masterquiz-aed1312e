/**
 * 🛡️ PROTEÇÃO P19 (Onda 7) — Idempotência de Webhooks.
 *
 * Garante que o mesmo evento (provider, event_id) NUNCA seja processado
 * duas vezes. Usado por kiwify-webhook, evolution-webhook, etc.
 *
 * Uso típico:
 *   const claim = await claimEvent(supabaseAdmin, {
 *     provider: 'kiwify',
 *     eventId: orderId + ':' + status,
 *     traceId,
 *   });
 *   if (claim.alreadyProcessed) {
 *     return okResponse({ duplicate: true, previous: claim.previousResult }, traceId, corsHeaders);
 *   }
 *   // ... processa ...
 *   await markEventProcessed(supabaseAdmin, claim.id, { plan, status });
 */
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ClaimResult {
  /** UUID do registro em webhook_events (use em markEventProcessed). */
  id: string;
  /** True se este evento JÁ foi visto antes — não reprocessar. */
  alreadyProcessed: boolean;
  /** Resultado do processamento anterior, se já existir. */
  previousResult: unknown | null;
}

export interface ClaimOptions {
  provider: string;
  eventId: string;
  payloadHash?: string;
  traceId: string;
}

/**
 * Tenta "reservar" um evento. Se já existe (UNIQUE conflict),
 * retorna o registro anterior com `alreadyProcessed: true`.
 */
export async function claimEvent(
  supabase: SupabaseClient,
  opts: ClaimOptions,
): Promise<ClaimResult> {
  // Tenta inserir; se conflitar, devolve null e buscamos o existente.
  const { data: inserted, error: insertErr } = await supabase
    .from('webhook_events')
    .insert({
      provider: opts.provider,
      event_id: opts.eventId,
      payload_hash: opts.payloadHash ?? null,
      trace_id: opts.traceId,
      status: 'received',
    })
    .select('id')
    .maybeSingle();

  if (inserted?.id) {
    return { id: inserted.id, alreadyProcessed: false, previousResult: null };
  }

  // Conflito (já existe) ou outro erro — buscar registro existente
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id, status, result')
    .eq('provider', opts.provider)
    .eq('event_id', opts.eventId)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      alreadyProcessed: existing.status === 'processed' || existing.status === 'duplicate',
      previousResult: existing.result ?? null,
    };
  }

  // Nada inserido nem encontrado — propagar erro
  throw insertErr ?? new Error('claimEvent: could not insert nor find webhook event');
}

/** Marca evento como processado com sucesso (guarda resultado). */
export async function markEventProcessed(
  supabase: SupabaseClient,
  id: string,
  result: unknown,
): Promise<void> {
  await supabase
    .from('webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      result: result as never,
    })
    .eq('id', id);
}

/** Marca evento como falho (para retry/inspeção). */
export async function markEventFailed(
  supabase: SupabaseClient,
  id: string,
  error: string,
): Promise<void> {
  await supabase
    .from('webhook_events')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      result: { error } as never,
    })
    .eq('id', id);
}
