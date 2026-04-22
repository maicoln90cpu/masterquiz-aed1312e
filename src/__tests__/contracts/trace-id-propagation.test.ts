/**
 * 🔒 PROTEÇÃO P20 (Onda 7) — Propagação de `x-trace-id` ponta-a-ponta.
 *
 * 1. O facade `invokeEdgeFunction` SEMPRE deve gerar um traceId (se não
 *    fornecido) e propagá-lo via `invokeResilient` (que injeta em headers).
 * 2. O facade SEMPRE retorna `{ data, traceId }` — nunca apenas `data`.
 * 3. `EdgeCallError` SEMPRE carrega o traceId da chamada que falhou para
 *    permitir debugging cross-stack (frontend ↔ logs Supabase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeEdgeFunction, EdgeCallError } from '@/lib/invokeEdgeFunction';

vi.mock('@/lib/resilientFetch', () => ({
  invokeResilient: vi.fn(),
}));

import { invokeResilient } from '@/lib/resilientFetch';
const mockInvoke = invokeResilient as unknown as ReturnType<typeof vi.fn>;

describe('P20 — Propagação de x-trace-id', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it('gera traceId automaticamente quando não fornecido e propaga para invokeResilient', async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true, data: { foo: 1 }, traceId: 'srv' }, error: null });
    const result = await invokeEdgeFunction('any-fn', { x: 1 });
    expect(result.traceId).toBeTruthy();
    expect(result.traceId.length).toBeGreaterThan(4);
    const passedOpts = mockInvoke.mock.calls[0][2];
    expect(passedOpts.traceId).toBe(result.traceId);
  });

  it('respeita traceId fornecido pelo caller', async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true, data: {}, traceId: 'x' }, error: null });
    const result = await invokeEdgeFunction('any-fn', undefined, { traceId: 'custom-trace-123' });
    expect(result.traceId).toBe('custom-trace-123');
    const passedOpts = mockInvoke.mock.calls[0][2];
    expect(passedOpts.traceId).toBe('custom-trace-123');
  });

  it('EdgeCallError carrega traceId mesmo quando a edge falha', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { code: 'TIMEOUT', message: 'demorou', status: 504 },
    });
    try {
      await invokeEdgeFunction('flaky-fn', undefined, { traceId: 'trace-err-1' });
      throw new Error('deveria ter lançado');
    } catch (e) {
      expect(e).toBeInstanceOf(EdgeCallError);
      expect((e as EdgeCallError).traceId).toBe('trace-err-1');
      expect((e as EdgeCallError).code).toBe('TIMEOUT');
    }
  });

  it('devolve sempre objeto { data, traceId } e nunca apenas data', async () => {
    mockInvoke.mockResolvedValue({ data: { ok: true, data: { v: 9 }, traceId: 'srv' }, error: null });
    const result = await invokeEdgeFunction('fn');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('traceId');
    expect(typeof result.traceId).toBe('string');
  });
});