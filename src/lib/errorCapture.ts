/**
 * Client-side error capture — logs errors to client_error_logs table.
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
    await supabase.from('client_error_logs').insert([{
      component_name: payload.component_name ?? null,
      error_message: payload.error_message.slice(0, 2000),
      stack_trace: payload.stack_trace?.slice(0, 5000) ?? null,
      url: payload.url ?? window.location.href,
      user_id: user?.id ?? null,
      user_agent: navigator.userAgent,
      metadata: (payload.metadata ?? {}) as Record<string, string>,
    }]);
  } catch {
    // Silently fail
  }
}

export function installGlobalErrorCapture() {
  if (isCapturing) return;
  isCapturing = true;

  window.addEventListener('error', (event) => {
    logClientError({
      component_name: 'GlobalErrorHandler',
      error_message: event.message || 'Unknown error',
      stack_trace: event.error?.stack,
      url: event.filename || window.location.href,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason) || 'Unhandled promise rejection';
    logClientError({
      component_name: 'UnhandledRejection',
      error_message: message,
      stack_trace: event.reason?.stack,
    });
  });
}
