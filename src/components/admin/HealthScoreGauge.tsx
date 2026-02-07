import { useMemo } from "react";
import type { HealthStatus } from "@/hooks/useSystemHealth";

interface HealthScoreGaugeProps {
  score: number;
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const HealthScoreGauge = ({ score, status, size = 'md' }: HealthScoreGaugeProps) => {
  const dimensions = {
    sm: { size: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { size: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { size: 160, strokeWidth: 10, fontSize: 'text-4xl' }
  };

  const { size: svgSize, strokeWidth, fontSize } = dimensions[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const statusConfig = useMemo(() => ({
    healthy: {
      color: 'stroke-green-500',
      bgColor: 'stroke-green-100 dark:stroke-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      label: 'Saudável',
      emoji: '🟢'
    },
    warning: {
      color: 'stroke-yellow-500',
      bgColor: 'stroke-yellow-100 dark:stroke-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      label: 'Atenção',
      emoji: '🟡'
    },
    critical: {
      color: 'stroke-red-500',
      bgColor: 'stroke-red-100 dark:stroke-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
      label: 'Crítico',
      emoji: '🔴'
    }
  }), []);

  const config = statusConfig[status];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={config.bgColor}
          />
          {/* Progress circle */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${config.color} transition-all duration-1000 ease-out`}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold ${config.textColor}`}>
            {score}
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground">/ 100</span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-sm">{config.emoji}</span>
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
};
