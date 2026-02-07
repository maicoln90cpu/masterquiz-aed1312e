import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { ModuleHealthCard } from "./ModuleHealthCard";
import { HealthScoreGauge } from "./HealthScoreGauge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const SystemHealthDashboard = () => {
  const { 
    healthReport, 
    historicalData, 
    isLoading, 
    runHealthCheck, 
    isRunningCheck 
  } = useSystemHealth();

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return timestamp;
    }
  };

  // Calculate trend (comparing latest to previous)
  const getTrend = () => {
    if (historicalData.length < 2) return null;
    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    const diff = latest.overall - previous.overall;
    return { diff, isPositive: diff > 0 };
  };

  const trend = getTrend();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with overall status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Saúde do Sistema</CardTitle>
                <CardDescription>
                  Monitoramento em tempo real de todos os módulos
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => runHealthCheck()} 
              disabled={isRunningCheck}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunningCheck ? 'animate-spin' : ''}`} />
              {isRunningCheck ? 'Analisando...' : 'Executar Análise'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {healthReport ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Gauge */}
              <HealthScoreGauge 
                score={healthReport.overallScore} 
                status={healthReport.overallStatus}
                size="lg"
              />

              {/* Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {healthReport.modules.filter(m => m.status === 'healthy').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Saudáveis</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {healthReport.modules.filter(m => m.status === 'warning').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Atenção</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {healthReport.modules.filter(m => m.status === 'critical').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Críticos</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  {trend ? (
                    <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {trend.isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      {trend.isPositive ? '+' : ''}{trend.diff}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                  )}
                  <div className="text-sm text-muted-foreground">Tendência</div>
                </div>
              </div>

              {/* Last check time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Última análise: {formatTimestamp(healthReport.timestamp)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma análise de saúde disponível ainda.
              </p>
              <Button onClick={() => runHealthCheck()} disabled={isRunningCheck}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRunningCheck ? 'animate-spin' : ''}`} />
                Executar Primeira Análise
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {healthReport && (
        <>
          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {healthReport.modules.map((module) => (
              <ModuleHealthCard key={module.module} module={module} />
            ))}
          </div>

          {/* Recommendations */}
          {healthReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Recomendações
                </CardTitle>
                <CardDescription>
                  Ações sugeridas para melhorar a saúde do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthReport.recommendations.map((rec, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Badge 
                        variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rec.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.module.toUpperCase()}
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

          {/* No recommendations */}
          {healthReport.recommendations.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Sistema Saudável</h3>
                  <p className="text-muted-foreground">
                    Nenhuma ação imediata necessária. Continue monitorando regularmente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historical Chart */}
          {historicalData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Saúde (7 dias)</CardTitle>
                <CardDescription>
                  Evolução do score de saúde por módulo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        className="text-xs"
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        className="text-xs"
                      />
                      <Tooltip 
                        labelFormatter={(label) => `Data: ${formatDate(label as string)}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="overall" 
                        name="Geral"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="security" 
                        name="Segurança"
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="database" 
                        name="Database"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        name="Performance"
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
