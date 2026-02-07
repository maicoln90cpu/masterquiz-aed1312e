import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Clock } from "lucide-react";

interface QueryMetric {
  queryName: string;
  avgDuration: number;
  maxDuration: number;
  count: number;
}

interface PerformanceMetricsProps {
  slowestQueries: QueryMetric[];
  totalQueries: number;
}

export const PerformanceMetrics = ({ slowestQueries, totalQueries }: PerformanceMetricsProps) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceBadge = (duration: number) => {
    if (duration < 500) {
      return <Badge variant="default" className="bg-green-500">Rápido</Badge>;
    }
    if (duration < 1000) {
      return <Badge variant="default" className="bg-yellow-500">Moderado</Badge>;
    }
    return <Badge variant="destructive">Lento</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Performance do Sistema
        </CardTitle>
        <CardDescription>
          Monitoramento de queries em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Total de Queries</p>
            <p className="text-2xl font-bold">{totalQueries}</p>
          </div>
        </div>

        {slowestQueries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Queries Mais Lentas
            </h4>
            {slowestQueries.map((query, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{query.queryName}</span>
                  {getPerformanceBadge(query.avgDuration)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Média:</span> {formatDuration(query.avgDuration)}
                  </div>
                  <div>
                    <span className="font-medium">Máximo:</span> {formatDuration(query.maxDuration)}
                  </div>
                  <div>
                    <span className="font-medium">Execuções:</span> {query.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {slowestQueries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma query executada ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
};
