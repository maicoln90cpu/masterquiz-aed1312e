import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import QuizView from '../QuizView';

// ============================================================
// MOCKS
// ============================================================

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ slug: 'test-quiz', company: 'test-company' }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'quizView.notFound': 'Quiz não encontrado',
        'quizView.loading': 'Carregando...',
        'quizView.previous': 'Anterior',
        'quizView.next': 'Próxima',
        'quizView.submit': 'Enviar',
        'quizView.yourData': 'Seus dados',
        'quizView.name': 'Nome',
        'quizView.email': 'Email',
        'quizView.whatsapp': 'WhatsApp',
        'quizView.submitSuccess': 'Resposta enviada com sucesso!',
        'quizView.submitError': 'Erro ao enviar resposta',
        'quizView.question': 'Pergunta',
        'quizView.of': 'de',
      };
      return translations[key] || fallback || key;
    },
    i18n: { language: 'pt' },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  }),
}));

vi.mock('@/hooks/useABTest', () => ({
  useABTest: () => ({
    variant: null,
    markConversion: vi.fn(),
  }),
}));

vi.mock('@/lib/ipCache', () => ({
  fetchIPWithCache: vi.fn().mockResolvedValue('127.0.0.1'),
}));

vi.mock('@/lib/conditionEvaluator', () => ({
  evaluateConditions: vi.fn().mockReturnValue(true),
}));

vi.mock('@/components/quiz/QuizBlockPreview', () => ({
  QuizBlockPreview: ({ block }: { block: any }) => (
    <div data-testid="quiz-block-preview">{block?.type || 'block'}</div>
  ),
}));

// ============================================================
// TEST DATA
// ============================================================

const mockQuiz = {
  id: 'quiz-123',
  title: 'Quiz de Teste',
  description: 'Descrição do quiz de teste',
  slug: 'test-quiz',
  template: 'moderno',
  is_public: true,
  status: 'active',
  user_id: 'user-123',
  show_title: true,
  show_description: true,
};

const mockQuestions = [
  {
    id: 'q1',
    quiz_id: 'quiz-123',
    order_number: 1,
    question_text: 'Qual sua cor favorita?',
    answer_format: 'single_choice',
    blocks: [
      {
        type: 'question',
        content: 'Qual sua cor favorita?',
        answerFormat: 'single_choice',
        options: ['Azul', 'Verde', 'Vermelho'],
        scores: [1, 2, 3],
      },
    ],
  },
  {
    id: 'q2',
    quiz_id: 'quiz-123',
    order_number: 2,
    question_text: 'Quantos anos você tem?',
    answer_format: 'single_choice',
    blocks: [
      {
        type: 'question',
        content: 'Quantos anos você tem?',
        answerFormat: 'single_choice',
        options: ['18-25', '26-35', '36+'],
        scores: [1, 2, 3],
      },
    ],
  },
  {
    id: 'q3',
    quiz_id: 'quiz-123',
    order_number: 3,
    question_text: 'Quais hobbies você tem?',
    answer_format: 'multiple_choice',
    blocks: [
      {
        type: 'question',
        content: 'Quais hobbies você tem?',
        answerFormat: 'multiple_choice',
        options: ['Leitura', 'Esportes', 'Música', 'Games'],
        scores: [1, 1, 1, 1],
      },
    ],
  },
];

const mockResults = [
  {
    id: 'r1',
    quiz_id: 'quiz-123',
    result_text: 'Você é incrível!',
    condition_type: 'always',
    order_number: 1,
  },
];

const mockFormConfig = {
  collect_name: true,
  collect_email: true,
  collect_whatsapp: false,
  collection_timing: 'after',
};

const mockOwnerProfile = {
  facebook_pixel_id: null,
  gtm_container_id: null,
};

// ============================================================
// TESTS
// ============================================================

