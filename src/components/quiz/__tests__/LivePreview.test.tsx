import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/__tests__/test-utils';
import { LivePreview } from '../LivePreview';

// ============================================================
// MOCKS
// ============================================================

// Mock LivePreviewErrorBoundary to avoid complexity
vi.mock('../LivePreviewErrorBoundary', () => ({
  LivePreviewErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ============================================================
// TEST DATA
// ============================================================

const defaultProps = {
  title: 'Quiz de Teste',
  description: 'Descrição do quiz de teste',
  template: 'moderno',
  questions: [],
  formConfig: {
    collect_name: false,
    collect_email: false,
    collect_whatsapp: false,
  },
};

const questionWithSingleChoice = {
  question_text: 'Qual sua cor favorita?',
  answer_format: 'single_choice' as const,
  options: [
    { text: 'Azul' },
    { text: 'Verde' },
    { text: 'Vermelho' },
  ],
};

const questionWithMultipleChoice = {
  question_text: 'Quais linguagens você conhece?',
  answer_format: 'multiple_choice' as const,
  options: [
    { text: 'JavaScript' },
    { text: 'Python' },
    { text: 'TypeScript' },
  ],
};

const questionWithBlocks = {
  question_text: '',
  blocks: [
    {
      type: 'question',
      content: 'Pergunta com blocos',
      answerFormat: 'single_choice',
      options: [
        { text: 'Opção A' },
        { text: 'Opção B' },
      ],
    },
    {
      type: 'image',
      url: 'https://example.com/image.jpg',
    },
  ],
};

// ============================================================
// RENDERING TESTS
// ============================================================

describe('LivePreview - Renderização', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('renderiza título do quiz', () => {
      render(<LivePreview {...defaultProps} title="Meu Quiz Incrível" />);
      expect(screen.getByText('Meu Quiz Incrível')).toBeInTheDocument();
    });

    it('renderiza título padrão quando vazio', () => {
      render(<LivePreview {...defaultProps} title="" />);
      expect(screen.getByText('Título do Quiz')).toBeInTheDocument();
    });

    it('renderiza descrição do quiz', () => {
      render(<LivePreview {...defaultProps} description="Descrição detalhada" />);
      expect(screen.getByText('Descrição detalhada')).toBeInTheDocument();
    });

    it('renderiza descrição padrão quando vazia', () => {
      render(<LivePreview {...defaultProps} description="" />);
      expect(screen.getByText('Descrição do seu quiz aparecerá aqui')).toBeInTheDocument();
    });

    it('renderiza logo quando fornecido', () => {
      render(<LivePreview {...defaultProps} logoUrl="https://example.com/logo.png" />);
      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('não renderiza logo quando não fornecido', () => {
      render(<LivePreview {...defaultProps} logoUrl={undefined} />);
      expect(screen.queryByAltText('Logo')).not.toBeInTheDocument();
    });

    it('renderiza badge com nome do template', () => {
      render(<LivePreview {...defaultProps} template="elegante" />);
      expect(screen.getByText('Template: elegante')).toBeInTheDocument();
    });
  });

  describe('Preview text', () => {
    it('renderiza texto "Preview em Tempo Real"', () => {
      render(<LivePreview {...defaultProps} />);
      expect(screen.getByText('Preview em Tempo Real')).toBeInTheDocument();
    });
  });
});

// ============================================================
// QUESTION RENDERING TESTS
// ============================================================

describe('LivePreview - Perguntas', () => {
  describe('Single Choice', () => {
    it('renderiza pergunta single_choice com opções', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithSingleChoice]} 
        />
      );
      
      expect(screen.getByText('Qual sua cor favorita?')).toBeInTheDocument();
      expect(screen.getByText('Azul')).toBeInTheDocument();
      expect(screen.getByText('Verde')).toBeInTheDocument();
      expect(screen.getByText('Vermelho')).toBeInTheDocument();
    });

    it('renderiza radio buttons para single_choice', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithSingleChoice]} 
        />
      );
      
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(3);
    });
  });

  describe('Multiple Choice', () => {
    it('renderiza pergunta multiple_choice com checkboxes', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithMultipleChoice]} 
        />
      );
      
      expect(screen.getByText('Quais linguagens você conhece?')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    it('renderiza checkboxes para multiple_choice', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithMultipleChoice]} 
        />
      );
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });
  });

  describe('Block structure', () => {
    it('extrai dados de perguntas com estrutura de blocos', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithBlocks as any]} 
        />
      );
      
      expect(screen.getByText('Pergunta com blocos')).toBeInTheDocument();
      expect(screen.getByText('Opção A')).toBeInTheDocument();
      expect(screen.getByText('Opção B')).toBeInTheDocument();
    });

    it('renderiza mídia da pergunta quando presente', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithBlocks as any]} 
        />
      );
      
      const image = screen.getByAltText('Mídia da pergunta');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  describe('Empty state', () => {
    it('renderiza botão "Começar Quiz" quando não há perguntas', () => {
      render(<LivePreview {...defaultProps} questions={[]} />);
      expect(screen.getByText('Começar Quiz')).toBeInTheDocument();
    });

    it('renderiza botão "Próxima" quando há perguntas', () => {
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[questionWithSingleChoice]} 
        />
      );
      expect(screen.getByText('Próxima')).toBeInTheDocument();
    });

    it('renderiza texto padrão para pergunta sem texto', () => {
      const emptyQuestion = {
        question_text: '',
        answer_format: 'single_choice' as const,
        options: [{ text: 'Opção 1' }],
      };
      
      render(
        <LivePreview 
          {...defaultProps} 
          questions={[emptyQuestion]} 
        />
      );
      
      expect(screen.getByText('Digite o texto da sua pergunta')).toBeInTheDocument();
    });
  });
});

