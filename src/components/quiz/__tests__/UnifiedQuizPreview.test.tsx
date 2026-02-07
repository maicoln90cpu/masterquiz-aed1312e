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
      const questions = [{
        id: 'q1',
        question_text: 'Teste yes/no?',
        answer_format: 'yes_no' as const,
        blocks: [{
          id: 'b1',
          type: 'question',
          questionText: 'Teste yes/no?',
          answerFormat: 'yes_no',
          options: ['Sim', 'Não'],
        }],
      }];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      const simOption = screen.getByLabelText('Sim');
      await user.click(simOption);

      expect(simOption).toBeChecked();
      
      // Botão "Próxima" deve habilitar após seleção
      const proximaButton = screen.getByRole('button', { name: /próxima/i });
      expect(proximaButton).toBeEnabled();
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
    it('deve desabilitar botão "Próxima" até resposta ser selecionada', () => {
      const questions = [{
        id: 'q1',
        question_text: 'Test',
        answer_format: 'single_choice' as const,
        blocks: [{
          id: 'b1',
          type: 'question',
          answerFormat: 'single_choice',
          options: ['A', 'B'],
        }],
      }];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      const proximaButton = screen.getByRole('button', { name: /próxima/i });
      expect(proximaButton).toBeDisabled();
    });

    it('deve habilitar botão "Próxima" após resposta selecionada', async () => {
      const user = userEvent.setup();
      const questions = [{
        id: 'q1',
        question_text: 'Test',
        answer_format: 'single_choice' as const,
        blocks: [{
          id: 'b1',
          type: 'question',
          answerFormat: 'single_choice',
          options: ['Opção 1', 'Opção 2'],
        }],
      }];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} />);

      await user.click(screen.getByLabelText('Opção 1'));

      const proximaButton = screen.getByRole('button', { name: /próxima/i });
      expect(proximaButton).toBeEnabled();
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

      // Deve ter device switcher quando showDeviceFrame=true
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('deve renderizar modo embedded (simples) corretamente', () => {
      const questions = [{
        id: 'q1',
        question_text: 'Test',
        answer_format: 'single_choice' as const,
        blocks: [{ id: 'b1', type: 'question', answerFormat: 'single_choice', options: ['A'] }],
      }];

      render(<UnifiedQuizPreview {...baseProps} questions={questions as any} mode="embedded" />);

      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });
});
