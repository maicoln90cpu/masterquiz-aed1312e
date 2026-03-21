import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedQuizPreview } from '../UnifiedQuizPreview';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('UnifiedQuizPreview', () => {
  const baseProps = {
    title: 'Test Quiz',
    description: 'Test Description',
    template: 'moderno',
    logoUrl: undefined,
    questions: [],
    formConfig: {
      collect_name: false,
      collect_email: false,
      collect_whatsapp: false,
    },
    mode: 'embedded' as const,
  };

  // Helper: create multiple questions so "Próxima" button appears (not "Finalizar")
  const multipleQuestions = [
    {
      id: 'q1',
      question_text: 'Q1',
      answer_format: 'single_choice' as const,
      blocks: [{ id: 'b1', type: 'question', questionText: 'Pergunta 1', answerFormat: 'single_choice', options: ['Opção 1', 'Opção 2'] }],
    },
    {
      id: 'q2',
      question_text: 'Q2',
      answer_format: 'single_choice' as const,
      blocks: [{ id: 'b2', type: 'question', questionText: 'Pergunta 2', answerFormat: 'single_choice', options: ['A', 'B'] }],
    },
  ];

  describe('Suporte a yes_no', () => {
    it('deve renderizar pergunta yes_no com opções Sim e Não', () => {
      const questions = [{
        id: 'q1',
        question_text: 'Você gosta de testes?',
        answer_format: 'yes_no' as const,
        blocks: [{
          id: 'b1',
          type: 'question',
          questionText: 'Você gosta de testes?',
          answerFormat: 'yes_no',
          options: ['Sim', 'Não'],
        }],
      }];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      expect(screen.getByText('Você gosta de testes?')).toBeInTheDocument();
      expect(screen.getByLabelText('Sim')).toBeInTheDocument();
      expect(screen.getByLabelText('Não')).toBeInTheDocument();
    });

    it('deve permitir selecionar opção yes_no', async () => {
      const user = userEvent.setup();
      const questions = [
        {
          id: 'q1',
          question_text: 'Teste yes/no?',
          answer_format: 'yes_no' as const,
          blocks: [{ id: 'b1', type: 'question', questionText: 'Teste yes/no?', answerFormat: 'yes_no', options: ['Sim', 'Não'] }],
        },
        {
          id: 'q2',
          question_text: 'Outra?',
          answer_format: 'single_choice' as const,
          blocks: [{ id: 'b2', type: 'question', questionText: 'Outra?', answerFormat: 'single_choice', options: ['A', 'B'] }],
        },
      ];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      // Click the option div (which triggers the answer selection)
      const simLabel = screen.getByLabelText('Sim');
      await user.click(simLabel);

      // After selection, next button should be enabled
      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => b.textContent?.includes('Próxima'));
      expect(nextButton).toBeTruthy();
      if (nextButton) {
        expect(nextButton).toBeEnabled();
      }
    });
  });

  describe('Fallback de options', () => {
    it('deve usar questionBlock.options quando disponível e não vazio', () => {
      const questions = [{
        id: 'q1',
        question_text: 'Fallback test',
        answer_format: 'single_choice' as const,
        blocks: [{
          id: 'b1',
          type: 'question',
          questionText: 'Pergunta com options em block',
          answerFormat: 'single_choice',
          options: ['Opção A', 'Opção B', 'Opção C'],
        }],
        options: [{ text: 'Opção Fallback' }],
      }];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      expect(screen.getByLabelText('Opção A')).toBeInTheDocument();
      expect(screen.getByLabelText('Opção B')).toBeInTheDocument();
      expect(screen.getByLabelText('Opção C')).toBeInTheDocument();
      expect(screen.queryByLabelText('Opção Fallback')).not.toBeInTheDocument();
    });
  });

  describe('Navegação e estado', () => {
    it('deve desabilitar botão até resposta ser selecionada', () => {
      render(<UnifiedQuizPreview {...baseProps} questions={multipleQuestions as any} />);

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => b.textContent?.includes('Próxima'));
      expect(nextButton).toBeTruthy();
      if (nextButton) {
        expect(nextButton).toBeDisabled();
      }
    });

    it('deve habilitar botão após resposta selecionada', async () => {
      const user = userEvent.setup();
      render(<UnifiedQuizPreview {...baseProps} questions={multipleQuestions as any} />);

      await user.click(screen.getByLabelText('Opção 1'));

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons.find(b => b.textContent?.includes('Próxima'));
      expect(nextButton).toBeTruthy();
      if (nextButton) {
        expect(nextButton).toBeEnabled();
      }
    });

    it('deve mostrar progresso correto', () => {
      const questions = [
        { id: 'q1', question_text: 'Q1', answer_format: 'single_choice' as const, blocks: [{ id: 'b1', type: 'question', answerFormat: 'single_choice', options: ['A'] }] },
        { id: 'q2', question_text: 'Q2', answer_format: 'single_choice' as const, blocks: [{ id: 'b2', type: 'question', answerFormat: 'single_choice', options: ['B'] }] },
        { id: 'q3', question_text: 'Q3', answer_format: 'single_choice' as const, blocks: [{ id: 'b3', type: 'question', answerFormat: 'single_choice', options: ['C'] }] },
      ];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      expect(screen.getByText(/Pergunta 1 de 3/i)).toBeInTheDocument();
      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('Modos de exibição', () => {
    it('deve renderizar modo inline corretamente', () => {
      const questions = [{
        id: 'q1',
        question_text: 'Test',
        answer_format: 'single_choice' as const,
        blocks: [{ id: 'b1', type: 'question', answerFormat: 'single_choice', options: ['A'] }],
      }];

      const { container } = render(
        <UnifiedQuizPreview {...baseProps} questions={questions as any} mode="inline" showDeviceFrame={true} />
      );

      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('deve renderizar modo embedded corretamente', () => {
      // With 3 questions, first question shows 33%
      const questions = [
        { id: 'q1', question_text: 'T1', answer_format: 'single_choice' as const, blocks: [{ id: 'b1', type: 'question', answerFormat: 'single_choice', options: ['A'] }] },
        { id: 'q2', question_text: 'T2', answer_format: 'single_choice' as const, blocks: [{ id: 'b2', type: 'question', answerFormat: 'single_choice', options: ['B'] }] },
        { id: 'q3', question_text: 'T3', answer_format: 'single_choice' as const, blocks: [{ id: 'b3', type: 'question', answerFormat: 'single_choice', options: ['C'] }] },
      ];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} mode="embedded" />);

      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });
});
