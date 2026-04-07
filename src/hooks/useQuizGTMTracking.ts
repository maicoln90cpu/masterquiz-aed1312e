import { useEffect, useRef } from 'react';
import type { Quiz, QuizResult, QuizFormConfig } from '@/types/quiz';

interface UseQuizGTMTrackingProps {
  quiz: Quiz | null;
  currentStep: number;
  showResult: boolean;
  finalResult: QuizResult | null;
  formData: Record<string, string>;
  formConfig: QuizFormConfig | null;
  trackQuizStart: (quizId: string, quizTitle: string) => void;
  trackQuizComplete: (quizId: string, quizTitle: string, resultId?: string) => void;
  trackLeadCaptured: (quizId: string, quizTitle: string, hasEmail: boolean, hasWhatsapp: boolean, email?: string, name?: string) => void;
}

/**
 * Connects quiz lifecycle events to GTM tracking functions.
 * Fires quiz_start on first step advance, quiz_complete on result, lead_captured on form submit.
 */
export function useQuizGTMTracking({
  quiz,
  currentStep,
  showResult,
  finalResult,
  formData,
  formConfig,
  trackQuizStart,
  trackQuizComplete,
  trackLeadCaptured,
}: UseQuizGTMTrackingProps) {
  const startFired = useRef(false);
  const completeFired = useRef(false);
  const leadFired = useRef(false);

  // Fire quiz_start when user moves past step 0
  useEffect(() => {
    if (!quiz || startFired.current) return;
    if (currentStep > 0) {
      startFired.current = true;
      trackQuizStart(quiz.id, quiz.title);
    }
  }, [quiz, currentStep]);

  // Fire quiz_complete when result is shown
  useEffect(() => {
    if (!quiz || completeFired.current || !showResult) return;
    completeFired.current = true;
    trackQuizComplete(quiz.id, quiz.title, finalResult?.id);
  }, [quiz, showResult, finalResult]);

  // Fire lead_captured when form data has email or whatsapp
  useEffect(() => {
    if (!quiz || leadFired.current || !showResult) return;
    const hasEmail = !!(formData?.email);
    const hasWhatsapp = !!(formData?.whatsapp);
    if (hasEmail || hasWhatsapp) {
      leadFired.current = true;
      trackLeadCaptured(quiz.id, quiz.title, hasEmail, hasWhatsapp, formData?.email, formData?.name);
    }
  }, [quiz, showResult, formData]);
}
