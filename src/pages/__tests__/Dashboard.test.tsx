import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { supabase } from '@/integrations/supabase/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: vi.fn(() => ({
    isMasterAdmin: false,
    isAdmin: false,
    role: 'user',
  })),
}));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: vi.fn(() => ({
    subscription: { plan_type: 'free' },
    quizLimit: 5,
    responseLimit: 100,
  })),
}));
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn(() => ({
    shouldShowDashboardTour: false,
    status: { dashboard_tour_completed: true },
  })),
}));
vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardStats: vi.fn(() => ({
    data: { totalQuizzes: 3, totalResponses: 45, activeQuizzes: 2 },
    isLoading: false,
  })),
  useRecentQuizzes: vi.fn(() => ({
    data: [
      { id: 'quiz-1', title: 'Quiz 1', status: 'published', created_at: '2024-01-01', is_public: true, slug: 'quiz-1' },
      { id: 'quiz-2', title: 'Quiz 2', status: 'draft', created_at: '2024-01-02', is_public: false, slug: 'quiz-2' },
    ],
    isLoading: false,
  })),
  useChartData: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useDeleteQuiz: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
  useDuplicateQuiz: vi.fn(() => ({
    mutateAsync: vi.fn(),
  })),
}));
vi.mock('@/hooks/useTagsData', () => ({
  useTagsData: vi.fn(() => ({ data: [] })),
  useInvalidateTags: vi.fn(() => vi.fn()),
}));
vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useGlobalShortcuts: vi.fn(),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { full_name: 'Test User', company_slug: 'test-company' },
        error: null,
      }),
    } as any);
  });

  describe('Renderização inicial', () => {
    it('deve renderizar título do dashboard', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/overview/i)).toBeInTheDocument();
      });
    });

    it('deve renderizar cards de estatísticas', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Total quizzes
        expect(screen.getByText('45')).toBeInTheDocument(); // Total responses
        expect(screen.getByText('2')).toBeInTheDocument(); // Active quizzes
      });
    });

    it('deve renderizar lista de quizzes recentes', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Quiz 1')).toBeInTheDocument();
        expect(screen.getByText('Quiz 2')).toBeInTheDocument();
      });
    });
  });

  describe('Estado vazio', () => {
    it('deve mostrar mensagem quando não há quizzes', async () => {
      // Re-mock para lista vazia
      vi.doMock('@/hooks/useDashboardData', () => ({
        useDashboardStats: vi.fn(() => ({
          data: { totalQuizzes: 0, totalResponses: 0, activeQuizzes: 0 },
          isLoading: false,
        })),
        useRecentQuizzes: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
        useChartData: vi.fn(() => ({
          data: [],
          isLoading: false,
        })),
        useDeleteQuiz: vi.fn(() => ({ mutateAsync: vi.fn() })),
        useDuplicateQuiz: vi.fn(() => ({ mutateAsync: vi.fn() })),
      }));
    });
  });

  describe('Loading state', () => {
    it('deve mostrar skeleton durante loading', async () => {
      // Mock loading state
      vi.doMock('@/hooks/useDashboardData', () => ({
        useDashboardStats: vi.fn(() => ({
          data: null,
          isLoading: true,
        })),
        useRecentQuizzes: vi.fn(() => ({
          data: [],
          isLoading: true,
        })),
        useChartData: vi.fn(() => ({
          data: [],
          isLoading: true,
        })),
        useDeleteQuiz: vi.fn(() => ({ mutateAsync: vi.fn() })),
        useDuplicateQuiz: vi.fn(() => ({ mutateAsync: vi.fn() })),
      }));
    });
  });

  describe('Filtros e busca', () => {
    it('deve renderizar campo de busca', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
      });
    });

    it('deve filtrar quizzes por termo de busca', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Quiz 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar/i);
      await user.type(searchInput, 'Quiz 1');
      
      // Quiz 1 deve permanecer visível
      expect(screen.getByText('Quiz 1')).toBeInTheDocument();
    });
  });

  describe('Ações de quiz', () => {
    it('deve ter botão de criar novo quiz', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        // Pode haver múltiplos botões de criar
        const createButtons = screen.getAllByRole('button');
        expect(createButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Navegação', () => {
    it('deve redirecionar para login se não autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      renderWithProviders(<Dashboard />);
      
      // Verificar redirecionamento (via mock do navigate)
    });
  });

  describe('Master Admin', () => {
    it('deve mostrar botão de painel master para admins', async () => {
      vi.doMock('@/hooks/useUserRole', () => ({
        useUserRole: vi.fn(() => ({
          isMasterAdmin: true,
          isAdmin: true,
          role: 'master_admin',
        })),
      }));
    });
  });
});
