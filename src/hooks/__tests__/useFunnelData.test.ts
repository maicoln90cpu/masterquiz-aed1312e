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

describe('useFunnelData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful auth
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    } as any);
  });

  describe('Fetching de dados do funil', () => {
    it('deve retornar dados do funil quando disponíveis', async () => {
      const mockFunnelData = [
        { step_number: 1, session_count: 100, question_id: 'q1' },
        { step_number: 2, session_count: 80, question_id: 'q2' },
        { step_number: 3, session_count: 60, question_id: 'q3' },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: mockFunnelData,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        lte: mockLte,
        order: mockOrder,
      } as any);

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });

    it('deve retornar array vazio quando não há dados', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

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
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Filtros por período', () => {
    it('deve aplicar filtro de startDate', async () => {
      const mockGte = vi.fn().mockReturnThis();
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: mockGte,
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

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
      const mockLte = vi.fn().mockReturnThis();
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: mockLte,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

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
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
      } as any);

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Ordenação dos dados', () => {
    it('deve ordenar steps por step_number', async () => {
      const unorderedData = [
        { step_number: 3, session_count: 60 },
        { step_number: 1, session_count: 100 },
        { step_number: 2, session_count: 80 },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: unorderedData,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: mockOrder,
      } as any);

      const { result } = renderHook(
        () => useFunnelData({ quizId: 'test-quiz-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(mockOrder).toHaveBeenCalledWith('step_number', expect.any(Object));
      });
    });
  });

  describe('Caching', () => {
    it('deve usar staleTime para caching', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

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
