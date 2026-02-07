import { ArrowRight, Target, BarChart3, CheckCircle, Briefcase, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const FlowDiagram = () => {
  const { t } = useTranslation();

  const oldFlow = [
    { icon: Target, text: t('landing.problem.flow1'), hasIssue: true },
    { icon: XCircle, text: t('landing.problem.flow2'), hasIssue: true },
    { icon: XCircle, text: t('landing.problem.flow3'), hasIssue: true },
    { icon: XCircle, text: t('landing.problem.flow4'), hasIssue: true },
    { icon: XCircle, text: t('landing.problem.flow5'), hasIssue: true },
  ];

  const newFlow = [
    { icon: Target, text: t('landing.solution.flow1'), color: "text-primary" },
    { icon: BarChart3, text: t('landing.solution.flow2'), color: "text-primary" },
    { icon: CheckCircle, text: t('landing.solution.flow3'), color: "text-primary" },
    { icon: CheckCircle, text: t('landing.solution.flow4'), color: "text-primary" },
    { icon: Briefcase, text: t('landing.solution.flow5'), color: "text-primary" },
  ];

  return (
    <div className="space-y-12">
      {/* Old Flow */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-destructive">{t('landing.problem.flowTitle')}</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {oldFlow.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-4 landing-animate"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <step.icon className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium">{step.text}</span>
                {step.hasIssue && (
                  <XCircle className="h-4 w-4 text-destructive animate-pulse" />
                )}
              </div>
              {index < oldFlow.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Flow */}
      <div>
        <h3 className="text-xl font-semibold mb-6 text-primary">{t('landing.solution.flowTitle')}</h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {newFlow.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-4 landing-animate"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors">
                <step.icon className={`h-5 w-5 ${step.color}`} />
                <span className="text-sm font-medium">{step.text}</span>
              </div>
              {index < newFlow.length - 1 && (
                <ArrowRight className="h-5 w-5 text-primary hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
