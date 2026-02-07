import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import type { MaintenanceRecommendation } from "@/lib/healthScoreCalculator";

interface MaintenanceScheduleProps {
  recommendations: MaintenanceRecommendation[];
}

const priorityConfig = {
  immediate: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    badgeVariant: 'destructive' as const,
    label: 'Imediato'
  },
  '3days': {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    badgeVariant: 'default' as const,
    label: '3 Dias'
  },
  monthly: {
    icon: Calendar,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    badgeVariant: 'secondary' as const,
    label: 'Mensal'
  }
};

const moduleNames: Record<string, string> = {
  ui: 'Interface',
  security: 'Segurança',
  performance: 'Performance',
  database: 'Banco de Dados',
  integrations: 'Integrações'
};

export const MaintenanceSchedule = ({ recommendations }: MaintenanceScheduleProps) => {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Tudo em Dia</h3>
            <p className="text-muted-foreground">
              Nenhuma manutenção programada necessária no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const immediateCount = recommendations.filter(r => r.priority === 'immediate').length;
  const upcomingCount = recommendations.filter(r => r.priority === '3days').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cronograma de Manutenção</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {immediateCount > 0 && (
              <Badge variant="destructive">{immediateCount} imediato</Badge>
            )}
            {upcomingCount > 0 && (
              <Badge variant="default">{upcomingCount} próximos</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const config = priorityConfig[rec.priority];
            const Icon = config.icon;
            
            return (
              <div 
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor}`}
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {moduleNames[rec.module] || rec.module.toUpperCase()}
                    </span>
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rec.action}
                  </p>
                  <p className={`text-xs mt-1 ${config.color}`}>
                    Prazo: {rec.deadline}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
