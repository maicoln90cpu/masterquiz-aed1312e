import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave, AutoSaveStatus } from '../useAutoSave';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    
    // Mock successful auth by default
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Estado inicial', () => {
    it('deve retornar status idle inicialmente', () => {
      const { result } = renderHook(() => useAutoSave());
      
      expect(result.current.status).toBe('idle');
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.isOnline).toBe(true);
    });

    it('deve ter funções disponíveis', () => {
      const { result } = renderHook(() => useAutoSave());
      
      expect(typeof result.current.scheduleAutoSave).toBe('function');
      expect(typeof result.current.saveNow).toBe('function');
      expect(typeof result.current.cancelPendingSave).toBe('function');
      expect(typeof result.current.markAsSaved).toBe('function');
    });
  });

  describe('Debounce de 30 segundos', () => {
    it('deve usar debounce padrão de 30 segundos', () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        upsert: vi.fn(),
      } as any);

      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test Quiz',
        });
      });

      expect(result.current.status).toBe('unsaved');
      expect(result.current.hasUnsavedChanges).toBe(true);
      
      // Antes de 30s, não deve salvar
      act(() => {
        vi.advanceTimersByTime(29000);
      });
      
      // Ainda não executou
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('deve executar save após 30 segundos', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test Quiz',
        });
      });

      // Avançar 30 segundos
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      
      // Deve ter chamado supabase
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('quizzes');
      });
    });

    it('deve resetar timer em mudanças consecutivas', () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'First',
        });
      });

      // Avançar 20 segundos
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      // Nova mudança - deve resetar timer
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Second',
        });
      });

      // Avançar mais 20 segundos (total 40s desde início, mas 20s desde última mudança)
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      // Ainda não deve ter executado (precisa mais 10s)
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Transição de estados', () => {
    it('deve transicionar de idle → unsaved ao agendar', () => {
      const { result } = renderHook(() => useAutoSave());
      
      expect(result.current.status).toBe('idle');
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });
      
      expect(result.current.status).toBe('unsaved');
    });

    it('deve transicionar para saved após salvar com sucesso', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('saved');
      });
    });

    it('deve transicionar para error em falha', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ 
              error: { message: 'Database error' } 
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('Detecção de online/offline', () => {
    it('deve detectar estado online inicial', () => {
      const { result } = renderHook(() => useAutoSave());
      expect(result.current.isOnline).toBe(true);
    });

    it('deve atualizar status para offline quando desconectado', () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      
      expect(result.current.isOnline).toBe(false);
      expect(result.current.status).toBe('offline');
    });

    it('deve retornar isOnline true quando reconectar', () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      
      expect(result.current.isOnline).toBe(false);
      
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      
      expect(result.current.isOnline).toBe(true);
    });

    it('não deve executar save quando offline', async () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      // Não deve chamar supabase quando offline
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Cancelamento de save pendente', () => {
    it('deve cancelar save pendente', () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(result.current.status).toBe('unsaved');
      
      act(() => {
        result.current.cancelPendingSave();
      });
      
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.status).toBe('idle');
    });

    it('não deve executar save após cancelamento', async () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });
      
      act(() => {
        result.current.cancelPendingSave();
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('deve chamar onSaveStart quando iniciar salvamento', async () => {
      const onSaveStart = vi.fn();
      
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAutoSave({ onSaveStart }));
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(onSaveStart).toHaveBeenCalled();
      });
    });

    it('deve chamar onSaveComplete após sucesso', async () => {
      const onSaveComplete = vi.fn();
      
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAutoSave({ onSaveComplete }));
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(onSaveComplete).toHaveBeenCalled();
      });
    });

    it('deve chamar onSaveError em caso de falha', async () => {
      const onSaveError = vi.fn();
      
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ 
              error: { message: 'Database error' } 
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useAutoSave({ onSaveError }));
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(onSaveError).toHaveBeenCalled();
      });
    });
  });

  describe('saveNow() - salvamento imediato', () => {
    it('deve executar salvamento imediatamente', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      // Sem esperar os 30 segundos
      await act(async () => {
        await result.current.saveNow();
      });

      expect(supabase.from).toHaveBeenCalledWith('quizzes');
    });

    it('deve retornar false se não houver dados pendentes', async () => {
      const { result } = renderHook(() => useAutoSave());
      
      let saveResult;
      await act(async () => {
        saveResult = await result.current.saveNow();
      });

      expect(saveResult).toBe(false);
    });

    it('deve cancelar timer pendente ao chamar saveNow', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      await act(async () => {
        await result.current.saveNow();
      });

      // Avançar mais tempo - não deve chamar novamente
      vi.mocked(supabase.from).mockClear();
      
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      // Não deve chamar novamente pois já salvou
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('markAsSaved() - marcar como salvo', () => {
    it('deve atualizar estado para saved', () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
      
      act(() => {
        result.current.markAsSaved();
      });
      
      expect(result.current.status).toBe('saved');
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    });

    it('deve cancelar timer pendente', async () => {
      const { result } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });
      
      act(() => {
        result.current.markAsSaved();
      });

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      // Não deve chamar supabase pois foi marcado como salvo
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Opções de configuração', () => {
    it('deve respeitar debounceMs customizado', () => {
      const { result } = renderHook(() => useAutoSave({ debounceMs: 5000 }));
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      // Após 4 segundos, não deve ter executado
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('não deve agendar quando enabled=false', () => {
      const { result } = renderHook(() => useAutoSave({ enabled: false }));
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      // Status não deve mudar
      expect(result.current.status).toBe('idle');
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Cleanup ao desmontar', () => {
    it('deve limpar timeout ao desmontar componente', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { result, unmount } = renderHook(() => useAutoSave());
      
      act(() => {
        result.current.scheduleAutoSave({
          quizId: 'test-quiz-id',
          title: 'Test',
        });
      });

      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
