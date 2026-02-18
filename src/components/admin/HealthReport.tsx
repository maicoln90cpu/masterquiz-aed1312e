import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  History,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSystemHealth, type HealthReport as HealthReportType, type HistoricalMetric } from "@/hooks/useSystemHealth";
import { HealthScoreGauge } from "./HealthScoreGauge";
import { MaintenanceSchedule } from "./MaintenanceSchedule";
import { getMaintenanceSchedule, getStatusLabel, getStatusEmoji, type ModuleScore } from "@/lib/healthScoreCalculator";

interface MetricComparison {
  module: string;
  current: number;
  previous: number;
  diff: number;
  trend: 'up' | 'down' | 'stable';
}

export const HealthReport = () => {
  const { healthReport, historicalData, isLoading } = useSystemHealth();

  if (isLoading || !healthReport) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Execute uma análise de saúde para gerar o relatório.
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const reportDate = format(now, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  // Calculate comparisons with last week
  const getComparisons = (): MetricComparison[] => {
    if (historicalData.length < 2) return [];

    const today = historicalData[historicalData.length - 1];
    const weekAgo = historicalData.length >= 7 
      ? historicalData[historicalData.length - 7] 
      : historicalData[0];

    const modules = ['ui', 'security', 'performance', 'database', 'integrations'] as const;
    
    return modules.map(module => {
      const current = today?.[module] ?? 0;
      const previous = weekAgo?.[module] ?? 0;
      const diff = current - previous;
      
      return {
        module,
        current,
        previous,
        diff,
        trend: diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable'
      };
    });
  };

  const comparisons = getComparisons();

  // Get recent incidents (modules that went critical)
  const getIncidents = () => {
    const incidents: Array<{ module: string; date: string; type: string }> = [];
    
    // Check current critical modules
    healthReport.modules.forEach(mod => {
      if (mod.status === 'critical') {
        incidents.push({
          module: mod.module,
          date: format(new Date(healthReport.timestamp), "dd/MM/yyyy HH:mm"),
          type: 'Crítico'
        });
      }
    });

    // Check historical data for drops
    if (historicalData.length >= 2) {
      for (let i = 1; i < historicalData.length; i++) {
        const prev = historicalData[i - 1];
        const curr = historicalData[i];
        if (!prev || !curr) continue;
        
        ['ui', 'security', 'performance', 'database', 'integrations'].forEach(module => {
          const prevScore = (prev[module as keyof HistoricalMetric] as number) ?? 0;
          const currScore = (curr[module as keyof HistoricalMetric] as number) ?? 0;
          
          if (prevScore >= 60 && currScore < 60) {
            incidents.push({
              module,
              date: curr.date,
              type: 'Queda para Crítico'
            });
          }
        });
      }
    }

    return incidents.slice(0, 5); // Last 5 incidents
  };

  const incidents = getIncidents();

  // Generate maintenance schedule from current scores
  const moduleScores: Record<string, ModuleScore> = {};
  (healthReport.modules || []).forEach(mod => {
    if (!mod) return;
    moduleScores[mod.module] = {
      score: mod.score,
      status: mod.status,
      breakdown: []
    };
  });
  const maintenanceSchedule = getMaintenanceSchedule(moduleScores);

  // Export report as text
  const handleExportReport = () => {
    const reportText = `
RELATÓRIO DE SAÚDE DO SISTEMA
Gerado em: ${reportDate}
=====================================

RESUMO EXECUTIVO
-----------------
Score Geral: ${healthReport.overallScore}/100
Status: ${getStatusEmoji(healthReport.overallStatus)} ${getStatusLabel(healthReport.overallStatus)}

SCORES POR MÓDULO
-----------------
${healthReport.modules.map(m => `${m.module.toUpperCase()}: ${m.score}/100 (${getStatusLabel(m.status)})`).join('\n')}

${comparisons.length > 0 ? `
COMPARATIVO (Hoje vs Semana Passada)
------------------------------------
${comparisons.map(c => `${c.module.toUpperCase()}: ${c.current} vs ${c.previous} (${c.diff > 0 ? '+' : ''}${c.diff})`).join('\n')}
` : ''}

${incidents.length > 0 ? `
INCIDENTES RECENTES
-------------------
${incidents.map(i => `[${i.date}] ${i.module.toUpperCase()}: ${i.type}`).join('\n')}
` : ''}

RECOMENDAÇÕES
-------------
${healthReport.recommendations.map(r => `[${r.priority.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}

CRONOGRAMA DE MANUTENÇÃO
------------------------
${maintenanceSchedule.map(m => `[${m.deadline}] ${m.module.toUpperCase()}: ${m.action}`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-saude-${format(now, 'yyyy-MM-dd-HHmm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const moduleNames: Record<string, string> = {
    ui: 'Interface',
    security: 'Segurança',
    performance: 'Performance',
    database: 'Banco de Dados',
    integrations: 'Integrações'
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Relatório Consolidado</CardTitle>
                <CardDescription>
                  Gerado em {reportDate}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleExportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthScoreGauge 
              score={healthReport.overallScore} 
              status={healthReport.overallStatus}
              size="lg"
            />
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {healthReport.modules.map(mod => (
                  <div 
                    key={mod.module}
                    className={`p-3 rounded-lg border text-center ${
                      mod.status === 'healthy' 
                        ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                        : mod.status === 'warning'
                          ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className={`text-lg font-bold ${
                      mod.status === 'healthy' 
                        ? 'text-green-600 dark:text-green-400' 
                        : mod.status === 'warning'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}>
                      {mod.score}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {moduleNames[mod.module] || mod.module}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm">
                  {healthReport.overallStatus === 'healthy' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-500" />
                      O sistema está operando normalmente. Todos os módulos estão dentro dos parâmetros esperados.
                    </>
                  )}
                  {healthReport.overallStatus === 'warning' && (
                    <>
                      <AlertCircle className="h-4 w-4 inline mr-2 text-yellow-500" />
                      O sistema requer atenção. {healthReport.modules.filter(m => m.status !== 'healthy').length} módulo(s) precisam de revisão.
                    </>
                  )}
                  {healthReport.overallStatus === 'critical' && (
                    <>
                      <AlertCircle className="h-4 w-4 inline mr-2 text-red-500" />
                      O sistema está em estado crítico. Ação imediata necessária em {healthReport.modules.filter(m => m.status === 'critical').length} módulo(s).
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparative Metrics */}
      {comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Métricas Comparativas
            </CardTitle>
            <CardDescription>
              Comparação dos scores de hoje com a semana passada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {comparisons.map(comp => (
                <div 
                  key={comp.module}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {moduleNames[comp.module] || comp.module}
                    </span>
                    {getTrendIcon(comp.trend)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{comp.current}</span>
                    <span className="text-sm text-muted-foreground">
                      vs {comp.previous}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${
                    comp.diff > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : comp.diff < 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-muted-foreground'
                  }`}>
                    {comp.diff > 0 ? '+' : ''}{comp.diff} pontos
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incident History */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Histórico de Incidentes
            </CardTitle>
            <CardDescription>
              Eventos críticos recentes detectados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.map((incident, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                >
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {moduleNames[incident.module] || incident.module.toUpperCase()}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {incident.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {incident.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No incidents */}
      {incidents.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem Incidentes Recentes</h3>
              <p className="text-muted-foreground">
                Nenhum incidente crítico foi detectado no período analisado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {healthReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Próximas Ações Recomendadas
            </CardTitle>
            <CardDescription>
              Ações priorizadas para melhorar a saúde do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthReport.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                    rec.priority === 'high' 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' 
                      : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400'
                        : 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{rec.title}</span>
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Maintenance Schedule */}
      <MaintenanceSchedule recommendations={maintenanceSchedule} />
    </div>
  );
};
