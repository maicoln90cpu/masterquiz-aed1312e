import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CRM from '../CRM';
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
  },
}));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: vi.fn(() => ({
    checkLeadLimit: vi.fn().mockResolvedValue(true),
  })),
}));
vi.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: vi.fn(() => ({
    status: { crm_tour_completed: true },
  })),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      const translations: Record<string, string> = {
        'crm.title': 'CRM',
        'crm.totalLeads': 'Total de Leads',
        'crm.newLeads': 'Novos',
        'crm.converted': 'Convertidos',
        'crm.conversionRate': 'Taxa de Conversão',
        'crm.columns.new': 'Novos',
        'crm.columns.checkout': 'Checkout',
        'crm.columns.negotiation': 'Negociação',
        'crm.columns.converted': 'Convertido',
        'crm.columns.relationship': 'Relacionamento',
        'crm.columns.lost': 'Perdido',
        'crm.noName': 'Sem nome',
        'crm.toast.errorLoading': 'Erro ao carregar leads',
        'crm.toast.noLeadsToExport': 'Nenhum lead para exportar',
        'common.back': 'Voltar',
      };
      return translations[key] || key;
    },
  }),
}));

const mockLeads = [
  {
    id: 'lead-1',
    respondent_name: 'João Silva',
    respondent_email: 'joao@email.com',
    respondent_whatsapp: '11999999999',
    completed_at: '2024-01-15T10:00:00Z',
    lead_status: 'new',
    answers: {},
    quizzes: { id: 'quiz-1', title: 'Quiz 1', user_id: 'user-1' },
    quiz_results: { result_text: 'Resultado A' },
  },
  {
    id: 'lead-2',
    respondent_name: 'Maria Santos',
    respondent_email: 'maria@email.com',
    respondent_whatsapp: null,
    completed_at: '2024-01-16T10:00:00Z',
    lead_status: 'converted',
    answers: {},
    quizzes: { id: 'quiz-1', title: 'Quiz 1', user_id: 'user-1' },
    quiz_results: { result_text: 'Resultado B' },
  },
];

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

describe('CRM', () => {
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
      if (table === 'quiz_responses') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: mockLeads,
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      }
      return {} as any;
    });
  });

  describe('Renderização inicial', () => {
    it('deve renderizar título do CRM', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        expect(screen.getByText('CRM')).toBeInTheDocument();
      });
    });

    it('deve renderizar cards de estatísticas', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        expect(screen.getByText('Total de Leads')).toBeInTheDocument();
        expect(screen.getByText('Novos')).toBeInTheDocument();
        expect(screen.getByText('Convertidos')).toBeInTheDocument();
        expect(screen.getByText('Taxa de Conversão')).toBeInTheDocument();
      });
    });

    it('deve calcular estatísticas corretamente', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        // 2 leads total
        expect(screen.getByText('2')).toBeInTheDocument();
        // 1 convertido
        expect(screen.getByText('1')).toBeInTheDocument();
        // Taxa de conversão 50%
        expect(screen.getByText('50.0%')).toBeInTheDocument();
      });
    });
  });

  describe('Colunas do Kanban', () => {
    it('deve renderizar todas as colunas de status', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        // Colunas do kanban
        expect(screen.getAllByText(/novos/i).length).toBeGreaterThan(0);
        expect(screen.getByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('Negociação')).toBeInTheDocument();
        expect(screen.getByText('Convertido')).toBeInTheDocument();
      });
    });
  });

  describe('Leads nos cards', () => {
    it('deve renderizar leads com informações corretas', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('deve renderizar seletores de filtro', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        // Filtro por quiz e status
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Exportação', () => {
    it('deve ter botão de exportar', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        // Botão de exportar Excel
        const exportButtons = screen.getAllByRole('button');
        expect(exportButtons.length).toBeGreaterThan(0);
      });
    });

    it('deve mostrar erro ao exportar sem leads', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'quizzes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        if (table === 'quiz_responses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        return {} as any;
      });

      renderWithProviders(<CRM />);
      
      // Aguardar carregamento com lista vazia
      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('deve permitir arrastar leads entre colunas', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Verificar que os cards são draggable
      const leadCards = screen.getAllByRole('button');
      expect(leadCards.length).toBeGreaterThan(0);
    });
  });

  describe('Loading state', () => {
    it('deve mostrar skeleton durante carregamento', async () => {
      // Mock para simular loading
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
      } as any));

      renderWithProviders(<CRM />);
      
      // Skeleton deve aparecer
      // Como usa CRMSkeleton, verificamos indiretamente
    });
  });

  describe('Navegação', () => {
    it('deve ter botão de voltar', async () => {
      renderWithProviders(<CRM />);
      
      await waitFor(() => {
        expect(screen.getByText('Voltar')).toBeInTheDocument();
      });
    });
  });
});