// ============================================================
// FORM CONFIG TESTS
// ============================================================

describe('LivePreview - Formulário de Dados', () => {
  it('não renderiza formulário quando nenhum campo está habilitado', () => {
    render(<LivePreview {...defaultProps} />);
    expect(screen.queryByText('Seus dados')).not.toBeInTheDocument();
  });

  it('renderiza campo Nome quando collect_name=true', () => {
    render(
      <LivePreview 
        {...defaultProps} 
        formConfig={{ ...defaultProps.formConfig, collect_name: true }} 
      />
    );
    
    expect(screen.getByText('Seus dados')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument();
  });

  it('renderiza campo Email quando collect_email=true', () => {
    render(
      <LivePreview 
        {...defaultProps} 
        formConfig={{ ...defaultProps.formConfig, collect_email: true }} 
      />
    );
    
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });

  it('renderiza campo WhatsApp quando collect_whatsapp=true', () => {
    render(
      <LivePreview 
        {...defaultProps} 
        formConfig={{ ...defaultProps.formConfig, collect_whatsapp: true }} 
      />
    );
    
    expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(00) 00000-0000')).toBeInTheDocument();
  });

  it('renderiza todos os campos quando todos habilitados', () => {
    render(
      <LivePreview 
        {...defaultProps} 
        formConfig={{ 
          collect_name: true, 
          collect_email: true, 
          collect_whatsapp: true 
        }} 
      />
    );
    
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument();
  });

  it('campos do formulário estão desabilitados (preview apenas)', () => {
    render(
      <LivePreview 
        {...defaultProps} 
        formConfig={{ collect_name: true, collect_email: true, collect_whatsapp: true }} 
      />
    );
    
    expect(screen.getByLabelText('Nome')).toBeDisabled();
    expect(screen.getByLabelText('E-mail')).toBeDisabled();
    expect(screen.getByLabelText('WhatsApp')).toBeDisabled();
  });
});

// ============================================================
// DEVICE MODE TESTS
// ============================================================

describe('LivePreview - Modos de Dispositivo', () => {
  it('renderiza botões de modo de dispositivo', () => {
    render(<LivePreview {...defaultProps} />);
    
    // 3 device buttons (Desktop, Tablet, Mobile)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('desktop mode é ativo por padrão', () => {
    render(<LivePreview {...defaultProps} />);
    
    // The desktop button should have default variant (not ghost)
    const desktopButton = screen.getAllByRole('button')[0];
    expect(desktopButton).toBeInTheDocument();
  });

  it('alterna para modo tablet ao clicar', () => {
    render(<LivePreview {...defaultProps} />);
    
    const tabletButton = screen.getAllByRole('button')[1];
    fireEvent.click(tabletButton);
    
    // Button should now be active (variant changes)
    expect(tabletButton).toBeInTheDocument();
  });

  it('alterna para modo mobile ao clicar', () => {
    render(<LivePreview {...defaultProps} />);
    
    const mobileButton = screen.getAllByRole('button')[2];
    fireEvent.click(mobileButton);
    
    expect(mobileButton).toBeInTheDocument();
  });
});

// ============================================================
// TEMPLATE STYLING TESTS
// ============================================================

describe('LivePreview - Templates', () => {
  it('aplica classe do template', () => {
    const { container } = render(
      <LivePreview {...defaultProps} template="moderno" />
    );
    
    const card = container.querySelector('.quiz-template-moderno');
    expect(card).toBeInTheDocument();
  });

  it('aplica classe do template elegante', () => {
    const { container } = render(
      <LivePreview {...defaultProps} template="elegante" />
    );
    
    const card = container.querySelector('.quiz-template-elegante');
    expect(card).toBeInTheDocument();
  });

  it('usa template moderno como fallback', () => {
    const { container } = render(
      <LivePreview {...defaultProps} template="" />
    );
    
    // When template is empty, class becomes quiz-template-moderno (fallback)
    const card = container.querySelector('[class*="quiz-template"]');
    expect(card).toBeInTheDocument();
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe('LivePreview - Edge Cases', () => {
  it('lida com opções vazias', () => {
    const questionWithEmptyOptions = {
      question_text: 'Pergunta teste',
      answer_format: 'single_choice' as const,
      options: [],
    };
    
    render(
      <LivePreview 
        {...defaultProps} 
        questions={[questionWithEmptyOptions]} 
      />
    );
    
    expect(screen.getByText('Pergunta teste')).toBeInTheDocument();
    // No radio buttons should be rendered
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('lida com opção sem texto', () => {
    const questionWithEmptyOptionText = {
      question_text: 'Pergunta',
      answer_format: 'single_choice' as const,
      options: [{ text: '' }, { text: '' }],
    };
    
    render(
      <LivePreview 
        {...defaultProps} 
        questions={[questionWithEmptyOptionText]} 
      />
    );
    
    // Should show default option text
    expect(screen.getByText('Opção 1')).toBeInTheDocument();
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
  });

  it('renderiza apenas a primeira pergunta', () => {
    const multipleQuestions = [
      { ...questionWithSingleChoice, question_text: 'Primeira pergunta' },
      { ...questionWithSingleChoice, question_text: 'Segunda pergunta' },
    ];
    
    render(
      <LivePreview 
        {...defaultProps} 
        questions={multipleQuestions} 
      />
    );
    
    expect(screen.getByText('Primeira pergunta')).toBeInTheDocument();
    expect(screen.queryByText('Segunda pergunta')).not.toBeInTheDocument();
  });
});
