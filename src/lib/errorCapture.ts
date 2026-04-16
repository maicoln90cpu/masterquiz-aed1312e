/**
 * Client-side error capture — logs errors to client_error_logs table.
 * Usage: wrap your app root with the ErrorBoundary, or call logClientError manually.
 */
import { supabase } from '@/integrations/supabase/client';

let isCapturing = false;

interface ErrorPayload {
  component_name?: string;
  error_message: string;
  stack_trace?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export async function logClientError(payload: ErrorPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('client_error_logs').insert({
      component_name: payload.component_name ?? null,
      error_message: payload.error_message.slice(0, 2000),
      stack_trace: payload.stack_trace?.slice(0, 5000) ?? null,
      url: payload.url ?? window.location.href,
      user_id: user?.id ?? null,
      user_agent: navigator.userAgent,
      metadata: payload.metadata ?? {},
    });
  } catch {
    // Silently fail — don't create error loops
  }
}

/**
 * Install global error listeners. Call once at app startup.
 */
export function installGlobalErrorCapture() {
  if (isCapturing) return;
  isCapturing = true;

  // Unhandled errors
  window.addEventListener('error', (event) => {
    logClientError({
      component_name: 'GlobalErrorHandler',
      error_message: event.message || 'Unknown error',
      stack_trace: event.error?.stack,
      url: event.filename || window.location.href,
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason) || 'Unhandled promise rejection';
    logClientError({
      component_name: 'UnhandledRejection',
      error_message: message,
      stack_trace: event.reason?.stack,
    });
  });
}
