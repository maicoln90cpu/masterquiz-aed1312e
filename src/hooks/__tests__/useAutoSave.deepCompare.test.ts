import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// 🧠 Onda 6 — Testes do AutoSave inteligente (deep compare)
// ------------------------------------------------------------
// Garante que payloads logicamente iguais (mesmas chaves em ordens
// diferentes, opcionais undefined, etc.) NÃO disparem novos saves.
// ============================================================

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

/**
 * Mock completo da chain `from('quizzes').select().eq().eq().maybeSingle()`
 * + `.update().eq().eq().eq()` que o optimistic locking precisa.
 */
const buildMock = () => {
  const updateChain = {
    eq: vi.fn().mockReturnThis(),
    // último `.eq()` retorna o resultado
  };
  // último .eq → resolve com count = 1
  const lastEq = vi.fn().mockResolvedValue({ error: null, count: 1 });
  updateChain.eq = vi
    .fn()
    .mockReturnValueOnce({ eq: vi.fn().mockReturnValueOnce({ eq: lastEq }) });

  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
  };
  selectChain.eq = vi
    .fn()
    .mockReturnValueOnce({
      eq: vi.fn().mockReturnValueOnce({
        maybeSingle: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
      }),
    });

  return {
    select: vi.fn().mockReturnValue(selectChain),
    update: vi.fn().mockReturnValue(updateChain),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };
};

describe('🧠 Onda 6 — useAutoSave deep compare', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('NÃO marca como unsaved quando payload é logicamente igual (chaves trocadas de ordem)', () => {
    vi.mocked(supabase.from).mockReturnValue(buildMock() as any);
    const { result } = renderHook(() => useAutoSave());

    // Primeiro agendamento — deve marcar unsaved
    act(() => {
      result.current.scheduleAutoSave({
        quizId: 'q1',
        title: 'A',
        description: 'B',
      });
    });
    expect(result.current.status).toBe('unsaved');

    // markAsSaved fecha o ciclo (simula save bem-sucedido sem rede)
    act(() => {
      result.current.markAsSaved({
        quizId: 'q1',
        title: 'A',
        description: 'B',
      });
    });
    expect(result.current.status).toBe('saved');

    // Re-agendar com as MESMAS chaves em ordem diferente
    act(() => {
      result.current.scheduleAutoSave({
        description: 'B',
        title: 'A',
        quizId: 'q1',
      });
    });

    // Deep compare → deve permanecer 'saved' (não cair em 'unsaved')
    expect(result.current.status).toBe('saved');
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('NÃO marca como unsaved quando opcionais ausentes vs `undefined` explícito', () => {
    vi.mocked(supabase.from).mockReturnValue(buildMock() as any);
    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.markAsSaved({
        quizId: 'q1',
        title: 'A',
      });
    });
    expect(result.current.status).toBe('saved');

    // Mesmo conteúdo, mas com `description: undefined` explícito
    act(() => {
      result.current.scheduleAutoSave({
        quizId: 'q1',
        title: 'A',
        description: undefined,
      });
    });
    expect(result.current.status).toBe('saved');
  });

  it('SIM marca como unsaved quando há mudança real de valor', () => {
    vi.mocked(supabase.from).mockReturnValue(buildMock() as any);
    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.markAsSaved({
        quizId: 'q1',
        title: 'Antigo',
      });
    });
    expect(result.current.status).toBe('saved');

    act(() => {
      result.current.scheduleAutoSave({
        quizId: 'q1',
        title: 'Novo',
      });
    });
    expect(result.current.status).toBe('unsaved');
  });

  it('detecta diff em arrays aninhados (questions)', () => {
    vi.mocked(supabase.from).mockReturnValue(buildMock() as any);
    const { result } = renderHook(() => useAutoSave());

    act(() => {
      result.current.markAsSaved({
        quizId: 'q1',
        questions: [{ question_text: 'P1', order_number: 0 }],
      });
    });
    expect(result.current.status).toBe('saved');

    // Mudou texto → deve detectar
    act(() => {
      result.current.scheduleAutoSave({
        quizId: 'q1',
        questions: [{ question_text: 'P1 editada', order_number: 0 }],
      });
    });
    expect(result.current.status).toBe('unsaved');
  });
});