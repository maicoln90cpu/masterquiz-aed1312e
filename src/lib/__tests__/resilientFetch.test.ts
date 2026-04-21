/**
 * 🛡️ Contract test P15 — resilientFetch.
 *
 * Garante que:
 *  - shape de retorno é { data, error } (compatível com supabase.functions.invoke)
 *  - 4xx NÃO causa retry
 *  - 5xx/network/timeout causam retry com backoff
 *  - circuit breaker abre após 5 falhas e responde imediato com CIRCUIT_OPEN
 *  - half_open libera 1 chamada e fecha em sucesso
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock do supabase client antes de importar o módulo sob teste
const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import {
  invokeResilient,
  resetCircuitBreaker,
  getCircuitState,
  RESILIENT_DEFAULTS,
} from '@/lib/resilientFetch';

describe('resilientFetch', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    resetCircuitBreaker();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna shape { data, error } compatível com invoke', async () => {
    invokeMock.mockResolvedValueOnce({ data: { ok: true }, error: null });
    const res = await invokeResilient('any-fn', { a: 1 });
    expect(res).toHaveProperty('data');
    expect(res).toHaveProperty('error');
    expect(res.data).toEqual({ ok: true });
    expect(res.error).toBeNull();
  });

  it('NÃO retenta em erro 4xx (não retryable)', async () => {
    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Bad request', status: 400 },
    });
    const res = await invokeResilient('fn-4xx', {}, { maxRetries: 3 });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(res.error?.code).toBe('NON_RETRYABLE');
  });

  it('retenta em 5xx até maxRetries e retorna o último erro', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'Server error', status: 503 },
    });
    const res = await invokeResilient('fn-5xx', {}, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 2,
    });
    expect(invokeMock).toHaveBeenCalledTimes(3);
    expect(res.data).toBeNull();
    expect(res.error?.status).toBe(503);
  });

  it('sucesso na 2ª tentativa após 1 falha', async () => {
    invokeMock
      .mockResolvedValueOnce({ data: null, error: { message: 'oops', status: 500 } })
      .mockResolvedValueOnce({ data: { ok: true }, error: null });
    const res = await invokeResilient('fn-recover', {}, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 2,
    });
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({ ok: true });
    expect(res.error).toBeNull();
  });

  it('abre o circuito após FAILURE_THRESHOLD falhas e responde CIRCUIT_OPEN', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'down', status: 502 },
    });
    // Cada chamada faz 3 tentativas; bastam 2 chamadas para acumular 6 falhas
    for (let i = 0; i < 2; i++) {
      await invokeResilient('fn-cb', {}, { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 2 });
    }
    expect(getCircuitState('fn-cb')).toBe('open');

    invokeMock.mockClear();
    const res = await invokeResilient('fn-cb', {});
    expect(invokeMock).not.toHaveBeenCalled();
    expect(res.error?.code).toBe('CIRCUIT_OPEN');
  });

  it('half_open: após OPEN_DURATION libera 1 chamada e fecha em sucesso', { timeout: 15_000 }, async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'down', status: 502 },
    });
    for (let i = 0; i < 2; i++) {
      await invokeResilient('fn-half', {}, { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 2 });
    }
    expect(getCircuitState('fn-half')).toBe('open');

    // Em vez de fake timers (que travam o sleep do retry), avançamos Date.now
    const realNow = Date.now;
    const advance = RESILIENT_DEFAULTS.OPEN_DURATION_MS + 100;
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + advance);

    try {
      invokeMock.mockReset();
      invokeMock.mockResolvedValueOnce({ data: { ok: true }, error: null });
      const res = await invokeResilient('fn-half', {}, { maxRetries: 1 });
      expect(invokeMock).toHaveBeenCalledTimes(1);
      expect(res.data).toEqual({ ok: true });
      expect(getCircuitState('fn-half')).toBe('closed');
    } finally {
      (Date.now as unknown as { mockRestore?: () => void }).mockRestore?.();
    }
  });

  it('disableCircuitBreaker permite testar sem efeito colateral global', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'down', status: 500 },
    });
    await invokeResilient('fn-iso', {}, {
      maxRetries: 3,
      baseDelayMs: 1,
      maxDelayMs: 2,
      disableCircuitBreaker: true,
    });
    expect(getCircuitState('fn-iso')).toBe('closed');
  });

  it('passa header x-trace-id quando informado', async () => {
    invokeMock.mockResolvedValueOnce({ data: { ok: true }, error: null });
    await invokeResilient('fn-trace', { a: 1 }, { traceId: 'trace-123' });
    expect(invokeMock).toHaveBeenCalledWith(
      'fn-trace',
      expect.objectContaining({
        body: { a: 1 },
        headers: expect.objectContaining({ 'x-trace-id': 'trace-123' }),
      }),
    );
  });
});