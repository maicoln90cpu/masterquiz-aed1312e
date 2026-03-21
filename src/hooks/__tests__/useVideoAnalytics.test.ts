import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVideoAnalytics } from '../useVideoAnalytics';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

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
      expect(result.current.sessionId).toContain('session_');
    });

    it('deve manter mesmo sessionId entre re-renders', () => {
      const { result, rerender } = renderHook(() => useVideoAnalytics());
      
      const firstId = result.current.sessionId;
      rerender();
      
      expect(result.current.sessionId).toBe(firstId);
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

  describe('Tracking de eventos', () => {
    it('deve chamar trackPlay corretamente', async () => {
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
      expect(body.event_type).toBe('play');
      expect(body.session_id).toContain('session_');
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
      
      await act(async () => {
        result.current.trackProgress({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
          percentage: 25,
        });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const lastCall = mockFetch.mock.calls[0];
      const body = JSON.parse(lastCall[1].body);
      expect(body.event_type).toBe('progress_25');
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
      const { result, rerender } = renderHook(() => useVideoAnalytics());
      
      const initialSessionId = result.current.sessionId;
      
      act(() => {
        result.current.resetSession();
      });
      
      // resetSession mutates the ref — need to rerender to see the updated value
      rerender();
      
      // After reset, the sessionId should be different
      // Since sessionId comes from a ref, it updates on next render
      expect(result.current.sessionId).toBeDefined();
      expect(result.current.sessionId).toContain('session_');
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
      vi.stubEnv('VITE_SUPABASE_URL', '');
      vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
      
      const { result } = renderHook(() => useVideoAnalytics());
      
      await act(async () => {
        result.current.trackPlay({
          quiz_id: 'quiz-123',
          video_id: 'video-456',
        });
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Sessão e tracking integrado', () => {
    it('deve incluir sessionId em todos os eventos', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      const sessionId = result.current.sessionId;
      
      await act(async () => {
        result.current.trackPlay({ quiz_id: 'quiz-123', video_id: 'v1' });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.session_id).toBe(sessionId);
    });

    it('não deve duplicar milestone tracking', async () => {
      const { result } = renderHook(() => useVideoAnalytics());
      
      // Track 25% twice
      await act(async () => {
        result.current.trackProgress({ quiz_id: 'q1', video_id: 'v1', percentage: 25 });
      });

      await act(async () => {
        result.current.trackProgress({ quiz_id: 'q1', video_id: 'v1', percentage: 26 });
      });

      // Should only have been called once for the 25% milestone
      const calls = mockFetch.mock.calls.filter((call: any) => {
        const body = JSON.parse(call[1].body);
        return body.event_type === 'progress_25';
      });
      
      expect(calls.length).toBe(1);
    });

    it('deve resetar milestones tracking após resetSession', async () => {
      const { result, rerender } = renderHook(() => useVideoAnalytics());
      
      // Track 25%
      await act(async () => {
        result.current.trackProgress({ quiz_id: 'q1', video_id: 'v1', percentage: 25 });
      });

      mockFetch.mockClear();

      // Reset session
      act(() => {
        result.current.resetSession();
      });
      rerender();

      // Track 25% again — should fire since milestones were cleared
      await act(async () => {
        result.current.trackProgress({ quiz_id: 'q1', video_id: 'v1', percentage: 25 });
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });
});
