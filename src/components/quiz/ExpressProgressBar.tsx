import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Rocket } from "lucide-react";

interface ExpressProgressBarProps {
  currentStep: 1 | 2;
}

export const ExpressProgressBar = ({ currentStep }: ExpressProgressBarProps) => {
  const { t } = useTranslation();

  const steps = [
    { number: 1 as const, label: t('express.step1', 'Revise as perguntas'), icon: '✏️' },
    { number: 2 as const, label: t('express.step2', 'Publicar'), icon: '🚀' },
  ];

  return (
    <div className="w-full bg-card border-b px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  currentStep > step.number
                    ? "bg-green-500 text-white"
                    : currentStep === step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium truncate",
                  currentStep === step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 rounded-full mx-2",
                  currentStep > 1 ? "bg-green-500" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t('express.motivational', 'Você pode editar tudo depois. O objetivo agora é colocar no ar.')}
        </p>
      </div>
    </div>
  );
};
