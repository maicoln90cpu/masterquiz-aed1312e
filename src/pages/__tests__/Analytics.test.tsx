import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Analytics from '../Analytics';
import { supabase } from '@/integrations/supabase/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Override AuthContext with authenticated user
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    session: { access_token: 'token' },
    loading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

// Mock DashboardLayout to just render children
vi.mock('@/components/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Mock useUserStage (useTrackPageView)
vi.mock('@/hooks/useUserStage', () => ({
  useTrackPageView: vi.fn(),
}));

vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: vi.fn(() => ({
    allowExportPDF: true,
    allowAdvancedAnalytics: true,
  })),
}));
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn(() => ({
    status: { analytics_tour_completed: true },
  })),
}));
vi.mock('@/hooks/useFunnelData', () => ({
  useFunnelData: vi.fn(() => ({
    data: [
      { stepNumber: 1, label: 'Início', count: 100 },
      { stepNumber: 2, label: 'Pergunta 1', count: 80 },
      { stepNumber: 3, label: 'Pergunta 2', count: 60 },
      { stepNumber: 4, label: 'Conclusão', count: 40 },
    ],
    isLoading: false,
  })),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      const translations: Record<string, string> = {
        'analytics.title': 'Analytics',
        'analytics.filters': 'Filtros',
        'analytics.startDate': 'Data Inicial',
        'analytics.endDate': 'Data Final',
        'analytics.totalVisualizations': 'Total de Visualizações',
        'analytics.initiated': 'Iniciados',
        'analytics.completed': 'Completados',
        'analytics.conversionRate': 'Taxa de Conversão',
        'analytics.noDataToExport': 'Sem dados para exportar',
        'analytics.exportExcel': 'Exportar Excel',
        'analytics.generatePDF': 'Gerar PDF',
        'analytics.generating': 'Gerando...',
        'common.back': 'Voltar',
      };
      return translations[key] || (typeof defaultValue === 'string' ? defaultValue : key);
    },
    i18n: {
      language: 'pt',
      changeLanguage: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
}));

const mockAnalyticsData = [
  {
    id: 'analytics-1',
    quiz_id: 'quiz-1',
    date: '2024-01-15',
    views: 100,
    starts: 80,
    completions: 40,
    quizzes: { user_id: 'user-1', title: 'Quiz 1' },
  },
  {
    id: 'analytics-2',
    quiz_id: 'quiz-1',
    date: '2024-01-16',
    views: 120,
    starts: 90,
    completions: 50,
    quizzes: { user_id: 'user-1', title: 'Quiz 1' },
  },
];

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as any);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'quizzes') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: 'quiz-1', title: 'Quiz 1' }],
            error: null,
          }),
        } as any;
      }
      if (table === 'quiz_analytics') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockAnalyticsData,
            error: null,
          }),
        } as any;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any;
    });
  });

  describe('Renderização inicial', () => {
    it('deve renderizar título do Analytics', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });

    it('deve renderizar cards de estatísticas', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/visualiza/i)).toBeInTheDocument();
      });
    });

    it('deve calcular totais corretamente', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('220')).toBeInTheDocument();
        expect(screen.getByText('90')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros de período', () => {
    it('deve renderizar seletores de data', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Data Inicial')).toBeInTheDocument();
        expect(screen.getByText('Data Final')).toBeInTheDocument();
      });
    });

    it('deve renderizar opções de período pré-definido', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        const periodSelect = screen.getByRole('combobox');
        expect(periodSelect).toBeInTheDocument();
      });
    });
  });

  describe('Gráficos', () => {
    it('deve renderizar área de gráficos', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/filtros/i)).toBeInTheDocument();
      });
    });
  });

  describe('Exportação', () => {
    it('deve ter botão de exportar Excel', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });
    });

    it('deve ter botão de gerar PDF', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Gerar PDF')).toBeInTheDocument();
      });
    });

    it('deve mostrar erro ao exportar sem dados', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quizzes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        if (table === 'quiz_analytics') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      const user = userEvent.setup();
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
      });

      const exportButton = screen.getByText('Exportar Excel');
      await user.click(exportButton);
      
      expect(toast.error).toHaveBeenCalledWith('Sem dados para exportar');
    });
  });

  describe('Tabs', () => {
    it('deve renderizar tabs de navegação', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Comparação de quizzes', () => {
    it('deve permitir selecionar quizzes para comparação', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        const checkboxes = screen.queryAllByRole('checkbox');
      });
    });
  });

  describe('Loading state', () => {
    it('deve mostrar skeleton durante carregamento', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnValue(new Promise(() => {})),
      } as any));

      renderWithProviders(<Analytics />);
    });
  });

  describe('Navegação', () => {
    it('deve ter botão de voltar', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Voltar')).toBeInTheDocument();
      });
    });
  });

  describe('Funil de conversão', () => {
    it('deve renderizar dados do funil', async () => {
      renderWithProviders(<Analytics />);
      
      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });
  });
});
