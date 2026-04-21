/**
 * Logger de retries esgotados — registra em `client_error_logs` toda vez que
 * uma query do TanStack Query falha após esgotar todas as tentativas.
 *
 * Objetivo: detectar serviços instáveis (5xx recorrentes, timeouts, latência alta
 * que mata o backoff exponencial) sem depender só do erro pontual mostrado ao usuário.
 *
 * IMPORTANTE — proteção contra log flood:
 *  - Deduplicação por (queryKey + mensagem do erro) durante 60s.
 *  - Erros não-retentáveis (4xx) NÃO são logados aqui (já são imediatos e esperados).
 *  - Erros já filtrados em `errorCapture.shouldIgnoreError` continuam sendo descartados
 *    pelo próprio `logClientError`.
 */
import { logClientError } from './errorCapture';

const DEDUP_WINDOW_MS = 60_000;
const recentLogs = new Map<string, number>();

function makeKey(queryKey: unknown, message: string): string {
  let serialized = '';
  try {
    serialized = JSON.stringify(queryKey);
  } catch {
    serialized = String(queryKey);
  }
  return `${serialized}::${message.slice(0, 120)}`;
}

function isRecentlyLogged(key: string): boolean {
  const now = Date.now();
  // Limpa entradas antigas oportunisticamente
  if (recentLogs.size > 200) {
    for (const [k, ts] of recentLogs) {
      if (now - ts > DEDUP_WINDOW_MS) recentLogs.delete(k);
    }
  }
  const last = recentLogs.get(key);
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentLogs.set(key, now);
  return false;
}

interface LogParams {
  queryKey: unknown;
  error: unknown;
  failureCount: number;
  maxAttempts: number;
}

export function logQueryRetryExhausted({ queryKey, error, failureCount, maxAttempts }: LogParams) {
  const err = error as { message?: string; status?: number; statusCode?: number; code?: string; name?: string };
  const message = err?.message || String(error) || 'Unknown query error';
  const status = err?.status ?? err?.statusCode;

  // Não loga erros de cliente (4xx) — são esperados e não indicam serviço instável
  if (status && status >= 400 && status < 500) return;

  const key = makeKey(queryKey, message);
  if (isRecentlyLogged(key)) return;

  void logClientError({
    component_name: 'QueryRetryExhausted',
    error_message: `[retry esgotado] ${message}`,
    metadata: {
      query_key: typeof queryKey === 'string' ? queryKey : JSON.stringify(queryKey).slice(0, 300),
      failure_count: failureCount,
      max_attempts: maxAttempts,
      http_status: status ?? null,
      error_code: err?.code ?? null,
      error_name: err?.name ?? null,
    },
  });
}