describe('QuizView - Modo Preview', () => {
  const previewData = {
    quiz: mockQuiz as any,
    questions: mockQuestions as any,
    results: mockResults as any,
    formConfig: mockFormConfig as any,
    customFields: [],
    ownerProfile: mockOwnerProfile,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização inicial', () => {
    it('renderiza título do quiz', () => {
      render(<QuizView previewMode={true} previewData={previewData} />);
      expect(screen.getByText('Quiz de Teste')).toBeInTheDocument();
    });

    it('renderiza descrição do quiz', () => {
      render(<QuizView previewMode={true} previewData={previewData} />);
      expect(screen.getByText('Descrição do quiz de teste')).toBeInTheDocument();
    });

    it('renderiza primeira pergunta', () => {
      render(<QuizView previewMode={true} previewData={previewData} />);
      expect(screen.getByText('Qual sua cor favorita?')).toBeInTheDocument();
    });

    it('renderiza opções de resposta', () => {
      render(<QuizView previewMode={true} previewData={previewData} />);
      expect(screen.getByText('Azul')).toBeInTheDocument();
      expect(screen.getByText('Verde')).toBeInTheDocument();
      expect(screen.getByText('Vermelho')).toBeInTheDocument();
    });

    it('não mostra botão Anterior na primeira pergunta', () => {
      render(<QuizView previewMode={true} previewData={previewData} />);
      expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
    });
  });

  describe('Navegação entre perguntas', () => {
    it('avança para próxima pergunta ao clicar em Próxima', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      // Seleciona resposta
      await user.click(screen.getByText('Azul'));
      
      // Clica em próxima
      await user.click(screen.getByText('Próxima'));
      
      await waitFor(() => {
        expect(screen.getByText('Quantos anos você tem?')).toBeInTheDocument();
      });
    });

    it('mostra botão Anterior após avançar', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      await user.click(screen.getByText('Azul'));
      await user.click(screen.getByText('Próxima'));
      
      await waitFor(() => {
        expect(screen.getByText('Anterior')).toBeInTheDocument();
      });
    });

    it('volta para pergunta anterior ao clicar em Anterior', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      // Avança
      await user.click(screen.getByText('Azul'));
      await user.click(screen.getByText('Próxima'));
      
      await waitFor(() => {
        expect(screen.getByText('Quantos anos você tem?')).toBeInTheDocument();
      });
      
      // Volta
      await user.click(screen.getByText('Anterior'));
      
      await waitFor(() => {
        expect(screen.getByText('Qual sua cor favorita?')).toBeInTheDocument();
      });
    });

    it('mantém resposta selecionada ao voltar', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      // Seleciona Azul
      await user.click(screen.getByText('Azul'));
      await user.click(screen.getByText('Próxima'));
      
      // Volta
      await user.click(screen.getByText('Anterior'));
      
      await waitFor(() => {
        // O radio button de Azul deve estar selecionado
        const azulRadio = screen.getByLabelText('Azul');
        expect(azulRadio).toBeChecked();
      });
    });
  });

  describe('Seleção de respostas - Single Choice', () => {
    it('seleciona opção em single choice', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      const azulOption = screen.getByLabelText('Azul');
      await user.click(azulOption);
      
      expect(azulOption).toBeChecked();
    });

    it('muda seleção ao clicar em outra opção', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      await user.click(screen.getByLabelText('Azul'));
      await user.click(screen.getByLabelText('Verde'));
      
      expect(screen.getByLabelText('Azul')).not.toBeChecked();
      expect(screen.getByLabelText('Verde')).toBeChecked();
    });
  });

  describe('Seleção de respostas - Multiple Choice', () => {
    it('permite múltiplas seleções', async () => {
      const user = userEvent.setup();
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      // Navega até a pergunta de múltipla escolha (q3)
      await user.click(screen.getByText('Azul'));
      await user.click(screen.getByText('Próxima'));
      
      await waitFor(() => {
        expect(screen.getByText('Quantos anos você tem?')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('18-25'));
      await user.click(screen.getByText('Próxima'));
      
      await waitFor(() => {
        expect(screen.getByText('Quais hobbies você tem?')).toBeInTheDocument();
      });
      
      // Seleciona múltiplas opções
      await user.click(screen.getByLabelText('Leitura'));
      await user.click(screen.getByLabelText('Games'));
      
      expect(screen.getByLabelText('Leitura')).toBeChecked();
      expect(screen.getByLabelText('Games')).toBeChecked();
    });
  });

  describe('Indicador de progresso', () => {
    it('mostra número da pergunta atual', () => {
      render(<QuizView previewMode={true} previewData={previewData} />);
      
      // Deve mostrar "Pergunta 1 de 3" ou similar
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });
  });
});

describe('QuizView - Estado de Loading', () => {
  it('mostra loading quando não está em modo preview', () => {
    render(<QuizView previewMode={false} />);
    
    // O componente deve mostrar estado de loading
    expect(screen.getByRole('status') || screen.getByText(/carregando/i) || document.querySelector('.animate-spin')).toBeTruthy();
  });
});

describe('QuizView - Quiz vazio', () => {
  it('lida com quiz sem perguntas', () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: [],
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: mockOwnerProfile,
    };
    
    render(<QuizView previewMode={true} previewData={previewData} />);
    
    // Deve renderizar sem erros
    expect(screen.getByText('Quiz de Teste')).toBeInTheDocument();
  });
});

describe('QuizView - Formulário de dados', () => {
  const previewDataWithForm = {
    quiz: mockQuiz as any,
    questions: [mockQuestions[0]] as any, // Apenas 1 pergunta para simplificar
    results: mockResults as any,
    formConfig: {
      collect_name: true,
      collect_email: true,
      collect_whatsapp: true,
      collection_timing: 'after',
    } as any,
    customFields: [],
    ownerProfile: mockOwnerProfile,
  };

  it('mostra formulário após responder todas as perguntas', async () => {
    const user = userEvent.setup();
    render(<QuizView previewMode={true} previewData={previewDataWithForm} />);
    
    // Responde a única pergunta
    await user.click(screen.getByText('Azul'));
    await user.click(screen.getByText('Próxima'));
    
    await waitFor(() => {
      // Deve mostrar o formulário de dados
      expect(screen.getByText('Seus dados')).toBeInTheDocument();
    });
  });

  it('mostra campos configurados no formulário', async () => {
    const user = userEvent.setup();
    render(<QuizView previewMode={true} previewData={previewDataWithForm} />);
    
    await user.click(screen.getByText('Azul'));
    await user.click(screen.getByText('Próxima'));
    
    await waitFor(() => {
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/whatsapp/i)).toBeInTheDocument();
    });
  });
});

describe('QuizView - Resultado', () => {
  const previewDataWithResult = {
    quiz: mockQuiz as any,
    questions: [mockQuestions[0]] as any,
    results: [
      {
        id: 'r1',
        quiz_id: 'quiz-123',
        result_text: 'Parabéns! Você completou o quiz!',
        condition_type: 'always',
        order_number: 1,
      },
    ] as any,
    formConfig: null,
    customFields: [],
    ownerProfile: mockOwnerProfile,
  };

  it('mostra resultado após completar o quiz sem formulário', async () => {
    const user = userEvent.setup();
    render(<QuizView previewMode={true} previewData={previewDataWithResult} />);
    
    await user.click(screen.getByText('Azul'));
    await user.click(screen.getByText('Próxima'));
    
    await waitFor(() => {
      expect(screen.getByText(/Parabéns/i) || screen.getByText(/completou/i)).toBeTruthy();
    });
  });
});
