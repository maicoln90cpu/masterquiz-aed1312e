import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoAnalytics } from '../useVideoAnalytics';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-anon-key');

describe('useVideoAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Inicialização', () => {
    it('deve gerar sessionId único', () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      expect(result.current.sessionId).toBeDefined();
      expect(typeof result.current.sessionId).toBe('string');
      expect(result.current.sessionId.length).toBeGreaterThan(0);
    });

    it('deve manter mesmo sessionId entre re-renders', () => {
      const { result, rerender } = renderHook(() => useVideoAnalytics());
      
      const initialSessionId = result.current.sessionId;
      rerender();
      
      expect(result.current.sessionId).toBe(initialSessionId);
    });

    it('deve ter funções de tracking disponíveis', () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      expect(typeof result.current.trackPlay).toBe('function');
      expect(typeof result.current.trackPause).toBe('function');
      expect(typeof result.current.trackEnded).toBe('function');
      expect(typeof result.current.trackProgress).toBe('function');
      expect(typeof result.current.trackSeek).toBe('function');
      expect(typeof result.current.trackSpeedChange).toBe('function');
      expect(typeof result.current.trackQualityChange).toBe('function');
      expect(typeof result.current.resetSession).toBe('function');
    });
  });

  describe('Tracking de eventos de vídeo', () => {
    it('deve chamar trackPlay corretamente', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackPlay({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          video_url: 'https://example.com/video.mp4',
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/functions/v1/track-video-analytics'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('play');
      expect(body.quiz_id).toBe('quiz-123');
      expect(body.video_id).toBe('video-456');
    });

    it('deve chamar trackPause corretamente', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackPause({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          watch_time_seconds: 30,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('pause');
      expect(body.watch_time_seconds).toBe(30);
    });

    it('deve chamar trackEnded corretamente', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackEnded({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          watch_time_seconds: 120,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('ended');
      expect(body.percentage_watched).toBe(100);
    });

    it('deve chamar trackProgress com milestones', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      // Trigger 25% milestone
      await act(async () => {
        result.current.trackProgress({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          percentage: 25,
          watch_time_seconds: 30,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('progress_25');
      expect(body.percentage_watched).toBe(25);
    });

    it('deve chamar trackSeek com posições', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackSeek({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          from_time: 10,
          to_time: 60,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('seek');
      expect(body.event_data).toEqual({ from_time: 10, to_time: 60 });
    });

    it('deve chamar trackSpeedChange', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackSpeedChange({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          speed: 1.5,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('speed_change');
      expect(body.event_data).toEqual({ speed: 1.5 });
    });

    it('deve chamar trackQualityChange', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackQualityChange({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          quality: '1080p',
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('quality_change');
      expect(body.event_data).toEqual({ quality: '1080p' });
    });
  });

  describe('Session reset', () => {
    it('deve gerar novo sessionId ao resetar', () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      const initialSessionId = result.current.sessionId;
      
      act(() => {
        result.current.resetSession();
      });
      
      expect(result.current.sessionId).not.toBe(initialSessionId);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve logar warning quando fetch falha', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Network error' }),
      });

      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackPlay({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
        });
      });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });
      
      consoleWarnSpy.mockRestore();
    });

    it('deve não chamar fetch quando config está faltando', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.stubEnv('VITE_SUPABASE_URL', '');
      
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackPlay({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
        });
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Video analytics: Missing Supabase configuration'
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Session ID no payload', () => {
    it('deve incluir sessionId em todos os eventos', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackPlay({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.session_id).toBe(result.current.sessionId);
    });
  });

  describe('Progress milestones', () => {
    it('não deve duplicar milestone tracking', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      // Track 25% twice
      await act(async () => {
        result.current.trackProgress({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          percentage: 25,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      mockFetch.mockClear();

      await act(async () => {
        result.current.trackProgress({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          percentage: 26,
        });
      });

      // Should not call again for same milestone
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve resetar milestones tracking após resetSession', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      // Track 25%
      await act(async () => {
        result.current.trackProgress({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          percentage: 25,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Reset session
      act(() => {
        result.current.resetSession();
      });

      mockFetch.mockClear();

      // Track 25% again - should work now
      await act(async () => {
        result.current.trackProgress({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          percentage: 25,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
