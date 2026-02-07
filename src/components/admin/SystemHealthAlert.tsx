import { AlertTriangle, XCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSystemHealth } from "@/hooks/useSystemHealth";

interface SystemHealthAlertProps {
  onViewDetails?: () => void;
}

export const SystemHealthAlert = ({ onViewDetails }: SystemHealthAlertProps) => {
  const { healthReport, isLoading } = useSystemHealth();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when status changes to critical
  useEffect(() => {
    if (healthReport?.overallStatus === 'critical') {
      setDismissed(false);
    }
  }, [healthReport?.overallStatus]);

  if (isLoading || !healthReport || dismissed) return null;

  const hasCriticalModule = healthReport.modules.some(m => m.status === 'critical');
  const isLowScore = healthReport.overallScore < 60;

  if (!hasCriticalModule && !isLowScore) return null;

  const criticalModules = healthReport.modules
    .filter(m => m.status === 'critical')
    .map(m => m.module);

  const isCritical = hasCriticalModule || healthReport.overallScore < 40;

  return (
    <Alert 
      variant="destructive" 
      className={`mb-4 ${isCritical ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isCritical ? (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          )}
          <div>
            <AlertTitle className={isCritical ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}>
              {isCritical ? 'Sistema em Estado Crítico' : 'Atenção Necessária'}
            </AlertTitle>
            <AlertDescription className={isCritical ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}>
              {hasCriticalModule && (
                <span>
                  {criticalModules.length === 1 
                    ? `O módulo ${criticalModules[0].toUpperCase()} requer atenção imediata.`
                    : `Os módulos ${criticalModules.map(m => m.toUpperCase()).join(', ')} requerem atenção imediata.`
                  }
                </span>
              )}
              {isLowScore && !hasCriticalModule && (
                <span>
                  Score geral do sistema: {healthReport.overallScore}/100. Revise as recomendações.
                </span>
              )}
              {onViewDetails && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className={`ml-2 p-0 h-auto ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}
                  onClick={onViewDetails}
                >
                  Ver detalhes →
                </Button>
              )}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};
