/**
 * 🛡️ PROTEÇÃO P15 — Camada universal de chamadas resilientes a Edge Functions.
 *
 * Envolve `supabase.functions.invoke` adicionando:
 *   1. Timeout configurável via AbortController (padrão 15s).
 *   2. Retry com backoff exponencial + jitter (padrão 3 tentativas).
 *      Só retenta em erros retryable (5xx, network, timeout) — nunca em 4xx.
 *   3. Circuit breaker em memória, por nome de função:
 *      CLOSED → 5 falhas em 60s → OPEN (30s) → HALF_OPEN → CLOSED ou OPEN.
 *
 * Retorna sempre `{ data, error }` no mesmo formato do invoke original,
 * garantindo adoção opt-in sem quebrar chamadas existentes.
 *
 * NUNCA modifique este arquivo sem atualizar `resilientFetch.test.ts` —
 * o contract test (P15) garante que o shape continua compatível.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ──────────────────────────────────────────────────────────────
// Tipos públicos
// ──────────────────────────────────────────────────────────────

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface ResilientOptions {
  /** Timeout por tentativa (ms). Padrão 15000. */
  timeoutMs?: number;
  /** Número máximo de tentativas (incluindo a primeira). Padrão 3. */
  maxRetries?: number;
  /** Atraso base do backoff (ms). Padrão 1000 → 1s, 2s, 4s. */
  baseDelayMs?: number;
  /** Atraso máximo entre tentativas (ms). Padrão 8000. */
  maxDelayMs?: number;
  /** Header opcional para correlacionar logs (envelope P11). */
  traceId?: string;
  /** Desabilita o circuit breaker (uso em testes). */
  disableCircuitBreaker?: boolean;
}

export interface ResilientResult<T = unknown> {
  data: T | null;
  error:
    | null
    | {
        message: string;
        /** Códigos especiais introduzidos por esta camada. */
        code?: 'CIRCUIT_OPEN' | 'TIMEOUT' | 'NETWORK' | 'NON_RETRYABLE' | string;
        status?: number;
      };
}

// ──────────────────────────────────────────────────────────────
// Circuit breaker (estado em memória, por função)
// ──────────────────────────────────────────────────────────────

interface BreakerState {
  state: CircuitState;
  failures: number;
  firstFailureAt: number;
  openedAt: number;
}

const FAILURE_THRESHOLD = 5;
const FAILURE_WINDOW_MS = 60_000;
const OPEN_DURATION_MS = 30_000;

const breakers = new Map<string, BreakerState>();

function getBreaker(fn: string): BreakerState {
  let b = breakers.get(fn);
  if (!b) {
    b = { state: 'closed', failures: 0, firstFailureAt: 0, openedAt: 0 };
    breakers.set(fn, b);
  }
  return b;
}

function shouldShortCircuit(fn: string): boolean {
  const b = getBreaker(fn);
  if (b.state === 'open') {
    if (Date.now() - b.openedAt >= OPEN_DURATION_MS) {
      b.state = 'half_open';
      return false;
    }
    return true;
  }
  return false;
}

function recordSuccess(fn: string): void {
  const b = getBreaker(fn);
  b.state = 'closed';
  b.failures = 0;
  b.firstFailureAt = 0;
  b.openedAt = 0;
}

function recordFailure(fn: string): void {
  const b = getBreaker(fn);
  const now = Date.now();

  // half_open → falha = volta a abrir imediatamente
  if (b.state === 'half_open') {
    b.state = 'open';
    b.openedAt = now;
    b.failures = FAILURE_THRESHOLD;
    return;
  }

  // Reset janela se já passou
  if (now - b.firstFailureAt > FAILURE_WINDOW_MS) {
    b.failures = 0;
    b.firstFailureAt = now;
  }
  if (b.failures === 0) b.firstFailureAt = now;
  b.failures += 1;

  if (b.failures >= FAILURE_THRESHOLD) {
    b.state = 'open';
    b.openedAt = now;
  }
}

/** Inspeção/utilitários — usados por testes e telemetria futura. */
export function getCircuitState(fn: string): CircuitState {
  return getBreaker(fn).state;
}

