import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * P10 — Smoke test: pushGTMEvent sempre persiste em gtm_event_logs (Fase 3)
 *
 * Protege ADR-010 (centralização GTM). Se alguém alterar `gtmLogger.ts`
 * e quebrar a persistência, este teste falha imediatamente.
 *
 * Regras testadas:
 *  - pushGTMEvent('foo') → 1 push em window.dataLayer
 *  - pushGTMEvent('foo') → 1 insert em gtm_event_logs
 *  - pushGTMEvent('foo', {}, { persist: false }) → NÃO insere no banco
 */

const insertMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'user-test' } }, error: null })
      ),
    },
  },
}));

describe('P10 — pushGTMEvent persiste em gtm_event_logs', () => {
  beforeEach(() => {
    insertMock.mockClear();
    fromMock.mockClear();
    (window as any).dataLayer = [];
  });

  it('pushGTMEvent default → push em dataLayer + insert em gtm_event_logs', async () => {
    const { pushGTMEvent } = await import('@/lib/gtmLogger');

    pushGTMEvent('test_event', { foo: 'bar' });

    // dataLayer
    expect((window as any).dataLayer).toHaveLength(1);
    expect((window as any).dataLayer[0]).toMatchObject({
      event: 'test_event',
      foo: 'bar',
    });

    // Aguarda microtask de persistência
    await new Promise((r) => setTimeout(r, 10));

    expect(fromMock).toHaveBeenCalledWith('gtm_event_logs');
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: 'test_event',
        metadata: { foo: 'bar' },
      })
    );
  });

  it('pushGTMEvent com persist:false → push em dataLayer SEM insert', async () => {
    const { pushGTMEvent } = await import('@/lib/gtmLogger');

    pushGTMEvent('ephemeral_event', {}, { persist: false });

    expect((window as any).dataLayer).toHaveLength(1);

    await new Promise((r) => setTimeout(r, 10));

    expect(insertMock).not.toHaveBeenCalled();
  });

  it('múltiplas chamadas → múltiplos inserts (1:1)', async () => {
    const { pushGTMEvent } = await import('@/lib/gtmLogger');

    pushGTMEvent('event_1');
    pushGTMEvent('event_2');
    pushGTMEvent('event_3');

    await new Promise((r) => setTimeout(r, 10));

    expect(insertMock).toHaveBeenCalledTimes(3);
  });
});
