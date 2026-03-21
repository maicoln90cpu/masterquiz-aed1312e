import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFunnelData } from '../useFunnelData';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Wrapper com QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

// Helper to create a full chain mock
const createChainMock = (resolvedData: any = [], error: any = null) => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  };
  // Make the chain thenable for await
  chain.then = vi.fn((resolve: any) => resolve({ data: resolvedData, error }));
  // Also make order resolve
  chain.order = vi.fn().mockReturnValue({ 
    data: resolvedData, 
    error,
    then: (resolve: any) => resolve ? resolve({ data: resolvedData, error }) : { data: resolvedData, error },
  });
  return chain;
};

describe('useFunnelData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetching de dados do funil', () => {
    it('deve retornar dados do funil quando disponíveis', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      // First call: quizzes table
      const quizzesChain = createChainMock([{ id: 'quiz-1' }]);
      // Second call: quiz_step_analytics table  
      const stepsChain = createChainMock([
        { step_number: 1, session_id: 'sess-1', question_id: 'q-1', quiz_id: 'quiz-1' },
        { step_number: 2, session_id: 'sess-1', question_id: 'q-2', quiz_id: 'quiz-1' },
      ]);

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return callCount === 1 ? quizzesChain : stepsChain;
      });

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'quiz-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });

    it('deve retornar array vazio quando não há dados', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue(createChainMock([]));

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('deve lidar com erro de autenticação', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null } as any,
        error: null,
      });

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('deve aplicar filtro de startDate', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      const chain = createChainMock([{ id: 'quiz-1' }]);
      vi.mocked(supabase.from).mockReturnValue(chain);

      renderHook(
        () => useFunnelData({ 
          quizId: 'test-quiz-id', 
          startDate: '2024-01-01' 
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('deve aplicar filtro de endDate', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      const chain = createChainMock([{ id: 'quiz-1' }]);
      vi.mocked(supabase.from).mockReturnValue(chain);

      renderHook(
        () => useFunnelData({ 
          quizId: 'test-quiz-id', 
          endDate: '2024-12-31' 
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Estados de loading', () => {
    it('deve iniciar com isLoading=true', () => {
      vi.mocked(supabase.auth.getUser).mockReturnValue(new Promise(() => {}) as any);
      vi.mocked(supabase.from).mockReturnValue(createChainMock([]));

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Ordenação dos dados', () => {
    it('deve chamar supabase.from para buscar dados', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      const chain = createChainMock([{ id: 'quiz-1' }]);
      vi.mocked(supabase.from).mockReturnValue(chain);

      renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('quizzes');
      });
    });
  });

  describe('Caching', () => {
    it('deve usar staleTime para caching', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } as any },
        error: null,
      });

      const chain = createChainMock([{ id: 'quiz-1' }]);
      vi.mocked(supabase.from).mockReturnValue(chain);

      const { result, rerender } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Re-render com mesmos params não deve fazer nova requisição
      const callCountBefore = vi.mocked(supabase.from).mock.calls.length;
      rerender();
      
      // Não deve ter mais chamadas
      expect(vi.mocked(supabase.from).mock.calls.length).toBe(callCountBefore);
    });
  });
});
