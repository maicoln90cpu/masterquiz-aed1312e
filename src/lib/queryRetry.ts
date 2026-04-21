/**
 * Política global de retry para o TanStack Query.
 *
 * Estratégia:
 * - Erros 4xx (cliente): NÃO retentar (404, 401, 403, 422 — não vão mudar com retry).
 * - Erros transitórios (5xx, network, timeout, AbortError): retentar com backoff exponencial.
 * - Limite de 3 tentativas por padrão (configurável por query).
 *
 * Backoff: 1s, 2s, 4s (capado em 30s) com jitter aleatório de até 250ms para evitar thundering herd.
 */

const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 404, 422]);
const NON_RETRYABLE_PG_CODES = new Set(['PGRST116', '42501', '23505']);

function isNonRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { status?: number; statusCode?: number; code?: string; name?: string };

  if (err.status && NON_RETRYABLE_STATUS.has(err.status)) return true;
  if (err.statusCode && NON_RETRYABLE_STATUS.has(err.statusCode)) return true;
  if (err.code && NON_RETRYABLE_PG_CODES.has(err.code)) return true;

  return false;
}

/**
 * Decide se uma query deve ser retentada após uma falha.
 * Compatível com a assinatura `retry: (failureCount, error) => boolean` do TanStack Query.
 */
export function shouldRetryQuery(failureCount: number, error: unknown, maxAttempts = 3): boolean {
  if (failureCount >= maxAttempts) return false;
  if (isNonRetryableError(error)) return false;
  return true;
}

/**
 * Calcula o delay (ms) entre tentativas usando backoff exponencial com jitter.
 * Compatível com a assinatura `retryDelay: (attemptIndex) => number` do TanStack Query.
 *
 * Sequência típica: ~1000ms, ~2000ms, ~4000ms, ~8000ms… (cap em 30s)
 */
export function queryRetryDelay(attemptIndex: number): number {
  const base = Math.min(1000 * 2 ** attemptIndex, 30_000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}
