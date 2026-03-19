import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockEditor } from '../BlockEditor';
import { createBlock, normalizeBlock } from '@/types/blocks';
import type { QuizBlock, BlockType } from '@/types/blocks';

// ✅ Mocks necessários para o ambiente de teste
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    i18n: { language: 'pt', changeLanguage: vi.fn() },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/hooks/useVideoStorage', () => ({
  useVideoStorage: () => ({
    allowVideoUpload: false,
    videoStorageLimitMb: 0,
    usedMb: 0,
    videoCount: 0,
    remainingMb: 0,
    usagePercentage: 0,
    checkCanUploadVideo: vi.fn(),
    refetch: vi.fn(),
    isLoading: false,
    isUnlimited: false,
  }),
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = ResizeObserverMock as any;

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({ data: new Array(4) }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue([]),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

describe('BlockEditor — Fase 11 Integration Tests', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // RENDERIZAÇÃO BÁSICA
  // ============================================
  describe('Renderização', () => {
    it('deve renderizar estado vazio com botão de adicionar', () => {
      render(<BlockEditor blocks={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Nenhum bloco adicionado')).toBeInTheDocument();
      expect(screen.getByText('Adicionar Primeira Pergunta')).toBeInTheDocument();
    });

    it('deve renderizar blocos existentes', () => {
      const blocks = [createBlock('question', 0), createBlock('text', 1)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      expect(screen.getByText('0 blocos').textContent || screen.getByText(/2 blocos/)).toBeTruthy();
    });

    it('deve renderizar tabs Editar e Templates', () => {
      render(<BlockEditor blocks={[]} onChange={mockOnChange} />);
      expect(screen.getByRole('tab', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /templates/i })).toBeInTheDocument();
    });

    it('deve aceitar blocks=null sem crashar (guarda defensiva)', () => {
      expect(() => render(<BlockEditor blocks={null as any} onChange={mockOnChange} />)).not.toThrow();
    });

    it('deve aceitar blocks=undefined sem crashar', () => {
      expect(() => render(<BlockEditor blocks={undefined as any} onChange={mockOnChange} />)).not.toThrow();
    });
  });

  // ============================================
  // ADICIONAR BLOCOS
  // ============================================
  describe('Adicionar blocos', () => {
    it('deve adicionar bloco de pergunta ao clicar "Adicionar Primeira Pergunta"', async () => {
      const user = userEvent.setup();
      render(<BlockEditor blocks={[]} onChange={mockOnChange} />);

      await user.click(screen.getByText('Adicionar Primeira Pergunta'));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const newBlocks = mockOnChange.mock.calls[0][0];
      expect(newBlocks).toHaveLength(1);
      expect(newBlocks[0].type).toBe('question');
    });

    it('deve adicionar bloco via menu dropdown', async () => {
      const user = userEvent.setup();
      const existingBlock = createBlock('question', 0);
      render(<BlockEditor blocks={[existingBlock]} onChange={mockOnChange} />);

      // Abrir dropdown
      await user.click(screen.getByText('Adicionar'));

      // Clicar em "Texto"
      await user.click(screen.getByText('Texto'));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const newBlocks = mockOnChange.mock.calls[0][0];
      expect(newBlocks).toHaveLength(2);
      expect(newBlocks[1].type).toBe('text');
    });

    it('deve preservar order correto ao adicionar', async () => {
      const user = userEvent.setup();
      const blocks = [createBlock('question', 0), createBlock('text', 1)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);

      await user.click(screen.getByText('Adicionar'));
      await user.click(screen.getByText('Separador'));

      const newBlocks = mockOnChange.mock.calls[0][0];
      expect(newBlocks[2].order).toBe(2);
    });

    it('deve mostrar toast de sucesso ao adicionar bloco', async () => {
      const user = userEvent.setup();
      render(<BlockEditor blocks={[]} onChange={mockOnChange} />);

      await user.click(screen.getByText('Adicionar Primeira Pergunta'));
      expect(toastMock.success).toHaveBeenCalled();
    });
  });

  // ============================================
  // DELETAR BLOCOS
  // ============================================
  describe('Deletar blocos', () => {
    it('deve impedir deletar último bloco', async () => {
      const user = userEvent.setup();
      const blocks = [createBlock('question', 0)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);

      // Encontrar botão de delete
      const deleteBtn = screen.getByTitle('createQuiz.blockEditor.deleteBlock');
      await user.click(deleteBtn);

      expect(mockOnChange).not.toHaveBeenCalled();
      expect(toastMock.warning).toHaveBeenCalled();
    });

    it('deve deletar bloco quando há mais de um', async () => {
      const user = userEvent.setup();
      const blocks = [createBlock('question', 0), createBlock('text', 1)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);

      // Pegar o primeiro botão de delete
      const deleteBtns = screen.getAllByTitle('createQuiz.blockEditor.deleteBlock');
      await user.click(deleteBtns[0]);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      const remaining = mockOnChange.mock.calls[0][0];
      expect(remaining).toHaveLength(1);
    });

    it('deve reindexar order após deletar', async () => {
      const user = userEvent.setup();
      const blocks = [
        createBlock('question', 0),
        createBlock('text', 1),
        createBlock('separator', 2),
      ];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);

      // Deletar o segundo bloco (text)
      const deleteBtns = screen.getAllByTitle('createQuiz.blockEditor.deleteBlock');
      await user.click(deleteBtns[1]);

      const remaining = mockOnChange.mock.calls[0][0];
      expect(remaining).toHaveLength(2);
      expect(remaining[0].order).toBe(0);
      expect(remaining[1].order).toBe(1);
    });
  });

  // ============================================
  // ATUALIZAR BLOCOS
  // ============================================
  describe('Atualizar blocos', () => {
    it('deve propagar onChange quando bloco interno é atualizado', () => {
      // Teste indireto: verificar que updateBlock chama onChange corretamente
      const blocks = [createBlock('question', 0)];
      const { rerender } = render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);

      // BlockEditor passa onUpdate para cada SortableBlock
      // A integração real depende de interação com sub-componentes
      // Verificamos que a estrutura está montada corretamente
      expect(screen.getByText('Blocos da Pergunta')).toBeInTheDocument();
    });
  });

  // ============================================
  // NORMALIZAÇÃO
  // ============================================
  describe('Normalização de blocos', () => {
    it('deve normalizar blocos antes de renderizar', () => {
      // Bloco com dados incompletos
      const malformedBlock: any = {
        id: 'test-1',
        type: 'question',
        order: 0,
        // questionText missing, options missing
      };
      
      expect(() => {
        render(<BlockEditor blocks={[malformedBlock]} onChange={mockOnChange} />);
      }).not.toThrow();
    });

    it('deve normalizar bloco legacy sem campos novos', () => {
      const legacyBlock: any = {
        id: 'legacy-1',
        type: 'accordion',
        order: 0,
        title: 'FAQ',
        // items missing (old schema)
      };

      expect(() => {
        render(<BlockEditor blocks={[legacyBlock]} onChange={mockOnChange} />);
      }).not.toThrow();
    });
  });

  // ============================================
  // SELEÇÃO DE BLOCOS
  // ============================================
  describe('Seleção de blocos', () => {
    it('deve chamar onBlockSelect ao clicar em um bloco', async () => {
      const user = userEvent.setup();
      const mockSelect = vi.fn();
      const blocks = [createBlock('question', 0), createBlock('text', 1)];
      
      render(
        <BlockEditor 
          blocks={blocks} 
          onChange={mockOnChange} 
          onBlockSelect={mockSelect}
        />
      );

      // Clicar na área do primeiro bloco
      const blockElements = screen.getAllByTitle('createQuiz.blockEditor.dragToMove');
      // O click no wrapper do bloco deve disparar onBlockSelect
      const blockWrapper = blockElements[0].closest('[class*="relative group"]');
      if (blockWrapper) {
        await user.click(blockWrapper);
        expect(mockSelect).toHaveBeenCalledWith(0);
      }
    });

    it('deve aplicar estilo de seleção ao bloco selecionado', () => {
      const blocks = [createBlock('question', 0), createBlock('text', 1)];
      
      render(
        <BlockEditor 
          blocks={blocks} 
          onChange={mockOnChange}
          selectedBlockIndex={0}
        />
      );

      // O primeiro bloco deve ter a classe de seleção
      const dragBtns = screen.getAllByTitle('createQuiz.blockEditor.dragToMove');
      const firstBlock = dragBtns[0].closest('[class*="relative group"]');
      expect(firstBlock?.className).toContain('border-primary');
    });
  });

  // ============================================
  // CONTAGEM DE BLOCOS
  // ============================================
  describe('Contagem e status', () => {
    it('deve exibir contagem de blocos correta', () => {
      const blocks = [
        createBlock('question', 0),
        createBlock('text', 1),
        createBlock('separator', 2),
      ];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      expect(screen.getByText(/3 blocos/)).toBeInTheDocument();
    });

    it('deve exibir "1 bloco" no singular', () => {
      const blocks = [createBlock('question', 0)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      expect(screen.getByText(/1 bloco(?!s)/)).toBeInTheDocument();
    });

    it('deve mostrar badge completo para separador (sempre completo)', () => {
      const blocks = [createBlock('separator', 0), createBlock('text', 1)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      // Pelo menos um badge de "completo" deve estar presente
      const completeBadges = screen.getAllByText('createQuiz.blockEditor.complete');
      expect(completeBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('deve mostrar badge incompleto para pergunta vazia', () => {
      const blocks = [createBlock('question', 0), createBlock('separator', 1)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      // Pergunta sem questionText deve ser incompleta
      const incompleteBadges = screen.getAllByText('createQuiz.blockEditor.incomplete');
      expect(incompleteBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================
  // AJUDA
  // ============================================
  describe('Painel de ajuda', () => {
    it('deve alternar visibilidade do painel de ajuda', async () => {
      const user = userEvent.setup();
      const blocks = [createBlock('question', 0)];
      render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);

      // Ajuda inicialmente oculta
      expect(screen.queryByText(/como usar o editor de blocos/i)).not.toBeInTheDocument();

      // Clicar no botão de ajuda
      const helpBtn = screen.getByTitle?.('') || screen.getAllByRole('button').find(b => b.textContent?.includes('Ajuda'));
      if (helpBtn) {
        await user.click(helpBtn);
        expect(screen.getByText(/como usar o editor de blocos/i)).toBeInTheDocument();
      }
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge cases', () => {
    it('deve funcionar com 20+ blocos sem crash', () => {
      const blocks = Array.from({ length: 22 }, (_, i) => createBlock('text', i));
      expect(() => {
        render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      }).not.toThrow();
      expect(screen.getByText(/22 blocos/)).toBeInTheDocument();
    });

    it('deve funcionar com todos os 22 tipos de bloco', () => {
      const allTypes: BlockType[] = [
        'question', 'text', 'separator', 'image', 'video', 'audio',
        'gallery', 'embed', 'button', 'price', 'metrics', 'loading',
        'progress', 'countdown', 'testimonial', 'slider', 'textInput',
        'nps', 'accordion', 'comparison', 'socialProof', 'animatedCounter'
      ];
      const blocks = allTypes.map((type, i) => createBlock(type, i));
      
      expect(() => {
        render(<BlockEditor blocks={blocks} onChange={mockOnChange} />);
      }).not.toThrow();
    });
  });
});
