/**
 * Performance capture — logs slow Supabase operations to performance_logs.
 */
import { supabase } from '@/integrations/supabase/client';

const SLOW_THRESHOLD_MS = 1000;
const SAMPLING_RATE = 5;
let counter = 0;

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
      supabase.from('performance_logs').insert([{
        operation_name: operationName,
        operation_type: operationType,
        duration_ms: duration,
        is_slow: isSlow,
        metadata: { sampled: !isSlow },
      }]).then(() => {});
    }

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    supabase.from('performance_logs').insert([{
      operation_name: operationName,
      operation_type: operationType,
      duration_ms: duration,
      is_slow: true,
      metadata: { error: true, message: (error as Error).message?.slice(0, 200) },
    }]).then(() => {});
    throw error;
  }
}
