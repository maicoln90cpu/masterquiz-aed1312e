/**
 * Performance capture — logs slow Supabase operations to performance_logs.
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const SLOW_THRESHOLD_MS = 1000;
// Temporariamente 1/2 (em vez de 1/5) por 48h para validar que está gravando.
const SAMPLING_RATE = 2;
let counter = 0;

function persistLog(payload: {
  operation_name: string;
  operation_type: string;
  duration_ms: number;
  is_slow: boolean;
  metadata: Record<string, unknown>;
}) {
  supabase
    .from('performance_logs')
    .insert([payload])
    .then(({ error }) => {
      if (error) {
        logger.warn('[performanceCapture] insert failed', {
          operation: payload.operation_name,
          message: error.message,
          code: error.code,
        });
      }
    });
}

export async function trackOperation<T>(
  operationName: string,
  operationType: 'query' | 'mutation' | 'rpc' | 'edge_function',
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    const isSlow = duration >= SLOW_THRESHOLD_MS;

    counter++;
    if (isSlow || counter % SAMPLING_RATE === 0) {
      persistLog({
        operation_name: operationName,
        operation_type: operationType,
        duration_ms: duration,
        is_slow: isSlow,
        metadata: { sampled: !isSlow },
      });
    }

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    persistLog({
      operation_name: operationName,
      operation_type: operationType,
      duration_ms: duration,
      is_slow: true,
      metadata: { error: true, message: (error as Error).message?.slice(0, 200) },
    });
    throw error;
  }
}
