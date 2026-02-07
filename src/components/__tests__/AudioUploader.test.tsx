import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioUploader } from '../AudioUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

describe('AudioUploader - FASE 5', () => {
  const mockOnChange = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock user autenticado
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    } as any);
  });

  describe('Renderização inicial', () => {
    it('deve renderizar zona de upload quando sem valor', () => {
      render(<AudioUploader onChange={mockOnChange} />);

      expect(screen.getByText(/arraste um arquivo de áudio/i)).toBeInTheDocument();
      expect(screen.getByText(/mp3, wav, ogg, m4a/i)).toBeInTheDocument();
    });

    it('deve renderizar player de áudio quando tem valor', () => {
      render(<AudioUploader value="https://example.com/audio.mp3" onChange={mockOnChange} />);

      const audioElement = document.querySelector('audio');
      expect(audioElement).toBeInTheDocument();
      expect(audioElement?.querySelector('source')?.src).toBe('https://example.com/audio.mp3');
    });

    it('deve renderizar botão de remover quando onRemove fornecido', () => {
      render(
        <AudioUploader 
          value="https://example.com/audio.mp3" 
          onChange={mockOnChange}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button');
      expect(removeButton).toBeInTheDocument();
    });
  });

  describe('Validação de formato (FASE 5)', () => {
    it('deve aceitar arquivo MP3 válido', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/audio.mp3' },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/audio.mp3' },
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      } as any);

      // Mock video_usage query
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('user-123/'),
          file
        );
      });

      expect(mockOnChange).toHaveBeenCalledWith('https://storage.example.com/audio.mp3');
      expect(toast.success).toHaveBeenCalledWith('Áudio enviado com sucesso!');
    });

    it('deve rejeitar formato inválido', async () => {
      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['text'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(toast.error).toHaveBeenCalledWith(
        'Formato de áudio não suportado. Use MP3, WAV, OGG ou M4A.'
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('deve aceitar .wav por extensão mesmo sem MIME type correto', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/audio.wav' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/audio.wav' },
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({}),
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['audio'], 'test.wav', { type: 'application/octet-stream' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });
  });

  describe('Validação de tamanho (FASE 5)', () => {
    it('deve rejeitar arquivo maior que 10MB', async () => {
      render(<AudioUploader onChange={mockOnChange} />);

      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], // 11MB
        'large.mp3',
        { type: 'audio/mpeg' }
      );
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, largeFile);

      expect(toast.error).toHaveBeenCalledWith(
        'Arquivo muito grande. Tamanho máximo: 10MB'
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('deve aceitar arquivo de exatamente 10MB', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/audio.mp3' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/audio.mp3' },
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({}),
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const exactFile = new File(
        [new ArrayBuffer(10 * 1024 * 1024)], // Exatamente 10MB
        'exact.mp3',
        { type: 'audio/mpeg' }
      );
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, exactFile);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });
  });

  describe('Upload e storage (FASE 5)', () => {
    it('deve fazer upload para bucket quiz-media', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'user-123/123456789.mp3' },
        error: null,
      });

      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/audio.mp3' },
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({}),
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(supabase.storage.from).toHaveBeenCalledWith('quiz-media');
      });
    });

    it('deve atualizar video_usage após upload bem-sucedido', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'user-123/audio.mp3' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/audio.mp3' },
        }),
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({});
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File([new ArrayBuffer(1024 * 1024)], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'user-123',
            total_size_mb: expect.any(Number),
            video_count: 1,
          })
        );
      });
    });

    it('deve lidar com erro de upload', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' },
        }),
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Erro ao fazer upload do áudio');
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Autenticação (FASE 5)', () => {
    it('deve rejeitar upload se usuário não estiver logado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      expect(toast.error).toHaveBeenCalledWith(
        'Você precisa estar logado para fazer upload'
      );
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Progress e loading (FASE 5)', () => {
    it('deve mostrar progress durante upload', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            data: { path: 'test.mp3' },
            error: null,
          }), 100))
        ),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/audio.mp3' },
        }),
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({}),
      } as any);

      render(<AudioUploader onChange={mockOnChange} />);

      const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await userEvent.upload(input, file);

      // ✅ Verificar que mostra "Enviando áudio..." durante upload
      expect(screen.getByText(/enviando áudio/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Botão de remover', () => {
    it('deve chamar onRemove quando botão clicado', async () => {
      const user = userEvent.setup();
      
      render(
        <AudioUploader
          value="https://example.com/audio.mp3"
          onChange={mockOnChange}
          onRemove={mockOnRemove}
        />
      );

      const removeButton = screen.getByRole('button');
      await user.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });
  });
});
