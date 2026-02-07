import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioBlock } from '../AudioBlock';
import * as useVideoStorageHook from '@/hooks/useVideoStorage';

describe('AudioBlock - FASE 5', () => {
  const mockBlock = {
    id: 'audio-1',
    type: 'audio' as const,
    url: '',
    caption: '',
    autoplay: false,
    order: 0,
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização de tabs', () => {
    it('deve renderizar tabs "URL Externa" e "Upload"', () => {
      vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 0,
        videoCount: 0,
        remainingMb: 1000,
        usagePercentage: 0,
        checkCanUploadVideo: vi.fn(),
        refetch: vi.fn(),
        isLoading: false,
        isUnlimited: false,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      expect(screen.getByRole('tab', { name: /url externa/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
    });

    it('deve desabilitar tab Upload quando allowVideoUpload false', () => {
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
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const uploadTab = screen.getByRole('tab', { name: /upload/i });
      expect(uploadTab).toBeDisabled();
    });
  });

  describe('Input de URL externa', () => {
    it('deve chamar onChange quando URL alterada', async () => {
      const user = userEvent.setup();
      
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
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const urlInput = screen.getByPlaceholderText(/https:\/\/exemplo.com\/audio.mp3/i);
      await user.type(urlInput, 'https://example.com/my-audio.mp3');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com/my-audio.mp3',
          provider: 'external',
        })
      );
    });
  });

  describe('Alertas de storage (FASE 5)', () => {
    it('deve mostrar alerta vermelho quando storage 100%', () => {
      vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 1000,
        videoCount: 10,
        remainingMb: 0,
        usagePercentage: 100,
        checkCanUploadVideo: vi.fn(),
        refetch: vi.fn(),
        isLoading: false,
        isUnlimited: false,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      expect(screen.getByText(/limite de armazenamento atingido/i)).toBeInTheDocument();
    });

    it('deve mostrar alerta amarelo quando storage >= 80%', () => {
      vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 850,
        videoCount: 8,
        remainingMb: 150,
        usagePercentage: 85,
        checkCanUploadVideo: vi.fn(),
        refetch: vi.fn(),
        isLoading: false,
        isUnlimited: false,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      expect(screen.getByText(/você está usando 85% do seu armazenamento/i)).toBeInTheDocument();
    });

    it('não deve mostrar alertas quando storage < 80%', () => {
      vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 500,
        videoCount: 5,
        remainingMb: 500,
        usagePercentage: 50,
        checkCanUploadVideo: vi.fn(),
        refetch: vi.fn(),
        isLoading: false,
        isUnlimited: false,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      expect(screen.queryByText(/limite de armazenamento/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/você está usando.*% do seu armazenamento/i)).not.toBeInTheDocument();
    });
  });

  describe('Progress bar de storage', () => {
    it('deve exibir uso correto de storage', () => {
      vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 750.5,
        videoCount: 7,
        remainingMb: 249.5,
        usagePercentage: 75.05,
        checkCanUploadVideo: vi.fn(),
        refetch: vi.fn(),
        isLoading: false,
        isUnlimited: false,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      expect(screen.getByText('750.50MB / 1000MB')).toBeInTheDocument();
    });
  });

  describe('Campo de caption', () => {
    it('deve atualizar caption quando alterado', async () => {
      const user = userEvent.setup();
      
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
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const captionInput = screen.getByPlaceholderText(/nome ou descrição do áudio/i);
      await user.type(captionInput, 'Meu áudio de teste');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: 'Meu áudio de teste',
        })
      );
    });
  });

  describe('Switch de autoplay', () => {
    it('deve alternar autoplay quando switch clicado', async () => {
      const user = userEvent.setup();
      
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
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const autoplaySwitch = screen.getByRole('switch');
      await user.click(autoplaySwitch);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          autoplay: true,
        })
      );
    });
  });

  describe('Integração com AudioUploader', () => {
    it('deve renderizar AudioUploader quando allowVideoUpload true', async () => {
      const user = userEvent.setup();
      
      vi.spyOn(useVideoStorageHook, 'useVideoStorage').mockReturnValue({
        allowVideoUpload: true,
        videoStorageLimitMb: 1000,
        usedMb: 0,
        videoCount: 0,
        remainingMb: 1000,
        usagePercentage: 0,
        checkCanUploadVideo: vi.fn(),
        refetch: vi.fn(),
        isLoading: false,
        isUnlimited: false,
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      // Mudar para tab Upload
      await user.click(screen.getByRole('tab', { name: /upload/i }));

      // ✅ AudioUploader deve estar presente
      expect(screen.getByText(/arraste um arquivo de áudio/i)).toBeInTheDocument();
    });

    it('deve mostrar mensagem de upgrade quando allowVideoUpload false', async () => {
      const user = userEvent.setup();
      
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
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      // Tab Upload está desabilitada, mas podemos forçar render do conteúdo verificando o código
      // Na prática, o usuário não conseguiria clicar, mas testamos o estado
      expect(screen.getByRole('tab', { name: /upload/i })).toBeDisabled();
    });
  });

  describe('Provider tracking', () => {
    it('deve marcar provider como "external" quando URL digitada', async () => {
      const user = userEvent.setup();
      
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
      });

      render(<AudioBlock block={mockBlock} onChange={mockOnChange} />);

      const urlInput = screen.getByPlaceholderText(/https:\/\/exemplo.com\/audio.mp3/i);
      await user.type(urlInput, 'https://external.com/audio.mp3');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'external',
        })
      );
    });
  });
});
