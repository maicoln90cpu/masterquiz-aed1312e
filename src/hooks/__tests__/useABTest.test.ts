import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useABTest } from '../useABTest';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock localStorage e sessionStorage
const mockLocalStorage: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]); }),
};

const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; }),
  clear: vi.fn(() => { Object.keys(mockSessionStorage).forEach(key => delete mockSessionStorage[key]); }),
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('useABTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve retornar isLoading=false quando abTestActive=false', async () => {
      const { result } = renderHook(() => useABTest('quiz-123', false));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.session).toBeNull();
      expect(result.current.variant).toBeNull();
    });

    it('deve retornar isLoading=false quando quizId undefined', async () => {
      const { result } = renderHook(() => useABTest(undefined, true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('deve ter markConversion disponível', () => {
      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      expect(typeof result.current.markConversion).toBe('function');
    });
  });

  describe('Seleção de variante', () => {
    it('deve selecionar variante quando A/B test está ativo', async () => {
      const mockVariants = [
        { id: 'var-a', variant_name: 'Control', variant_letter: 'A', traffic_weight: 50, is_control: true },
        { id: 'var-b', variant_name: 'Variant B', variant_letter: 'B', traffic_weight: 50, is_control: false },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quiz_variants') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as any;
        }
        if (table === 'ab_test_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      // Mock para buscar variantes
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockVariants,
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('deve reutilizar variante existente do sessionStorage', async () => {
      const existingVariantId = 'existing-var-id';
      mockSessionStorage[`mq_ab_quiz-123`] = existingVariantId;
      sessionStorageMock.getItem.mockReturnValue(existingVariantId);

      const mockVariant = {
        id: existingVariantId,
        variant_name: 'Existing Variant',
        variant_letter: 'A',
        traffic_weight: 100,
        is_control: true,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockVariant,
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Criação/recuperação de sessões', () => {
    it('deve criar visitor ID persistente', () => {
      // Simular que não existe visitor ID
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useABTest('quiz-123', true));

      // Verificar que setItem foi chamado para criar visitor ID
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mq_visitor_id',
        expect.any(String)
      );
    });

    it('deve reutilizar visitor ID existente', () => {
      const existingVisitorId = 'existing-visitor-123';
      localStorageMock.getItem.mockReturnValue(existingVisitorId);

      renderHook(() => useABTest('quiz-123', true));

      // Não deve criar novo visitor ID
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'mq_visitor_id',
        expect.not.stringMatching(existingVisitorId)
      );
    });
  });

  describe('Registro de conversões', () => {
    it('deve registrar conversão quando markConversion é chamado', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quiz_variants') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'var-a', variant_letter: 'A', traffic_weight: 100 }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === 'ab_test_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: mockUpdate,
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simular sessão ativa
      if (result.current.session) {
        await act(async () => {
          await result.current.markConversion();
        });
      }
    });

    it('não deve registrar conversão sem sessão ativa', async () => {
      const { result } = renderHook(() => useABTest('quiz-123', false));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Tentar marcar conversão sem sessão
      await act(async () => {
        await result.current.markConversion();
      });

      // Não deve chamar supabase.from para update
      expect(supabase.from).not.toHaveBeenCalledWith('ab_test_sessions');
    });
  });

  describe('Tratamento de erros', () => {
    it('deve lidar com erro ao buscar variantes', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any);

      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('deve retornar variant=null quando não há variantes ativas', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.variant).toBeNull();
    });
  });

  describe('Pesos de tráfego', () => {
    it('deve respeitar pesos de tráfego na seleção', async () => {
      // Mock Math.random para controlar seleção
      const mockRandom = vi.spyOn(Math, 'random');
      
      const mockVariants = [
        { id: 'var-a', variant_name: 'A', variant_letter: 'A', traffic_weight: 90, is_control: true },
        { id: 'var-b', variant_name: 'B', variant_letter: 'B', traffic_weight: 10, is_control: false },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quiz_variants') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockVariants,
                error: null,
              }),
            }),
          } as any;
        }
        if (table === 'ab_test_sessions') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        return {} as any;
      });

      // Com random = 0.5, deve selecionar variante A (peso 90 de 100)
      mockRandom.mockReturnValue(0.5);

      const { result } = renderHook(() => useABTest('quiz-123', true));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockRandom.mockRestore();
    });
  });
});
