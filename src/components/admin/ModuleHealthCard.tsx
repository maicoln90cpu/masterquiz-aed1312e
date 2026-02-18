import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Shield, 
  Zap, 
  Database, 
  Link2,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import type { ModuleHealth, HealthStatus } from "@/hooks/useSystemHealth";

interface ModuleHealthCardProps {
  module: ModuleHealth;
}

const moduleIcons: Record<string, React.ElementType> = {
  ui: Monitor,
  security: Shield,
  performance: Zap,
  database: Database,
  integrations: Link2
};

const moduleNames: Record<string, string> = {
  ui: 'Interface',
  security: 'Segurança',
  performance: 'Performance',
  database: 'Banco de Dados',
  integrations: 'Integrações'
};

const statusConfig: Record<HealthStatus, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  healthy: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    label: 'Saudável'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    label: 'Atenção'
  },
  critical: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    label: 'Crítico'
  }
};

export const ModuleHealthCard = ({ module }: ModuleHealthCardProps) => {
  if (!module) return null;
  const Icon = moduleIcons[module.module] || Monitor;
  const config = statusConfig[module.status] || statusConfig.warning;
  const StatusIcon = config.icon;
  const moduleName = moduleNames[module.module] || module.module;

  // Format detail values for display
  const formatDetailValue = (key: string, value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number') {
      if (key.includes('latency') || key.includes('time') || key.includes('Time')) {
        return `${value.toFixed(0)}ms`;
      }
      if (key.includes('size') || key.includes('Size')) {
        return `${value.toFixed(0)}KB`;
      }
      return value.toString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Get key details to display (max 4)
  const keyDetails = Object.entries(module.details || {})
    .filter(([key]) => !key.includes('Error') && !key.includes('note'))
    .slice(0, 4);

  return (
    <Card className={`transition-all duration-200 border ${config.bgColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${module.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/50' : module.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <CardTitle className="text-base font-medium">{moduleName}</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={`${config.color} border-current`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Score bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Score</span>
            <span className={`font-semibold ${config.color}`}>{module.score}/100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                module.status === 'healthy' 
                  ? 'bg-green-500' 
                  : module.status === 'warning' 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${module.score}%` }}
            />
          </div>
        </div>

        {/* Key details */}
        {keyDetails.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {keyDetails.map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-medium truncate">
                  {formatDetailValue(key, value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
