import { useCallback } from "react";

interface CtaTrackingParams {
  quizId: string;
  sessionId: string;
  questionId?: string;
  stepNumber?: number;
}

export interface CtaClickHandler {
  (ctaText: string, ctaUrl: string, blockId?: string): void;
}

/**
 * Hook that provides a CTA click tracking function for funnel quizzes.
 * When called, it fires a POST to track-cta-redirect and then opens the URL.
 * Uses fetch with keepalive + apikey header (sendBeacon is incompatible with Supabase gateway).
 */
export function useCtaTracking(params: CtaTrackingParams | null): CtaClickHandler | undefined {
  const handler = useCallback<CtaClickHandler>((ctaText, ctaUrl, blockId) => {
    if (!params) return;

    // Fire tracking POST (non-blocking — we don't await the response)
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `https://${projectId}.supabase.co/functions/v1/track-cta-redirect`;

      const body = JSON.stringify({
        quizId: params.quizId,
        sessionId: params.sessionId,
        questionId: params.questionId || null,
        blockId: blockId || null,
        ctaText: ctaText || 'CTA',
        targetUrl: ctaUrl,
        stepNumber: params.stepNumber?.toString() || null,
      });

      // fetch with keepalive survives page navigation; apikey header required by Supabase gateway
      fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body,
        keepalive: true,
      }).catch(() => {
        // silently ignore - best effort tracking
      });
    } catch {
      // silently ignore tracking errors
    }

    // Open URL after firing tracking
    try {
      const url = new URL(ctaUrl);
      window.open(url.toString(), '_blank');
    } catch {
      window.open(ctaUrl, '_blank');
    }
  }, [params]);

  return params ? handler : undefined;
}
