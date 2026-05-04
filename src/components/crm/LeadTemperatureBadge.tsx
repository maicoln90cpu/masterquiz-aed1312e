import { Badge } from '@/components/ui/badge';
import { Flame, ThermometerSun, Snowflake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LeadTemperature } from '@/lib/leadTemperature';
import { cn } from '@/lib/utils';

interface LeadTemperatureBadgeProps {
  temperature: LeadTemperature;
  compact?: boolean;
  className?: string;
  /** Score 0–100 (opcional). Quando fornecido, aparece no tooltip. */
  score?: number | null;
}

const config: Record<LeadTemperature, { i18nKey: string; icon: typeof Flame; classes: string }> = {
  hot: {
    i18nKey: 'crm.temperature.hot',
    icon: Flame,
    classes: 'bg-green-500/15 text-green-700 border-green-500/40 dark:text-green-400',
  },
  warm: {
    i18nKey: 'crm.temperature.warm',
    icon: ThermometerSun,
    classes: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/40 dark:text-yellow-400',
  },
  cold: {
    i18nKey: 'crm.temperature.cold',
    icon: Snowflake,
    classes: 'bg-muted text-muted-foreground border-border',
  },
};

export const LeadTemperatureBadge = ({ temperature, compact, className, score }: LeadTemperatureBadgeProps) => {
  const { t } = useTranslation();
  const { i18nKey, icon: Icon, classes } = config[temperature];
  const label = t(i18nKey);
  const tooltip =
    typeof score === 'number' && Number.isFinite(score) ? `${label} — score ${score}/100` : label;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 text-xs font-medium', classes, className)}
      aria-label={tooltip}
      title={tooltip}
    >
      <Icon className="h-3 w-3" />
      {!compact && <span>{label}</span>}
    </Badge>
  );
};
