import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitorFormConfigStep } from '../VisitorFormConfigStep';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('VisitorFormConfigStep - Verificação de logs e salvamento', () => {
  const mockProps = {
    collectionTiming: 'after',
    collectName: false,
    collectEmail: false,
    collectWhatsapp: false,
    onCollectionTimingChange: vi.fn(),
    onCollectNameChange: vi.fn(),
    onCollectEmailChange: vi.fn(),
    onCollectWhatsappChange: vi.fn(),
    quizId: 'test-quiz-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock queries
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any);
  });

  describe('Logs detalhados (verificação)', () => {
    it('deve logar antes de salvar configuração', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      render(<VisitorFormConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VisitorFormConfigStep] 💾 Salvando configuração do formulário:'),
          expect.any(Object)
        );
      }, { timeout: 1000 });

      consoleLogSpy.mockRestore();
    });

    it('deve logar sucesso após salvamento', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      render(<VisitorFormConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VisitorFormConfigStep] ✅ Configuração do formulário salva com sucesso')
        );
      }, { timeout: 1000 });

      consoleLogSpy.mockRestore();
    });

    it('deve logar erro em caso de falha', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const mockError = { message: 'Database error', code: '500' };
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as any);

      render(<VisitorFormConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VisitorFormConfigStep] ❌ Erro ao salvar configuração:'),
          expect.any(Object)
        );
      }, { timeout: 1000 });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Database error')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Salvamento de configuração', () => {
    it('deve fazer upsert com payload correto', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
        upsert: mockUpsert,
      } as any);

      render(<VisitorFormConfigStep {...mockProps} collectName={true} collectEmail={true} />);

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            quiz_id: 'test-quiz-id',
            collection_timing: 'after',
            collect_name: true,
            collect_email: true,
            collect_whatsapp: false,
          })
        );
      }, { timeout: 1000 });
    });

    it('deve debounce salvamento após mudanças (500ms)', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
        upsert: mockUpsert,
      } as any);

      const { rerender } = render(<VisitorFormConfigStep {...mockProps} />);

      // Mudar prop várias vezes
      rerender(<VisitorFormConfigStep {...mockProps} collectName={true} />);
      rerender(<VisitorFormConfigStep {...mockProps} collectName={true} collectEmail={true} />);

      // ✅ Deve aguardar 500ms antes de salvar
      expect(mockUpsert).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Switches de campos padrão', () => {
    it('deve chamar callbacks quando switches alterados', async () => {
      const user = userEvent.setup();
      const onCollectNameChange = vi.fn();

      render(
        <VisitorFormConfigStep 
          {...mockProps} 
          onCollectNameChange={onCollectNameChange}
          collectionTiming="after"
        />
      );

      // Encontrar switch de Nome
      const switches = screen.getAllByRole('switch');
      await user.click(switches[0]); // Primeiro switch (Nome)

      expect(onCollectNameChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Radio group de timing', () => {
    it('deve renderizar todas as opções de timing', () => {
      render(<VisitorFormConfigStep {...mockProps} />);

      expect(screen.getByLabelText(/createQuiz.visitorForm.noCollect/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/createQuiz.visitorForm.beforeQuiz/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/createQuiz.visitorForm.afterQuiz/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/createQuiz.visitorForm.both/i)).toBeInTheDocument();
    });

    it('deve chamar onCollectionTimingChange quando timing alterado', async () => {
      const user = userEvent.setup();
      const onCollectionTimingChange = vi.fn();

      render(
        <VisitorFormConfigStep 
          {...mockProps} 
          onCollectionTimingChange={onCollectionTimingChange}
        />
      );

      const beforeOption = screen.getByLabelText(/createQuiz.visitorForm.beforeQuiz/i);
      await user.click(beforeOption);

      expect(onCollectionTimingChange).toHaveBeenCalledWith('before');
    });
  });

  describe('Campos personalizados', () => {
    it('deve salvar campos personalizados junto com configuração', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            order: vi.fn().mockResolvedValue({ 
              data: [
                {
                  id: 'field-1',
                  field_name: 'Telefone',
                  field_type: 'phone',
                  is_required: true,
                  field_options: null,
                }
              ],
              error: null 
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: mockDelete,
        insert: mockInsert,
      } as any);

      render(<VisitorFormConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('deve logar salvamento de campos personalizados', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            order: vi.fn().mockResolvedValue({ 
              data: [{ id: 'field-1', field_name: 'Custom' }],
              error: null 
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      render(<VisitorFormConfigStep {...mockProps} />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('[VisitorFormConfigStep] 💾 Salvando campos personalizados:'),
          expect.any(Object)
        );
      }, { timeout: 1000 });

      consoleLogSpy.mockRestore();
    });
  });

  describe('Carregamento de configuração existente', () => {
    it('deve carregar configuração existente ao montar', async () => {
      const existingConfig = {
        collection_timing: 'before',
        collect_name: true,
        collect_email: true,
        collect_whatsapp: false,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ 
              data: existingConfig, 
              error: null 
            }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const onCollectionTimingChange = vi.fn();
      const onCollectNameChange = vi.fn();
      const onCollectEmailChange = vi.fn();

      render(
        <VisitorFormConfigStep 
          {...mockProps}
          onCollectionTimingChange={onCollectionTimingChange}
          onCollectNameChange={onCollectNameChange}
          onCollectEmailChange={onCollectEmailChange}
        />
      );

      await waitFor(() => {
        expect(onCollectionTimingChange).toHaveBeenCalledWith('before');
        expect(onCollectNameChange).toHaveBeenCalledWith(true);
        expect(onCollectEmailChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Condicionais de renderização', () => {
    it('não deve renderizar campos padrão quando timing é "none"', () => {
      render(<VisitorFormConfigStep {...mockProps} collectionTiming="none" />);

      expect(screen.queryByText(/createQuiz.visitorForm.standardFields/i)).not.toBeInTheDocument();
    });

    it('deve renderizar campos padrão quando timing não é "none"', () => {
      render(<VisitorFormConfigStep {...mockProps} collectionTiming="after" />);

      expect(screen.getByText(/createQuiz.visitorForm.standardFields/i)).toBeInTheDocument();
    });
  });
});
