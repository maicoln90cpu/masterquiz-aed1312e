import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Step {
  number: number;
  title: string;
  completed: boolean;
}

export interface StepNavigationProps {
  currentStep: number;
  steps: Step[];
  onStepClick: (step: number) => void;
}

export const StepNavigation = ({ currentStep, steps, onStepClick }: StepNavigationProps) => {
  const { t } = useTranslation();
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-1">{t('createQuiz.stepsNavigation')}</h3>
        <p className="text-xs text-muted-foreground">
          {t('createQuiz.stepProgress', { current: currentStep, total: steps.length })}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {steps.map((step) => (
            <button
type="button"
key={step.number}
              onClick={() => onStepClick(step.number)}
              className={cn(
                "w-full text-left p-4 rounded-lg border-2 transition-all",
                currentStep === step.number
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors",
                  currentStep === step.number
                    ? "bg-primary text-primary-foreground"
                    : step.completed
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{step.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {step.completed 
                      ? t('createQuiz.stepCompleted')
                      : currentStep === step.number
                      ? t('createQuiz.stepCurrent')
                      : t('createQuiz.stepPending')}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Progress Bar */}
      <div className="p-4 border-t bg-muted/20">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('createQuiz.overallProgress')}</span>
            <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </div>
  );
};
