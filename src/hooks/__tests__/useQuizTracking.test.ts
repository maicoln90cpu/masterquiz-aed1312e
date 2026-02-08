import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuizTracking } from '../useQuizTracking';

describe('useQuizTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).dataLayer = undefined;
    (window as any).fbq = undefined;
  });

  afterEach(() => {
    const elements = document.querySelectorAll('[id*="pixel"], [id*="gtm"], [id*="quiz-fb"]');
    elements.forEach(el => el.remove());
  });

  it('should return tracking functions', () => {
    const { result } = renderHook(() =>
      useQuizTracking({ quiz: null, quizOwnerProfile: null })
    );
    expect(result.current.trackQuizStart).toBeDefined();
    expect(result.current.trackQuizComplete).toBeDefined();
    expect(result.current.trackLeadCaptured).toBeDefined();
  });

  it('should push quiz_start event to dataLayer', () => {
    (window as any).dataLayer = [];
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { gtm_container_id: 'GTM-ABC1234', facebook_pixel_id: null }
      })
    );
    result.current.trackQuizStart('quiz-1', 'Test Quiz');
    expect((window as any).dataLayer).toContainEqual({
      event: 'quiz_start', quiz_id: 'quiz-1', quiz_title: 'Test Quiz'
    });
  });

  it('should push quiz_complete event to dataLayer', () => {
    (window as any).dataLayer = [];
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { gtm_container_id: 'GTM-ABC1234', facebook_pixel_id: null }
      })
    );
    result.current.trackQuizComplete('quiz-1', 'Test Quiz', 'result-1');
    expect((window as any).dataLayer).toContainEqual({
      event: 'quiz_complete', quiz_id: 'quiz-1', quiz_title: 'Test Quiz', result_id: 'result-1'
    });
  });

  it('should push lead_captured event to dataLayer', () => {
    (window as any).dataLayer = [];
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { gtm_container_id: 'GTM-ABC1234', facebook_pixel_id: null }
      })
    );
    result.current.trackLeadCaptured('quiz-1', 'Test Quiz', true, false, 'test@example.com', 'John');
    expect((window as any).dataLayer).toContainEqual({
      event: 'lead_captured', quiz_id: 'quiz-1', quiz_title: 'Test Quiz',
      has_email: true, has_whatsapp: false, lead_email: 'test@example.com', lead_name: 'John'
    });
  });

  it('should call fbq trackCustom for quiz start', () => {
    const mockFbq = vi.fn();
    (window as any).fbq = mockFbq;
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { facebook_pixel_id: '1234567890123456', gtm_container_id: null }
      })
    );
    result.current.trackQuizStart('quiz-1', 'Test Quiz');
    expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'QuizStart', {
      content_name: 'Test Quiz', quiz_id: 'quiz-1'
    });
  });

  it('should call fbq track Lead when email or whatsapp provided', () => {
    const mockFbq = vi.fn();
    (window as any).fbq = mockFbq;
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { facebook_pixel_id: '1234567890123456', gtm_container_id: null }
      })
    );
    result.current.trackLeadCaptured('quiz-1', 'Test Quiz', true, false);
    expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {
      content_name: 'Test Quiz', content_category: 'quiz_completion', value: 1, currency: 'BRL'
    });
  });

  it('should not call fbq Lead when no email or whatsapp', () => {
    const mockFbq = vi.fn();
    (window as any).fbq = mockFbq;
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { facebook_pixel_id: '1234567890123456', gtm_container_id: null }
      })
    );
    result.current.trackLeadCaptured('quiz-1', 'Test Quiz', false, false);
    expect(mockFbq).not.toHaveBeenCalledWith('track', 'Lead', expect.anything());
  });

  it('should not throw if dataLayer is undefined', () => {
    (window as any).dataLayer = undefined;
    const { result } = renderHook(() =>
      useQuizTracking({ quiz: null, quizOwnerProfile: null })
    );
    expect(() => {
      result.current.trackQuizStart('quiz-1', 'Test Quiz');
    }).not.toThrow();
  });

  // ✅ NEW: GTM should load even if pixel ID is invalid
  it('should load GTM even if pixel ID is invalid', () => {
    const { result } = renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { facebook_pixel_id: 'INVALID', gtm_container_id: 'GTM-ABC1234' }
      })
    );
    // GTM should have injected quiz_view event
    expect((window as any).dataLayer).toContainEqual(
      expect.objectContaining({ event: 'quiz_view', quiz_id: 'quiz-1' })
    );
    // GTM script should exist
    expect(document.getElementById('quiz-gtm-script')).not.toBeNull();
  });

  // ✅ NEW: Pixel should not duplicate if global pixel has same ID
  it('should not inject pixel if global pixel has same ID', () => {
    // Simulate global pixel already present
    const globalScript = document.createElement('script');
    globalScript.id = 'global-fb-pixel-script';
    globalScript.textContent = `fbq('init', '1234567890123456');`;
    document.head.appendChild(globalScript);

    renderHook(() =>
      useQuizTracking({
        quiz: { id: 'quiz-1', title: 'Test Quiz' } as any,
        quizOwnerProfile: { facebook_pixel_id: '1234567890123456', gtm_container_id: null }
      })
    );

    // Should NOT have created a quiz-specific pixel script
    expect(document.getElementById('quiz-fb-pixel-script')).toBeNull();

    // Cleanup
    globalScript.remove();
  });
});
