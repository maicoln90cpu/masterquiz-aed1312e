import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Circle, 
  FileText, 
  HelpCircle, 
  Palette, 
  UserCheck, 
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizProgressIndicatorProps {
  title: string;
  description: string;
  questions: Array<{
    question_text?: string;
    blocks?: any[];
    options?: any[];
  }>;
  template: string;
  collectName: boolean;
  collectEmail: boolean;
  collectWhatsapp: boolean;
  currentStep: number;
  quizId: string | null;
  compact?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  icon: React.ReactNode;
  step: number;
}

export const QuizProgressIndicator = ({
  title,
  description,
  questions,
  template,
  collectName,
  collectEmail,
  collectWhatsapp,
  currentStep,
  quizId,
  compact = false
}: QuizProgressIndicatorProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(!compact);

  const checklistItems = useMemo<ChecklistItem[]>(() => {
    // Check if at least one question has content
    const hasConfiguredQuestions = questions.some(q => {
      const hasQuestionText = q.question_text && q.question_text.trim().length > 0 && q.question_text !== 'Nova Pergunta';
      const hasBlocks = q.blocks && q.blocks.length > 0;
      const hasOptions = q.options && q.options.length > 0;
      return hasQuestionText || hasBlocks || hasOptions;
    });

    // Check if form has any field enabled
    const hasFormConfig = collectName || collectEmail || collectWhatsapp;

    return [
      {
        id: 'title',
        label: t('progress.hasTitle', 'Título definido'),
        completed: title.trim().length > 0,
        icon: <FileText className="h-4 w-4" />,
        step: 3
      },
      {
        id: 'questions',
        label: t('progress.hasQuestions', 'Perguntas configuradas'),
        completed: hasConfiguredQuestions,
        icon: <HelpCircle className="h-4 w-4" />,
        step: 2
      },
      {
        id: 'template',
        label: t('progress.hasTemplate', 'Aparência personalizada'),
        completed: template !== 'moderno' || !!description.trim(),
        icon: <Palette className="h-4 w-4" />,
        step: 3
      },
      {
        id: 'form',
        label: t('progress.hasForm', 'Formulário de captura'),
        completed: hasFormConfig,
        icon: <UserCheck className="h-4 w-4" />,
        step: 4
      },
      {
        id: 'published',
        label: t('progress.isPublished', 'Quiz publicado'),
        completed: !!quizId,
        icon: <Trophy className="h-4 w-4" />,
        step: 5
      }
    ];
  }, [title, description, questions, template, collectName, collectEmail, collectWhatsapp, quizId, t]);

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  const getProgressColor = () => {
    if (progressPercentage < 40) return 'text-destructive';
    if (progressPercentage < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressLabel = () => {
    if (progressPercentage < 40) return t('progress.justStarting', 'Iniciando...');
    if (progressPercentage < 60) return t('progress.inProgress', 'Em progresso');
    if (progressPercentage < 80) return t('progress.almostThere', 'Quase lá!');
    if (progressPercentage < 100) return t('progress.finishing', 'Finalizando');
    return t('progress.complete', 'Completo!');
  };

  if (compact) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="p-3 bg-card/80 backdrop-blur-sm border-border/50">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className={getProgressColor()}
                      initial={{ strokeDasharray: '0 100' }}
                      animate={{ strokeDasharray: `${progressPercentage} 100` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", getProgressColor())}>
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{getProgressLabel()}</p>
                  <p className="text-xs text-muted-foreground">
                    {completedCount} de {totalCount} etapas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isExpanded && (
                  <div className="flex -space-x-1">
                    {checklistItems.slice(0, 4).map((item) => (
                      <div 
                        key={item.id}
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-background",
                          item.completed ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.completed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t space-y-2"
                >
                  {checklistItems.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 text-sm py-1 px-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50",
                        currentStep === item.step && "bg-primary/10",
                        item.completed ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={cn("flex-1", item.completed && "line-through opacity-70")}>
                        {item.label}
                      </span>
                      {currentStep === item.step && (
                        <Badge variant="secondary" className="text-xs h-5">
                          Atual
                        </Badge>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Header with circular progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className={getProgressColor()}
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray: `${progressPercentage} 100` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </svg>
            <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", getProgressColor())}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div>
            <p className="font-semibold">{getProgressLabel()}</p>
            <p className="text-sm text-muted-foreground">
              {completedCount} de {totalCount} etapas concluídas
            </p>
          </div>
        </div>
        
        {progressPercentage === 100 && (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <Trophy className="h-3 w-3 mr-1" />
            Pronto!
          </Badge>
        )}
      </div>

      {/* Linear progress */}
      <Progress value={progressPercentage} className="h-2" />

      {/* Checklist */}
      <div className="space-y-2">
        {checklistItems.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "flex items-center gap-3 text-sm py-2 px-3 rounded-lg transition-all",
              currentStep === item.step && "bg-primary/10 border border-primary/20",
              item.completed ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex items-center gap-2 flex-1">
              <span className={cn(item.completed && "line-through opacity-70")}>
                {item.label}
              </span>
            </div>
            {currentStep === item.step && (
              <Badge variant="outline" className="text-xs">
                Etapa atual
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