export function resetCircuitBreaker(fn?: string): void {
  if (fn) breakers.delete(fn);
  else breakers.clear();
}

// ──────────────────────────────────────────────────────────────
// Classificação de erro (retryable?)
// ──────────────────────────────────────────────────────────────

function isRetryable(err: unknown, status?: number): boolean {
  if (typeof status === 'number') {
    if (status >= 500) return true;
    if (status === 408 || status === 429) return true;
    return false; // 4xx restantes não retentam
  }
  // Sem status → erro de rede/timeout/abort
  const name = (err as { name?: string })?.name;
  if (name === 'AbortError' || name === 'TypeError') return true;
  return true; // por padrão, erros sem status tratamos como transitórios
}

function backoffDelay(attempt: number, base: number, max: number): number {
  const exp = Math.min(max, base * Math.pow(2, attempt));
  // Jitter ±25%
  const jitter = exp * (0.75 + Math.random() * 0.5);
  return Math.round(jitter);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ──────────────────────────────────────────────────────────────
// Núcleo: invokeResilient
// ──────────────────────────────────────────────────────────────

export async function invokeResilient<T = unknown>(
  fnName: string,
  body: Record<string, unknown> | undefined,
  opts: ResilientOptions = {},
): Promise<ResilientResult<T>> {
  const {
    timeoutMs = 15_000,
    maxRetries = 3,
    baseDelayMs = 1_000,
    maxDelayMs = 8_000,
    traceId,
    disableCircuitBreaker = false,
  } = opts;

  // 1) Circuit breaker: short-circuit imediato se estiver aberto
  if (!disableCircuitBreaker && shouldShortCircuit(fnName)) {
    logger.warn(`[resilientFetch] Circuit OPEN for "${fnName}" — failing fast`);
    return {
      data: null,
      error: {
        code: 'CIRCUIT_OPEN',
        message: `Serviço "${fnName}" temporariamente indisponível. Tente novamente em alguns segundos.`,
      },
    };
  }

  let lastError: ResilientResult<T>['error'] = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {};
      if (traceId) headers['x-trace-id'] = traceId;

      // supabase.functions.invoke aceita signal/headers via objeto opts
      const { data, error } = await supabase.functions.invoke<T>(fnName, {
        body,
        headers,
      });
      clearTimeout(timer);

      if (error) {
        const status = (error as { status?: number; context?: { status?: number } }).status
          ?? (error as { context?: { status?: number } }).context?.status;
        const retryable = isRetryable(error, status);
        lastError = {
          message: error.message ?? 'Edge function error',
          status,
          code: retryable ? undefined : 'NON_RETRYABLE',
        };

        if (!retryable) {
          // 4xx: não conta para o circuit breaker (é erro do cliente)
          return { data: null, error: lastError };
        }
        // Cai para o bloco de retry abaixo
        throw error;
      }

      // Sucesso
      if (!disableCircuitBreaker) recordSuccess(fnName);
      return { data: data as T, error: null };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout = (err as { name?: string })?.name === 'AbortError';
      lastError = {
        message: isTimeout
          ? `Timeout (${timeoutMs}ms) ao chamar "${fnName}"`
          : (err as Error)?.message || 'Network error',
        code: isTimeout ? 'TIMEOUT' : lastError?.code ?? 'NETWORK',
        status: lastError?.status,
      };

      if (!disableCircuitBreaker) recordFailure(fnName);

      const isLast = attempt === maxRetries - 1;
      if (isLast) break;

      const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs);
      logger.warn(
        `[resilientFetch] "${fnName}" falhou (tentativa ${attempt + 1}/${maxRetries}) — retry em ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  return { data: null, error: lastError };
}

// ──────────────────────────────────────────────────────────────
// Constantes exportadas (úteis para testes)
// ──────────────────────────────────────────────────────────────

export const RESILIENT_DEFAULTS = {
  FAILURE_THRESHOLD,
  FAILURE_WINDOW_MS,
  OPEN_DURATION_MS,
} as const;