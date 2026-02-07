import { useOnboarding } from '@/hooks/useOnboarding';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Award, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OnboardingBadgeProps {
  variant?: 'inline' | 'card';
  showProgress?: boolean;
  className?: string;
}

export const OnboardingBadge = ({ 
  variant = 'inline',
  showProgress = false,
  className 
}: OnboardingBadgeProps) => {
  const { t } = useTranslation();
  const { status, loading, isFullyCompleted } = useOnboarding();

  if (loading) return null;

  const steps = [
    status.welcome_completed,
    status.dashboard_tour_completed,
    status.analytics_tour_completed,
    status.crm_tour_completed,
    status.settings_tour_completed,
  ];

  const completedCount = steps.filter(Boolean).length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          isFullyCompleted 
            ? "bg-primary/10 border-primary/30" 
            : "bg-muted/50 border-border",
          className
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          isFullyCompleted 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        )}>
          {isFullyCompleted ? (
            <Award className="h-5 w-5" />
          ) : (
            <span className="text-sm font-bold">{progressPercentage}%</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium",
            isFullyCompleted && "text-primary"
          )}>
            {isFullyCompleted 
              ? t('onboarding.badge.completed', 'Onboarding Completo!')
              : t('onboarding.badge.inProgress', 'Onboarding em Progresso')
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {isFullyCompleted 
              ? t('onboarding.badge.completedDesc', 'Você dominou a plataforma!')
              : t('onboarding.badge.progressDesc', '{{current}} de {{total}} etapas', {
                  current: completedCount,
                  total: totalSteps
                })
            }
          </p>
        </div>

        {isFullyCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Inline badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={className}
          >
            <Badge 
              variant={isFullyCompleted ? "default" : "secondary"}
              className={cn(
                "gap-1 cursor-default",
                isFullyCompleted && "bg-primary hover:bg-primary"
              )}
            >
              {isFullyCompleted ? (
                <>
                  <Award className="h-3 w-3" />
                  <span>{t('onboarding.badge.master', 'Master')}</span>
                </>
              ) : (
                <>
                  <span>{progressPercentage}%</span>
                  {showProgress && (
                    <span className="text-xs opacity-70">
                      ({completedCount}/{totalSteps})
                    </span>
                  )}
                </>
              )}
            </Badge>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isFullyCompleted 
              ? t('onboarding.badge.completedTooltip', 'Você completou todos os tours!')
              : t('onboarding.badge.progressTooltip', 'Complete os tours para dominar a plataforma')
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
