import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { fetchLatestHealthMetrics } from '@/services/systemMonitorService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { HealthStatus } from '@/hooks/useSystemHealth';
import { QueryFallback } from './QueryFallback';

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  healthy: { icon: CheckCircle, color: 'text-success', label: 'Saudável' },
  warning: { icon: AlertTriangle, color: 'text-warning', label: 'Atenção' },
  critical: { icon: XCircle, color: 'text-destructive', label: 'Crítico' },
};

const getStatus = (score: number): HealthStatus => {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'warning';
  return 'critical';
};

const HealthPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['system-monitor-health'],
    queryFn: fetchLatestHealthMetrics,
    staleTime: 5 * 60 * 1000,
  });

  const runCheck = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('system-health-check', { body: { metrics: {} } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-monitor-health'] });
      toast({ title: 'Análise concluída', description: 'Scores recalculados com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Falha ao executar análise.', variant: 'destructive' });
    },
  });

  // Deduplicate by module
  const moduleMap = new Map<string, { module: string; score: number; status: string; details: Record<string, unknown> }>();
  for (const m of metrics ?? []) {
    if (!moduleMap.has(m.module)) {
      moduleMap.set(m.module, { module: m.module, score: m.score, status: m.status, details: m.details });
    }
  }
  const modules = Array.from(moduleMap.values());

  const weights: Record<string, number> = { ui: 0.15, security: 0.30, performance: 0.20, database: 0.25, integrations: 0.10 };
  const overallScore = modules.length > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.score * (weights[m.module] || 0.1), 0))
    : 0;

  const overallStatus = getStatus(overallScore);
  const StatusIcon = statusConfig[overallStatus]?.icon ?? Activity;

  return (
    <div className="space-y-4 p-4">
      <QueryFallback
        isLoading={isLoading}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
        loadingFallback={<Skeleton className="h-48 w-full" />}
      >
        <>
      {/* Score geral */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">{overallScore}</div>
          <div>
            <Badge variant={overallStatus === 'healthy' ? 'default' : overallStatus === 'warning' ? 'secondary' : 'destructive'} className="gap-1">
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig[overallStatus]?.label}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">Score geral do sistema</p>
          </div>
        </div>
        <Button onClick={() => runCheck.mutate()} disabled={runCheck.isPending} size="sm" variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${runCheck.isPending ? 'animate-spin' : ''}`} />
          Executar Análise
        </Button>
      </div>

      {/* Cards por módulo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {modules.map((mod) => {
          const s = getStatus(mod.score);
          const Icon = statusConfig[s]?.icon ?? Activity;
          return (
            <Card key={mod.module} className="border">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs uppercase text-muted-foreground">{mod.module}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${statusConfig[s]?.color}`} />
                  <span className="text-xl font-bold">{mod.score}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {modules.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma métrica registrada. Clique em "Executar Análise" para gerar o primeiro relatório.
        </p>
      )}
        </>
      </QueryFallback>
    </div>
  );
};

export default HealthPanel;
