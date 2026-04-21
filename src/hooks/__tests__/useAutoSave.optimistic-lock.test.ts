/**
 * 🔒 PROTEÇÃO P16 — Optimistic Locking (Onda 6, Etapa 3)
 *
 * Testes de regressão garantindo que:
 * 1. UPDATE em quizzes sempre filtra por .eq('version', ...)
 * 2. Conflito de versão dispara onConflict e marca status='conflict'
 * 3. setKnownVersion inicializa a versão local corretamente
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

describe('useAutoSave — Optimistic Locking (P16)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Helper: monta o builder encadeado do supabase mockado */
  function buildQuizMock(opts: {
    selectVersion: number | null;
    updateCount: number;
  }) {
    const updateEqVersion = vi.fn().mockResolvedValue({ error: null, count: opts.updateCount });
    const updateEqUser = vi.fn().mockReturnValue({ eq: updateEqVersion });
    const updateEqId = vi.fn().mockReturnValue({ eq: updateEqUser });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEqId });

    const selectMaybeSingle = vi.fn().mockResolvedValue({
      data: opts.selectVersion === null ? null : { version: opts.selectVersion },
      error: null,
    });
    const selectEqUser = vi.fn().mockReturnValue({ maybeSingle: selectMaybeSingle });
    const selectEqId = vi.fn().mockReturnValue({ eq: selectEqUser });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEqId });

    return {
      from: { select: selectFn, update: updateFn },
      // Refs para asserts
      updateFn,
      updateEqVersion,
    };
  }

  it('deve filtrar UPDATE por .eq("version", ...) — protege P16', async () => {
    const mocks = buildQuizMock({ selectVersion: 3, updateCount: 1 });
    vi.mocked(supabase.from).mockReturnValue(mocks.from as any);

    const { result } = renderHook(() => useAutoSave({ debounceMs: 100 }));

    act(() => {
      result.current.scheduleAutoSave({ quizId: 'q-1', title: 'Hello' });
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mocks.updateEqVersion).toHaveBeenCalledWith('version', 3);
    });
  });

  it('deve disparar onConflict quando versão local não bate com a remota', async () => {
    const onConflict = vi.fn();
    const mocks = buildQuizMock({ selectVersion: 5, updateCount: 1 });
    vi.mocked(supabase.from).mockReturnValue(mocks.from as any);

    const { result } = renderHook(() =>
      useAutoSave({ debounceMs: 100, onConflict })
    );

    // Simula carga inicial: versão local = 3
    act(() => {
      result.current.setKnownVersion(3);
    });

    act(() => {
      result.current.scheduleAutoSave({ quizId: 'q-1', title: 'Edit' });
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onConflict).toHaveBeenCalledWith({
        quizId: 'q-1',
        localVersion: 3,
        remoteVersion: 5,
      });
      expect(result.current.status).toBe('conflict');
    });

    // UPDATE NÃO deve ter sido chamado — circuit interno bloqueou
    expect(mocks.updateFn).not.toHaveBeenCalled();
  });

  it('deve marcar status="conflict" se UPDATE retornar 0 linhas afetadas', async () => {
    const onConflict = vi.fn();
    const mocks = buildQuizMock({ selectVersion: 2, updateCount: 0 });
    vi.mocked(supabase.from).mockReturnValue(mocks.from as any);

    const { result } = renderHook(() =>
      useAutoSave({ debounceMs: 100, onConflict })
    );

    act(() => {
      result.current.scheduleAutoSave({ quizId: 'q-1', title: 'Hello' });
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(onConflict).toHaveBeenCalled();
      expect(result.current.status).toBe('conflict');
    });
  });

  it('setKnownVersion deve estar exposto na API pública', () => {
    const { result } = renderHook(() => useAutoSave());
    expect(typeof result.current.setKnownVersion).toBe('function');
  });
});