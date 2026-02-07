import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  RotateCcw, 
  Sparkles,
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  PartyPopper,
  Link2,
  PenTool,
  FileCheck,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';

interface OnboardingProgressProps {
  variant?: 'card' | 'inline';
  collapsible?: boolean;
}

interface Step {
  key: string;
  label: string;
  completed: boolean;
  icon: React.ReactNode;
  category?: 'tour' | 'milestone';
}

const stepIcons = {
  welcome: <Sparkles className="h-4 w-4" />,
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  analytics: <BarChart3 className="h-4 w-4" />,
  crm: <Users className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  integrations: <Link2 className="h-4 w-4" />,
  quiz_editor: <PenTool className="h-4 w-4" />,
  first_quiz: <FileCheck className="h-4 w-4" />,
  first_lead: <UserPlus className="h-4 w-4" />,
};

export const OnboardingProgress = ({ 
  variant = 'card',
  collapsible = false 
}: OnboardingProgressProps) => {
  const { t } = useTranslation();
  const { status, loading, resetOnboarding, isFullyCompleted } = useOnboarding();
  const [isOpen, setIsOpen] = useState(true);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  const tourSteps: Step[] = [
    { 
      key: 'welcome', 
      label: t('onboarding.progress.steps.welcome', 'Boas-vindas'),
      completed: status.welcome_completed,
      icon: stepIcons.welcome,
      category: 'tour'
    },
    { 
      key: 'dashboard', 
      label: t('onboarding.progress.steps.dashboard', 'Tour do Dashboard'),
      completed: status.dashboard_tour_completed,
      icon: stepIcons.dashboard,
      category: 'tour'
    },
    { 
      key: 'analytics', 
      label: t('onboarding.progress.steps.analytics', 'Tour de Analytics'),
      completed: status.analytics_tour_completed,
      icon: stepIcons.analytics,
      category: 'tour'
    },
    { 
      key: 'crm', 
      label: t('onboarding.progress.steps.crm', 'Tour do CRM'),
      completed: status.crm_tour_completed,
      icon: stepIcons.crm,
      category: 'tour'
    },
    { 
      key: 'settings', 
      label: t('onboarding.progress.steps.settings', 'Tour de Configurações'),
      completed: status.settings_tour_completed,
      icon: stepIcons.settings,
      category: 'tour'
    },
    { 
      key: 'integrations', 
      label: t('onboarding.progress.steps.integrations', 'Tour de Integrações'),
      completed: status.integrations_tour_completed,
      icon: stepIcons.integrations,
      category: 'tour'
    },
    { 
      key: 'quiz_editor', 
      label: t('onboarding.progress.steps.quizEditor', 'Tour do Editor de Quiz'),
      completed: status.quiz_editor_tour_completed,
      icon: stepIcons.quiz_editor,
      category: 'tour'
    },
  ];

  const milestoneSteps: Step[] = [
    { 
      key: 'first_quiz', 
      label: t('onboarding.progress.milestones.firstQuiz', 'Criar primeiro quiz'),
      completed: status.first_quiz_created,
      icon: stepIcons.first_quiz,
      category: 'milestone'
    },
    { 
      key: 'first_lead', 
      label: t('onboarding.progress.milestones.firstLead', 'Capturar primeiro lead'),
      completed: status.first_lead_captured,
      icon: stepIcons.first_lead,
      category: 'milestone'
    },
  ];

  const allSteps = [...tourSteps, ...milestoneSteps];

  const completedCount = allSteps.filter(s => s.completed).length;
  const totalSteps = allSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  // Trigger confetti when fully completed
  useEffect(() => {
    if (isFullyCompleted && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isFullyCompleted, hasTriggeredConfetti]);

  // Hide if fully completed and collapsible
  if (loading) return null;
  if (isFullyCompleted && collapsible) return null;

  const handleReset = async () => {
    await resetOnboarding();
    setHasTriggeredConfetti(false);
  };

  const content = (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('onboarding.progress.completed', '{{current}} de {{total}} etapas', {
              current: completedCount,
              total: totalSteps
            })}
          </span>
          <span className="font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Tours checklist */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('onboarding.progress.tours', 'Tours')}
        </span>
        <ul className="space-y-1">
          <AnimatePresence>
            {tourSteps.map((step, index) => (
              <motion.li
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  step.completed 
                    ? "bg-primary/5 text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: step.completed ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </motion.div>
                <span className="flex items-center gap-2">
                  {step.icon}
                  <span className={cn(
                    "text-sm",
                    step.completed && "line-through opacity-70"
                  )}>
                    {step.label}
                  </span>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* Milestones checklist */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t('onboarding.progress.milestones.title', 'Conquistas')}
        </span>
        <ul className="space-y-1">
          <AnimatePresence>
            {milestoneSteps.map((step, index) => (
              <motion.li
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  step.completed 
                    ? "bg-accent/10 text-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: step.completed ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </motion.div>
                <span className="flex items-center gap-2">
                  {step.icon}
                  <span className={cn(
                    "text-sm",
                    step.completed && "line-through opacity-70"
                  )}>
                    {step.label}
                  </span>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {/* Celebration message */}
      {isFullyCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-primary"
        >
          <PartyPopper className="h-5 w-5" />
          <span className="text-sm font-medium">
            {t('onboarding.progress.celebrate', '🎉 Parabéns! Você completou o onboarding!')}
          </span>
        </motion.div>
      )}

      {/* Reset button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {t('onboarding.progress.restart', 'Reiniciar Tours')}
      </Button>
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {t('onboarding.progress.title', 'Seu Progresso')}
              </CardTitle>
              <CardDescription>
                {t('onboarding.progress.description', 'Complete os tours para conhecer a plataforma')}
              </CardDescription>
            </div>
          </div>
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? t('common.hide', 'Ocultar') : t('common.show', 'Mostrar')}
            </Button>
          )}
        </div>
      </CardHeader>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent>
              {content}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
