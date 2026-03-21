import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionBuilder, QuestionConditions, ConditionRule } from '../ConditionBuilder';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks
vi.mock('@/hooks/usePlanFeatures', () => ({
  usePlanFeatures: vi.fn(() => ({
    allowQuizBranching: true,
    isLoading: false,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ConditionBuilder', () => {
  const mockAvailableQuestions = [
    { id: 'q1', text: 'Qual seu nome?', options: ['João', 'Maria', 'Pedro'] },
    { id: 'q2', text: 'Qual sua idade?', options: ['18-25', '26-35', '36+'] },
    { id: 'q3', text: 'Qual seu interesse?', options: ['A', 'B', 'C'] },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização para primeira pergunta', () => {
    it('deve mostrar mensagem informativa para primeira pergunta', () => {
      renderWithRouter(
        <ConditionBuilder
          conditions={null}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={0}
        />
      );
      
      expect(screen.getByText(/primeira pergunta não pode ter condições/i)).toBeInTheDocument();
    });
  });

  describe('Renderização para perguntas subsequentes', () => {
    it('deve mostrar switch de habilitação', () => {
      renderWithRouter(
        <ConditionBuilder
          conditions={null}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      expect(screen.getByRole('switch')).toBeInTheDocument();
      expect(screen.getByText(/quiz branching/i)).toBeInTheDocument();
    });

    it('deve habilitar builder ao ativar switch', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ConditionBuilder
          conditions={null}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(screen.getByRole('button', { name: /adicionar condição/i })).toBeInTheDocument();
    });
  });

  describe('Adição de regras', () => {
    it('deve adicionar nova regra ao clicar em adicionar', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(
        <ConditionBuilder
          conditions={{ logic: 'AND', rules: [] }}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      const addButton = screen.getByRole('button', { name: /adicionar condição/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Remoção de regras', () => {
    it('deve remover regra ao clicar no botão de remover', async () => {
      const user = userEvent.setup();
      
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [
          { id: 'r1', questionId: 'q1', operator: 'equals', value: 'João' },
        ],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      // Find remove button by tooltip content
      const removeButtons = screen.getAllByRole('button');
      const trashButton = removeButtons.find(btn => btn.querySelector('svg.lucide-trash-2'));
      expect(trashButton).toBeTruthy();
      
      if (trashButton) await user.click(trashButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Seleção de operadores', () => {
    it('deve mostrar operadores no select', async () => {
      const user = userEvent.setup();
      
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [{ id: 'r1', questionId: 'q1', operator: 'equals', value: '' }],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      // Should have comboboxes for question, operator, value
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Seleção de valores', () => {
    it('deve mostrar input de texto quando pergunta não tem opções', async () => {
      const questionsWithoutOptions = [
        { id: 'q1', text: 'Qual seu nome?' },
      ];
      
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [{ id: 'r1', questionId: 'q1', operator: 'equals', value: '' }],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={questionsWithoutOptions}
          currentQuestionIndex={1}
        />
      );
      
      expect(screen.getByPlaceholderText(/valor/i)).toBeInTheDocument();
    });
  });

  describe('Lógica AND/OR', () => {
    it('deve mostrar botões de lógica quando há múltiplas regras', async () => {
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [
          { id: 'r1', questionId: 'q1', operator: 'equals', value: 'João' },
          { id: 'r2', questionId: 'q2', operator: 'equals', value: '18-25' },
        ],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      // Now uses toggle buttons instead of select
      expect(screen.getByRole('button', { name: /e \(todas\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ou \(qualquer\)/i })).toBeInTheDocument();
    });

    it('deve permitir alternar entre AND e OR', async () => {
      const user = userEvent.setup();
      
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [
          { id: 'r1', questionId: 'q1', operator: 'equals', value: 'João' },
          { id: 'r2', questionId: 'q2', operator: 'equals', value: '18-25' },
        ],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      // Click OU button
      const orButton = screen.getByRole('button', { name: /ou \(qualquer\)/i });
      await user.click(orButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
        expect(lastCall?.logic).toBe('OR');
      });
    });
  });

  describe('Sem perguntas anteriores', () => {
    it('deve mostrar mensagem quando não há perguntas anteriores', () => {
      renderWithRouter(
        <ConditionBuilder
          conditions={null}
          onChange={mockOnChange}
          availableQuestions={[{ id: 'q1', text: 'Primeira pergunta' }]}
          currentQuestionIndex={0}
        />
      );
      
      expect(screen.getByText(/primeira pergunta não pode ter condições/i)).toBeInTheDocument();
    });
  });

  describe('Duplicação de regras', () => {
    it('deve duplicar regra ao clicar no botão de copiar', async () => {
      const user = userEvent.setup();
      
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [
          { id: 'r1', questionId: 'q1', operator: 'equals', value: 'João' },
        ],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      // Find copy button
      const copyButtons = screen.getAllByRole('button');
      const copyButton = copyButtons.find(btn => btn.querySelector('svg.lucide-copy'));
      expect(copyButton).toBeTruthy();
      
      if (copyButton) await user.click(copyButton);
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
        expect(lastCall?.rules?.length).toBe(2);
      });
    });
  });

  describe('Preview de condições', () => {
    it('deve mostrar resumo da lógica', () => {
      const initialConditions: QuestionConditions = {
        logic: 'AND',
        rules: [
          { id: 'r1', questionId: 'q1', operator: 'equals', value: 'João' },
        ],
      };
      
      renderWithRouter(
        <ConditionBuilder
          conditions={initialConditions}
          onChange={mockOnChange}
          availableQuestions={mockAvailableQuestions}
          currentQuestionIndex={2}
        />
      );
      
      expect(screen.getByText(/resumo da lógica/i)).toBeInTheDocument();
    });
  });
});
