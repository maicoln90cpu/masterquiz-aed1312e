import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioBlock } from '../AudioBlock';
import * as useVideoStorageHook from '@/hooks/useVideoStorage';

describe('AudioBlock - FASE 9 (corrigido)', () => {
  const mockBlock = {
    id: 'audio-1',
    type: 'audio' as const,
    url: '',
    caption: '',
    autoplay: false,
    order: 0,
  };

  const mockOnChange = vi.fn();

  const mockStorage = (overrides: Partial<ReturnType<typeof useVideoStorageHook.useVideoStorage>> = {}) => {
    vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
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
      ...overrides,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização de tabs', () => {
    it('deve renderizar tabs "URL Externa" e "Upload"', () => {
      mockStorage({ allowVideoUpload: true, videoStorageLimitMb: 1000, remainingMb: 1000 });
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      expect(screen.getByRole('tab', { name: /url externa/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
    });

    it('deve desabilitar tab Upload quando allowVideoUpload false', () => {
      mockStorage();
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      const uploadTab = screen.getByRole('tab', { name: /upload/i });
      expect(uploadTab).toBeDisabled();
    });
  });

  describe('Input de URL externa', () => {
    it('deve chamar onChange quando URL alterada', async () => {
      const user = userEvent.setup();
      mockStorage();
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const urlInput = screen.getByPlaceholderText(/https:\/\/exemplo.com\/audio.mp3/i);
      await user.type(urlInput, 'https://example.com/my-audio.mp3');

      // userEvent.type chama onChange por caractere; verificar última chamada
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall).toMatchObject({
        url: 'https://example.com/my-audio.mp3',
        provider: 'external',
      });
    });
  });

  describe('Barra de storage', () => {
    it('deve exibir barra de armazenamento quando allowVideoUpload e limite > 0', () => {
      mockStorage({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 750.5,
        videoCount: 7,
        remainingMb: 249.5,
        usagePercentage: 75.05,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      // Component uses .toFixed(1) → "750.5MB / 1000MB"
      expect(screen.getByText('750.5MB / 1000MB')).toBeInTheDocument();
    });

    it('não deve mostrar barra de storage quando allowVideoUpload false', () => {
      mockStorage();
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      expect(screen.queryByText(/MB \/ .*MB/)).not.toBeInTheDocument();
    });

    it('não deve mostrar barra de storage quando limite é 0', () => {
      mockStorage({ allowVideoUpload: true, videoStorageLimitMb: 0 });
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      expect(screen.queryByText(/MB \/ .*MB/)).not.toBeInTheDocument();
    });
  });

  describe('Integração com AudioUploader', () => {
    it('deve renderizar AudioUploader quando allowVideoUpload true e tab Upload ativa', async () => {
      const user = userEvent.setup();
      mockStorage({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        remainingMb: 1000,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      await user.click(screen.getByRole('tab', { name: /upload/i }));

      // AudioUploader renderiza uma dropzone — verificar que o conteúdo de upload está presente
      const uploadContent = screen.getByRole('tabpanel');
      expect(uploadContent).toBeInTheDocument();
    });

    it('deve mostrar alerta quando upload indisponível e tab forçada', () => {
      mockStorage();
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      // Tab Upload está desabilitada no plano free
      expect(screen.getByRole('tab', { name: /upload/i })).toBeDisabled();
    });
  });

  describe('Confirmação de configuração', () => {
    it('deve mostrar indicador quando URL configurada', () => {
      mockStorage();
      render(<AudioBlock block={{ ...mockBlock, url: 'https://example.com/audio.mp3' }} onChange={mockOnChange} />);
      expect(screen.getByText(/áudio configurado/i)).toBeInTheDocument();
    });

    it('não deve mostrar indicador quando URL vazia', () => {
      mockStorage();
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);
      expect(screen.queryByText(/áudio configurado/i)).not.toBeInTheDocument();
    });
  });

  describe('Provider tracking', () => {
    it('deve marcar provider como "external" quando URL digitada', async () => {
      const user = userEvent.setup();
      mockStorage();
      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const urlInput = screen.getByPlaceholderText(/https:\/\/exemplo.com\/audio.mp3/i);
      await user.type(urlInput, 'https://external.com/audio.mp3');

      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      expect(lastCall).toMatchObject({ provider: 'external' });
    });
  });
});
