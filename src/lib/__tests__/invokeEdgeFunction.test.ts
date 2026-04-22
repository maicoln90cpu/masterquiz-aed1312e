import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/resilientFetch', () => ({
  invokeResilient: vi.fn(),
}));

import { invokeResilient } from '@/lib/resilientFetch';
import { invokeEdgeFunction, EdgeCallError, defaultErrorMessage } from '../invokeEdgeFunction';

const mockInvoke = invokeResilient as unknown as ReturnType<typeof vi.fn>;

describe('invokeEdgeFunction (P18)', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it('auto (padrão): resposta NÃO-envelope passa cru sem unwrap', async () => {
    mockInvoke.mockResolvedValue({ data: { foo: 'bar' }, error: null });
    const out = await invokeEdgeFunction<{ foo: string }>('test-fn', { x: 1 });
    expect(out.data).toEqual({ foo: 'bar' });
    expect(out.traceId).toBeTruthy();
    const calledWith = mockInvoke.mock.calls[0];
    expect(calledWith[0]).toBe('test-fn');
    expect(calledWith[1]).toEqual({ x: 1 });
    expect(calledWith[2]?.traceId).toBe(out.traceId);
  });

  it('auto: resposta envelope é detectada e unwrap automático', async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: true, data: { msg: 'oi' }, traceId: 'srv-1' },
      error: null,
    });
    const out = await invokeEdgeFunction<{ msg: string }>('x');
    expect(out.data).toEqual({ msg: 'oi' });
  });

  it('auto: envelope com ok=false vira EdgeCallError com code+traceId', async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: false, error: { code: 'NOT_FOUND', message: 'sumiu' }, traceId: 'srv-2' },
      error: null,
    });
    await expect(invokeEdgeFunction('x')).rejects.toMatchObject({
      name: 'EdgeCallError',
      code: 'NOT_FOUND',
      traceId: 'srv-2',
    });
  });

  it('legacyMode=true força bypass mesmo se parecer envelope', async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: true, data: { x: 1 }, traceId: 't' },
      error: null,
    });
    const out = await invokeEdgeFunction('x', undefined, { legacyMode: true });
    expect(out.data).toEqual({ ok: true, data: { x: 1 }, traceId: 't' });
  });

  it('legacyMode=false: faz unwrap do envelope', async () => {
    mockInvoke.mockResolvedValue({
      data: { ok: true, data: { msg: 'hi' }, traceId: 'abc' },
      error: null,
    });
    const out = await invokeEdgeFunction<{ msg: string }>('test-fn', undefined, {
      legacyMode: false,
    });
    expect(out.data).toEqual({ msg: 'hi' });
  });

  it('lança EdgeCallError com código mapeado quando invokeResilient falha', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { code: 'CIRCUIT_OPEN', message: 'down', status: undefined },
    });
    await expect(invokeEdgeFunction('x')).rejects.toMatchObject({
      name: 'EdgeCallError',
      code: 'CIRCUIT_OPEN',
    });
  });

  it('respeita traceId fornecido pelo chamador', async () => {
    mockInvoke.mockResolvedValue({ data: 'ok', error: null });
    const out = await invokeEdgeFunction('x', undefined, { traceId: 'fixed-trace' });
    expect(out.traceId).toBe('fixed-trace');
  });

  it('defaultErrorMessage retorna PT-BR por código', () => {
    const err = new EdgeCallError('TIMEOUT', 'x', 'abcdef1234567890');
    expect(defaultErrorMessage(err)).toMatch(/demorou demais/i);
    expect(defaultErrorMessage(err)).toContain('abcdef12');
  });

  it('VALIDATION_FAILED preserva mensagem do servidor', () => {
    const err = new EdgeCallError('VALIDATION_FAILED', 'campo email inválido', 't');
    expect(defaultErrorMessage(err)).toContain('campo email inválido');
  });
});