import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionConfigStep } from '../QuestionConfigStep';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('QuestionConfigStep - FASE 1 e 4', () => {
  const mockProps = {
    questions: [],
    questionCount: 3,
    isPublic: false,
    onPublicChange: vi.fn(),
    quizTitle: 'Test Quiz',
    quizDescription: 'Test Description',
    quizId: 'test-quiz-id',
    onQuestionsUpdate: vi.fn(),
    initialQuestionIndex: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Salvamento independente de blocos (FASE 1)', () => {
    it('deve salvar blocos mesmo sem questionBlock configurado', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({
        data: [{ id: 'saved-question-id', blocks: [] }],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
        select: vi.fn().mockReturnThis(),
      } as any);

      render(<QuestionConfigStep {...mockProps} />);

      // Aguardar auto-save (500ms debounce)
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalled();
      }, { timeout: 1000 });

      const upsertCall = mockUpsert.mock.calls[0][0][0];
      
      // ✅ Verificar que blocks array está sendo salvo
      expect(upsertCall).toHaveProperty('blocks');
      expect(Array.isArray(upsertCall.blocks)).toBe(true);
      
      // ✅ Verificar valores padrão quando questionBlock ausente
      expect(upsertCall.question_text).toBeDefined();
      expect(upsertCall.answer_format).toBeDefined();
      expect(upsertCall.options).toBeDefined();
    });

    it('deve usar valores padrão quando questionBlock não existe', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
        select: vi.fn().mockReturnThis(),
      } as any);

      render(<QuestionConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalled();
      }, { timeout: 1000 });

      const payload = mockUpsert.mock.calls[0][0][0];

      // ✅ Verificar valores padrão corretos
      expect(payload.question_text).toBe('');
      expect(payload.answer_format).toBe('single_choice');
      expect(payload.options).toEqual([]);
    });
  });

  describe('Logs detalhados (FASE 4)', () => {
    it('deve logar antes e depois do upsert', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      const mockUpsert = vi.fn().mockResolvedValue({
        data: [{ id: 'test-id' }],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        upsert: mockUpsert,
        select: vi.fn().mockReturnThis(),
      } as any);

      render(<QuestionConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[QuestionConfigStep] 💾 Salvando pergunta:'),
          expect.any(Object)
        );
      }, { timeout: 1000 });

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[QuestionConfigStep] ✅ Pergunta salva com sucesso:'),
          expect.any(Object)
        );
      });

      consoleLogSpy.mockRestore();
    });

    it('deve logar erro em caso de falha no upsert', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const mockError = { message: 'Database error', code: '500' };
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        select: vi.fn().mockReturnThis(),
      } as any);

      render(<QuestionConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[QuestionConfigStep] ❌ Erro ao salvar pergunta:'),
          expect.any(Object)
        );
      }, { timeout: 1000 });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Database error')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Toast de sucesso (FASE 4)', () => {
    it('deve mostrar toast discreto após salvamento bem-sucedido', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({
          data: [{ id: 'test-id' }],
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
      } as any);

      render(<QuestionConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Alterações salvas',
          { duration: 2000 }
        );
      }, { timeout: 1000 });
    });
  });

  describe('Navegação entre perguntas', () => {
    it('deve desabilitar botão "Anterior" na primeira pergunta', () => {
      render(<QuestionConfigStep {...mockProps} />);
      
      const anteriorButton = screen.getByRole('button', { name: /anterior/i });
      expect(anteriorButton).toBeDisabled();
    });

    it('deve habilitar navegação para próxima pergunta', async () => {
      const user = userEvent.setup();
      render(<QuestionConfigStep {...mockProps} />);
      
      const proximaButton = screen.getByRole('button', { name: /próxima/i });
      expect(proximaButton).toBeEnabled();
      
      await user.click(proximaButton);
      
      // Verificar que mudou para pergunta 2
      expect(screen.getByText(/pergunta 2 de 3/i)).toBeInTheDocument();
    });
  });

  describe('Switch de visibilidade', () => {
    it('deve chamar onPublicChange quando switch alterado', async () => {
      const user = userEvent.setup();
      const onPublicChange = vi.fn();
      
      render(<QuestionConfigStep {...mockProps} onPublicChange={onPublicChange} />);
      
      const visibilitySwitch = screen.getByRole('switch');
      await user.click(visibilitySwitch);
      
      expect(onPublicChange).toHaveBeenCalledWith(true);
    });
  });
});
