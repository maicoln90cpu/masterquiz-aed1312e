import { logger } from '@/lib/logger';
import { useCallback, useRef } from 'react';

interface TrackEventParams {
  quiz_id?: string;
  video_id?: string;
  video_url?: string;
  session_id: string;
  event_type: string;
  event_data?: Record<string, any>;
  watch_time_seconds?: number;
  percentage_watched?: number;
  user_id?: string;
}

// Generate a unique session ID for this viewing session
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useVideoAnalytics = () => {
  const sessionIdRef = useRef<string>(generateSessionId());
  const trackedProgressRef = useRef<Set<number>>(new Set());

  const trackEvent = useCallback(async (params: Omit<TrackEventParams, 'session_id'>) => {
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!baseUrl || !anonKey) {
        logger.warn('Video analytics: Missing Supabase configuration');
        return;
      }

      const response = await fetch(`${baseUrl}/functions/v1/track-video-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          ...params,
          session_id: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.warn('Video analytics tracking failed:', error);
      }
    } catch (error) {
      logger.warn('Video analytics tracking error:', error);
    }
  }, []);

  const trackPlay = useCallback((params: { quiz_id?: string; video_url?: string; video_id?: string }) => {
    trackEvent({
      ...params,
      event_type: 'play',
    });
  }, [trackEvent]);

  const trackPause = useCallback((params: { 
    quiz_id?: string; 
    video_url?: string; 
    video_id?: string;
    watch_time_seconds?: number;
    percentage_watched?: number;
  }) => {
    trackEvent({
      ...params,
      event_type: 'pause',
    });
  }, [trackEvent]);

  const trackEnded = useCallback((params: { 
    quiz_id?: string; 
    video_url?: string; 
    video_id?: string;
    watch_time_seconds?: number;
  }) => {
    trackEvent({
      ...params,
      event_type: 'ended',
      percentage_watched: 100,
    });
  }, [trackEvent]);

  const trackProgress = useCallback((params: { 
    quiz_id?: string; 
    video_url?: string; 
    video_id?: string;
    percentage: number;
    watch_time_seconds?: number;
  }) => {
    const { percentage, ...rest } = params;
    
    // Track at 25%, 50%, and 75% milestones
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (percentage >= milestone && !trackedProgressRef.current.has(milestone)) {
        trackedProgressRef.current.add(milestone);
        trackEvent({
          ...rest,
          event_type: `progress_${milestone}`,
          percentage_watched: milestone,
        });
      }
    }
  }, [trackEvent]);

  const trackSeek = useCallback((params: { 
    quiz_id?: string; 
    video_url?: string; 
    video_id?: string;
    from_time?: number;
    to_time?: number;
  }) => {
    const { from_time, to_time, ...rest } = params;
    trackEvent({
      ...rest,
      event_type: 'seek',
      event_data: { from_time, to_time },
    });
  }, [trackEvent]);

  const trackSpeedChange = useCallback((params: { 
    quiz_id?: string; 
    video_url?: string; 
    video_id?: string;
    speed: number;
  }) => {
    const { speed, ...rest } = params;
    trackEvent({
      ...rest,
      event_type: 'speed_change',
      event_data: { speed },
    });
  }, [trackEvent]);

  const trackQualityChange = useCallback((params: { 
    quiz_id?: string; 
    video_url?: string; 
    video_id?: string;
    quality: string;
  }) => {
    const { quality, ...rest } = params;
    trackEvent({
      ...rest,
      event_type: 'quality_change',
      event_data: { quality },
    });
  }, [trackEvent]);

  const resetSession = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    trackedProgressRef.current.clear();
  }, []);

  return {
    sessionId: sessionIdRef.current,
    trackPlay,
    trackPause,
    trackEnded,
    trackProgress,
    trackSeek,
    trackSpeedChange,
    trackQualityChange,
    resetSession,
  };
};
