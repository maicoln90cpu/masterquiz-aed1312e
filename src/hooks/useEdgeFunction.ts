/**
 * 🛡️ PROTEÇÃO P18 — Hook React único para chamar Edge Functions a partir de componentes.
 *
 * Encapsula `invokeEdgeFunction` adicionando:
 *   - estado React (`loading`, `error`, `data`, `traceId`),
 *   - toast automático em PT-BR via sonner (configurável),
 *   - logger central (`@/lib/logger`) para todo erro.
 *
 * Use este hook em componentes; em services/utils, chame `invokeEdgeFunction` direto.
 *
 * Exemplo:
 *   const { invoke, loading } = useEdgeFunction<MyResp>('admin-view-user-data');
 *   const result = await invoke({ user_id: id });
 */
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  invokeEdgeFunction,
  EdgeCallError,
  defaultErrorMessage,
  type InvokeEdgeOptions,
} from '@/lib/invokeEdgeFunction';

type ToastMode = 'error' | 'silent' | ((err: EdgeCallError) => void);

export interface UseEdgeFunctionOptions extends InvokeEdgeOptions {
  /** Como mostrar erros: 'error' (toast, padrão) | 'silent' | callback. */
  onError?: ToastMode;
  /** Mensagem custom mostrada no toast em caso de erro (sobrescreve a padrão). */
  errorMessage?: string;
  /** Mostrar toast de sucesso. */
  successMessage?: string;
}

export interface UseEdgeFunctionResult<T> {
  invoke: (body?: Record<string, unknown>) => Promise<T | null>;
  data: T | null;
  error: EdgeCallError | null;
  loading: boolean;
  traceId: string | null;
  reset: () => void;
}

export function useEdgeFunction<T = unknown>(
  fnName: string,
  options: UseEdgeFunctionOptions = {},
): UseEdgeFunctionResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<EdgeCallError | null>(null);
  const [loading, setLoading] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);

  // Mantém sempre as últimas options sem trocar referência do invoke
  const optsRef = useRef(options);
  optsRef.current = options;

  const invoke = useCallback(
    async (body?: Record<string, unknown>): Promise<T | null> => {
      const opts = optsRef.current;
      setLoading(true);
      setError(null);
      try {
        const { data: result, traceId: tid } = await invokeEdgeFunction<T>(fnName, body, opts);
        setData(result);
        setTraceId(tid);
        if (opts.successMessage) toast.success(opts.successMessage);
        return result;
      } catch (e) {
        const err =
          e instanceof EdgeCallError
            ? e
            : new EdgeCallError('UNKNOWN', (e as Error)?.message || 'Erro desconhecido', '');
        setError(err);
        setTraceId(err.traceId || null);
        logger.error(`[useEdgeFunction] ${fnName} falhou`, {
          code: err.code,
          status: err.status,
          traceId: err.traceId,
          message: err.message,
        });
        const mode = opts.onError ?? 'error';
        if (mode === 'error') {
          toast.error(opts.errorMessage || defaultErrorMessage(err));
        } else if (typeof mode === 'function') {
          mode(err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fnName],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setTraceId(null);
    setLoading(false);
  }, []);

  return { invoke, data, error, loading, traceId, reset };
}