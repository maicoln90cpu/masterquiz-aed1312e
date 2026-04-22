/**
 * 🛡️ PROTEÇÃO P18 — Facade ÚNICA para chamadas a Edge Functions (camada de serviços).
 *
 * Esta é a "porta de entrada" universal:
 *   componente → useEdgeFunction → invokeEdgeFunction → invokeResilient → unwrapEnvelope
 *
 * Funcionalidades embutidas:
 *   1. Geração/propagação automática de `traceId` (header `x-trace-id`).
 *   2. Retry + timeout + circuit breaker via `invokeResilient` (P15).
 *   3. `unwrapEnvelope` quando a edge já adotou o envelope P11 — caso contrário
 *      `legacyMode: true` faz bypass do unwrap (migração gradual, sem big-bang).
 *   4. Erros sempre normalizados em `EdgeCallError` com `code`, `message`, `traceId`.
 *
 * NUNCA chame `supabase.functions.invoke(...)` diretamente fora deste arquivo —
 * use sempre esta facade ou o hook `useEdgeFunction`. Quebra o contrato P18.
 */

import { invokeResilient, type ResilientOptions } from '@/lib/resilientFetch';
import { unwrapEnvelope, EnvelopeError, type EnvelopeErrorCode } from '@/lib/envelope';

export interface InvokeEdgeOptions extends Omit<ResilientOptions, 'traceId'> {
  /** Trace ID custom (se omitido, geramos um novo). */
  traceId?: string;
  /**
   * Modo legado: força bypass do envelope mesmo quando ele existe.
   * Default: `'auto'` — detecta automaticamente pela presença de `ok` + `traceId`.
   *   - `'auto'` (padrão recomendado): se a resposta parecer envelope, faz unwrap;
   *      caso contrário devolve cru. Migração indolor.
   *   - `true`: sempre devolve cru (compat absoluta).
   *   - `false`: sempre exige envelope (estrito).
   */
  legacyMode?: boolean | 'auto';
}

export class EdgeCallError extends Error {
  code: EnvelopeErrorCode | 'NETWORK' | 'TIMEOUT' | 'CIRCUIT_OPEN' | 'NON_RETRYABLE' | 'UNKNOWN';
  traceId: string;
  status?: number;
  constructor(
    code: EdgeCallError['code'],
    message: string,
    traceId: string,
    status?: number,
  ) {
    super(message);
    this.name = 'EdgeCallError';
    this.code = code;
    this.traceId = traceId;
    this.status = status;
  }
}

function newTraceId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Chama uma edge function com toda a resiliência + envelope embutidos.
 * Retorna `data` (do envelope ou cru, conforme `legacyMode`) ou lança `EdgeCallError`.
 */
export async function invokeEdgeFunction<T = unknown>(
  fnName: string,
  body?: Record<string, unknown>,
  opts: InvokeEdgeOptions = {},
): Promise<{ data: T; traceId: string }> {
  const { legacyMode = 'auto', traceId: providedTraceId, ...resilientOpts } = opts;
  const traceId = providedTraceId || newTraceId();

  const { data: raw, error } = await invokeResilient<unknown>(fnName, body, {
    ...resilientOpts,
    traceId,
  });

  if (error) {
    // Mapeia códigos da camada resiliente para EdgeCallError
    const code = (error.code as EdgeCallError['code']) || 'UNKNOWN';
    throw new EdgeCallError(code, error.message, traceId, error.status);
  }

  // Auto-detect: envelope tem `ok: boolean` + `traceId: string`
  const looksLikeEnvelope =
    raw !== null &&
    typeof raw === 'object' &&
    'ok' in (raw as Record<string, unknown>) &&
    typeof (raw as Record<string, unknown>).ok === 'boolean' &&
    'traceId' in (raw as Record<string, unknown>);

  if (legacyMode === true || (legacyMode === 'auto' && !looksLikeEnvelope)) {
    return { data: raw as T, traceId };
  }

  // Modo envelope estrito (P11)
  try {
    const unwrapped = unwrapEnvelope<T>(raw);
    return { data: unwrapped, traceId };
  } catch (e) {
    if (e instanceof EnvelopeError) {
      throw new EdgeCallError(e.code, e.message, e.traceId || traceId);
    }
    throw new EdgeCallError('UNKNOWN', (e as Error)?.message || 'Falha desconhecida', traceId);
  }
}

/**
 * Mensagens PT-BR padrão por código de erro — usadas pelo hook ao mostrar toast.
 */
export function defaultErrorMessage(err: EdgeCallError): string {
  const short = err.traceId ? ` (id: ${err.traceId.slice(0, 8)})` : '';
  switch (err.code) {
    case 'TIMEOUT':
      return `O servidor demorou demais para responder. Tente novamente.${short}`;
    case 'CIRCUIT_OPEN':
      return `Serviço temporariamente indisponível. Aguarde alguns segundos.${short}`;
    case 'NETWORK':
      return `Falha de conexão. Verifique sua internet.${short}`;
    case 'RATE_LIMITED':
      return `Muitas tentativas. Aguarde um momento.${short}`;
    case 'UNAUTHORIZED':
      return `Sessão expirada ou sem permissão. Faça login novamente.${short}`;
    case 'FORBIDDEN':
      return `Você não tem permissão para esta ação.${short}`;
    case 'NOT_FOUND':
      return `Recurso não encontrado.${short}`;
    case 'VALIDATION_FAILED':
      return err.message || `Dados inválidos.${short}`;
    default:
      return err.message ? `${err.message}${short}` : `Erro inesperado.${short}`;
  }
}