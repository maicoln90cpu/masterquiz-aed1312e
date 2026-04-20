import { logger } from '@/lib/logger';
import { useCallback, useRef } from 'react';

interface QueryMetric {
  queryName: string;
  duration: number;
  timestamp: number;
  status: 'success' | 'error';
}

export const useQueryPerformance = () => {
  const metricsRef = useRef<QueryMetric[]>([]);

  const measureQuery = useCallback(async <T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      metricsRef.current.push({
        queryName,
        duration,
        timestamp: Date.now(),
        status: 'success'
      });

      // Log queries lentas (> 1s)
      if (duration > 1000) {
        logger.warn(`⚠️ Query lenta detectada: ${queryName} (${duration.toFixed(2)}ms)`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      metricsRef.current.push({
        queryName,
        duration,
        timestamp: Date.now(),
        status: 'error'
      });
      
      throw error;
    }
  }, []);

  const getMetrics = useCallback(() => {
    return metricsRef.current;
  }, []);

  const getAverageTime = useCallback((queryName: string) => {
    const queryMetrics = metricsRef.current.filter(m => m.queryName === queryName);
    if (queryMetrics.length === 0) return 0;
    
    const total = queryMetrics.reduce((acc, m) => acc + m.duration, 0);
    return total / queryMetrics.length;
  }, []);

  const getSlowestQueries = useCallback((limit = 5) => {
    const grouped = metricsRef.current.reduce((acc, metric) => {
      if (!acc[metric.queryName]) {
        acc[metric.queryName] = [];
      }
      acc[metric.queryName].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped)
      .map(([queryName, durations]) => ({
        queryName,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        maxDuration: Math.max(...durations),
        count: durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }, []);

  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
  }, []);

  return {
    measureQuery,
    getMetrics,
    getAverageTime,
    getSlowestQueries,
    clearMetrics
  };
};
