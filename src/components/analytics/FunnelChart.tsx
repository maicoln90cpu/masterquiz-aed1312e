import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, TrendingDown, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FunnelStep {
  stepNumber: number;
  label: string;
  count: number;
  questionId?: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
  loading?: boolean;
  /** Override completions count from quiz_analytics for consistency with metric cards */
  completionsOverride?: number;
}

export function FunnelChart({ data, loading = false, completionsOverride }: FunnelChartProps) {
  const { t } = useTranslation();

  const funnelData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const maxCount = Math.max(...data.map(d => d.count));
    
    return data.map((step, index) => {
      const prevCount = index > 0 ? data[index - 1].count : step.count;
      const dropOff = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100) : 0;
      const widthPercent = maxCount > 0 ? (step.count / maxCount * 100) : 100;
      
      return {
        ...step,
        dropOff: dropOff.toFixed(1),
        widthPercent: Math.max(widthPercent, 20), // Mínimo 20% para visualização
        retentionRate: maxCount > 0 ? (step.count / maxCount * 100).toFixed(1) : '100'
      };
    });
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            {t('analytics.funnel.title', 'Funil de Conversão')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (funnelData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            {t('analytics.funnel.title', 'Funil de Conversão')}
          </CardTitle>
          <CardDescription>
            {t('analytics.funnel.description', 'Visualize onde os visitantes abandonam o quiz')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('analytics.funnel.noData', 'Ainda não há dados de funil disponíveis')}</p>
            <p className="text-sm mt-2">
              {t('analytics.funnel.noDataHint', 'Os dados aparecerão quando visitantes responderem seus quizzes')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          {t('analytics.funnel.title', 'Funil de Conversão')}
        </CardTitle>
        <CardDescription>
          {t('analytics.funnel.description', 'Visualize onde os visitantes abandonam o quiz')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {funnelData.map((step, index) => (
            <div key={step.stepNumber} className="relative">
              {/* Barra do funil */}
              <div 
                className="relative mx-auto transition-all duration-500 ease-out"
                style={{ width: `${step.widthPercent}%` }}
              >
                <div 
                  className={`
                    h-14 rounded-lg flex items-center justify-between px-4
                    ${index === 0 ? 'bg-primary' : 'bg-primary/80'}
                    ${index === funnelData.length - 1 ? 'bg-green-500 dark:bg-green-600' : ''}
                  `}
                >
                  <div className="flex items-center gap-2 text-primary-foreground">
                    <span className="font-medium text-sm truncate max-w-[200px]">
                      {step.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-background/20 text-primary-foreground border-0">
                      <Users className="h-3 w-3 mr-1" />
                      {step.count.toLocaleString('pt-BR')}
                    </Badge>
                    <Badge variant="secondary" className="bg-background/20 text-primary-foreground border-0">
                      {step.retentionRate}%
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Indicador de drop-off entre etapas */}
              {index < funnelData.length - 1 && parseFloat(funnelData[index + 1].dropOff) > 0 && (
                <div className="flex items-center justify-center py-1 text-muted-foreground">
                  <ArrowDown className="h-4 w-4" />
                  <span className="text-xs ml-1 text-destructive font-medium">
                    -{funnelData[index + 1].dropOff}% {t('analytics.funnel.dropOff', 'abandonaram')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">
              {funnelData[0]?.count.toLocaleString('pt-BR') || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('analytics.funnel.started', 'Iniciaram')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              {funnelData[funnelData.length - 1]?.count.toLocaleString('pt-BR') || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('analytics.funnel.completed', 'Completaram')}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">
              {funnelData.length > 1 
                ? ((1 - (funnelData[funnelData.length - 1].count / funnelData[0].count)) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              {t('analytics.funnel.totalDropOff', 'Abandono total')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
