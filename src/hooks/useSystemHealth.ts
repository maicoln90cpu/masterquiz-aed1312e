import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invokeResilient } from '@/lib/resilientFetch';
import { useWebVitals } from './useWebVitals';
import { useQueryPerformance } from './useQueryPerformance';
import { useCSPMonitor } from './useCSPMonitor';

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface ModuleHealth {
  module: string;
  status: HealthStatus;
  score: number;
  details: Record<string, unknown>;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  module: string;
  title: string;
  description: string;
}

export interface HealthReport {
  overallStatus: HealthStatus;
  overallScore: number;
  modules: ModuleHealth[];
  recommendations: Recommendation[];
  timestamp: string;
}

export interface HistoricalMetric {
  date: string;
  ui: number;
  security: number;
  performance: number;
  database: number;
  integrations: number;
  overall: number;
}

export const useSystemHealth = () => {
  const queryClient = useQueryClient();
  const { getSlowestQueries, getMetrics } = useQueryPerformance();
  const { violations: cspViolations } = useCSPMonitor();

  // Fetch latest health report
  const { data: healthReport, isLoading, error, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<HealthReport | null> => {
      // Try to get the latest metrics from database first
      const { data: latestMetrics, error: dbError } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (dbError) {
        logger.error('[useSystemHealth] DB error:', dbError);
        return null;
      }

      if (latestMetrics && latestMetrics.length > 0) {
        // Group by module and get latest for each
        const moduleMap = new Map<string, ModuleHealth>();
        const validStatuses: HealthStatus[] = ['healthy', 'warning', 'critical'];
        for (const metric of latestMetrics) {
          if (!moduleMap.has(metric.module)) {
            const rawStatus = metric.status as string;
            moduleMap.set(metric.module, {
              module: metric.module,
              status: validStatuses.includes(rawStatus as HealthStatus) ? (rawStatus as HealthStatus) : 'warning',
              score: metric.score ?? 0,
              details: (metric.details as Record<string, unknown>) ?? {}
            });
          }
        }

        const modules = Array.from(moduleMap.values());
        const weights = { ui: 0.15, security: 0.30, performance: 0.20, database: 0.25, integrations: 0.10 };
        const overallScore = Math.round(
          modules.reduce((sum, mod) => {
            const weight = weights[mod.module as keyof typeof weights] || 0.1;
            return sum + mod.score * weight;
          }, 0)
        );

        const getStatus = (score: number): HealthStatus => {
          if (score >= 85) return 'healthy';
          if (score >= 60) return 'warning';
          return 'critical';
        };

        return {
          overallStatus: getStatus(overallScore),
          overallScore,
          modules,
          recommendations: generateLocalRecommendations(modules),
          timestamp: latestMetrics[0].created_at
        };
      }

      return null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch historical metrics (last 7 days)
  const { data: historicalData } = useQuery({
    queryKey: ['system-health-history'],
    queryFn: async (): Promise<HistoricalMetric[]> => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('module, score, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      // Group by date and calculate daily averages
      const dailyData = new Map<string, { [key: string]: number[] }>();
      
      for (const metric of data) {
        const date = new Date(metric.created_at).toISOString().split('T')[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, { ui: [], security: [], performance: [], database: [], integrations: [] });
        }
        const dayData = dailyData.get(date)!;
        if (dayData[metric.module]) {
          dayData[metric.module].push(metric.score);
        }
      }

      const result: HistoricalMetric[] = [];
      const weights = { ui: 0.15, security: 0.30, performance: 0.20, database: 0.25, integrations: 0.10 };

      dailyData.forEach((scores, date) => {
        const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        const uiScore = avg(scores.ui);
        const securityScore = avg(scores.security);
        const performanceScore = avg(scores.performance);
        const databaseScore = avg(scores.database);
        const integrationsScore = avg(scores.integrations);

        const overall = Math.round(
          uiScore * weights.ui +
          securityScore * weights.security +
          performanceScore * weights.performance +
          databaseScore * weights.database +
          integrationsScore * weights.integrations
        );

        result.push({
          date,
          ui: uiScore,
          security: securityScore,
          performance: performanceScore,
          database: databaseScore,
          integrations: integrationsScore,
          overall
        });
      });

      return result;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Run health check mutation
  const runHealthCheck = useMutation({
    mutationFn: async (): Promise<HealthReport> => {
      // Collect client-side metrics
      const slowQueries = getSlowestQueries(5);
      const allMetrics = getMetrics();
      const avgQueryTime = allMetrics.length > 0
        ? allMetrics.reduce((sum, m) => sum + m.duration, 0) / allMetrics.length
        : 0;

      // Get memory usage if available
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        memoryUsage = Math.round(memory.usedJSHeapSize / (1024 * 1024));
      }

      const clientMetrics = {
        cspViolations: cspViolations.length,
        slowQueries,
        avgQueryTime,
        memoryUsage,
        // Web Vitals would be collected separately
      };

      // 🛡️ P15: timeout 15s + 3 retries com backoff + circuit breaker
      const { data, error } = await invokeResilient<HealthReport>(
        'system-health-check',
        { metrics: clientMetrics },
      );

      if (error) {
        throw new Error(error.message || 'Health check failed');
      }

      return data as HealthReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      queryClient.invalidateQueries({ queryKey: ['system-health-history'] });
    }
  });

  return {
    healthReport,
    historicalData: historicalData || [],
    isLoading,
    error,
    refetch,
    runHealthCheck: runHealthCheck.mutate,
    isRunningCheck: runHealthCheck.isPending
  };
};

// Generate recommendations locally based on module health
function generateLocalRecommendations(modules: ModuleHealth[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const mod of modules) {
    if (mod.status === 'critical') {
      recommendations.push({
        priority: 'high',
        module: mod.module,
        title: `${mod.module.toUpperCase()} requer atenção imediata`,
        description: `Score: ${mod.score}/100. Revise os detalhes e tome ação corretiva imediatamente.`
      });
    } else if (mod.status === 'warning') {
      recommendations.push({
        priority: 'medium',
        module: mod.module,
        title: `${mod.module.toUpperCase()} precisa de melhorias`,
        description: `Score: ${mod.score}/100. Agende manutenção nos próximos 3 dias.`
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}
