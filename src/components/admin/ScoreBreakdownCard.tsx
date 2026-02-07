import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ScoreBreakdown, HealthStatus } from "@/lib/healthScoreCalculator";

interface ScoreBreakdownCardProps {
  moduleName: string;
  score: number;
  status: HealthStatus;
  breakdown: ScoreBreakdown[];
}

const statusIcons = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle
};

const statusColors = {
  healthy: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  critical: 'text-red-600 dark:text-red-400'
};

export const ScoreBreakdownCard = ({ moduleName, score, status, breakdown }: ScoreBreakdownCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusIcons[status];

  const getProgressColor = (earned: number, max: number) => {
    const percentage = (earned / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number | string | boolean): string => {
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusColors[status]}`} />
            <CardTitle className="text-base">{moduleName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={statusColors[status]}
            >
              {score}/100
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-2">
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.criterion}</span>
                  <span className="font-medium">
                    {item.earnedPoints}/{item.maxPoints} pts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(item.earnedPoints / item.maxPoints) * 100} 
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {formatValue(item.value)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.threshold}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
