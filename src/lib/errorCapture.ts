/**
 * Client-side error capture — logs errors to client_error_logs table.
 *
 * IMPORTANTE: a função `shouldIgnoreError` filtra ruído conhecido antes
 * de gravar no banco. NÃO REMOVA esses filtros sem antes consultar o
 * painel "Erros (24h)" — eles existem para evitar reaparecimento de
 * falsos positivos que poluem a auditoria. Documentado em mem://.
 *
 * Categorias filtradas:
 *  - Extensões de browser (ex.: "Object Not Found Matching Id" — MS Edge / outros)
 *  - HMR do Vite em ambiente de preview (URLs com `?t=` ou `node_modules/.vite/deps`)
 *  - Erros de `ResizeObserver loop` (ruído benigno do navegador)
 *  - Erros de `dynamically imported module` no domínio lovableproject.com (preview HMR)
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

/**
 * Retorna true se o erro deve ser IGNORADO (não gravado no banco).
 * Mantenha a lista enxuta e baseada em padrões já observados em produção.
 */
function shouldIgnoreError(message: string, url?: string): boolean {
  if (!message) return true;

  const msg = message.toLowerCase();
  const u = (url || '').toLowerCase();

  // 1) Extensões de browser (Edge, Outlook integrations etc.)
  if (msg.includes('object not found matching id')) return true;
  if (msg.includes('methodname:update')) return true;

  // 2) ResizeObserver — ruído benigno do navegador
  if (msg.includes('resizeobserver loop')) return true;
  if (msg.includes('resizeobserver loop completed with undelivered notifications')) return true;

  // 3) HMR do Vite (apenas em preview/dev — nunca em produção real)
  if (u.includes('node_modules/.vite/deps')) return true;
  if (u.includes('?t=') && u.includes('lovableproject.com')) return true;
  if (msg.includes('error loading dynamically imported module') && u.includes('lovableproject.com')) return true;

  // 4) Erros de carregamento de chunk em ambiente de preview
  if (msg.includes('failed to fetch dynamically imported module') && u.includes('lovableproject.com')) return true;

  // 5) Erros de extensões com prefixo conhecido
  if (msg.startsWith('script error.') && !u) return true; // CORS-bloqueado, sem info útil

  return false;
}

export async function logClientError(payload: ErrorPayload) {
  // Filtro de ruído — evita poluir o painel admin
  if (shouldIgnoreError(payload.error_message, payload.url)) {
    return;
  }

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
