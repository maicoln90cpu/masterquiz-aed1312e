import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useResourceLimits } from "@/hooks/useResourceLimits";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

export const ResourceMonitoringPanel = () => {
  const { limits, isLoading } = useResourceLimits();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!limits) return null;

  const resources = [
    {
      key: 'quizzes',
      icon: '📋',
      label: t('resourceMonitoring.quizzes'),
      data: limits.quizzes,
      color: 'text-blue-600'
    },
    {
      key: 'responses',
      icon: '💬',
      label: t('resourceMonitoring.responses'),
      data: limits.responses,
      color: 'text-green-600'
    },
    {
      key: 'leads',
      icon: '👥',
      label: t('resourceMonitoring.leads'),
      data: limits.leads,
      color: 'text-purple-600'
    }
  ];

  const hasWarnings = resources.some(r => r.data.isNearLimit);

  const isAdmin = limits.isMasterAdmin;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          {t('resourceMonitoring.title')}
          {isAdmin && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              👑 Admin
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {t('resourceMonitoring.description')} • {t('resourceMonitoring.currentPlan')}: <span className="font-semibold capitalize">{limits.planType}</span>
          {isAdmin && <span className="ml-2 text-purple-600 font-semibold">• Recursos Ilimitados</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin não vê avisos de limite */}
        {hasWarnings && !isAdmin && (
          <Alert variant="default" className="border-orange-500 bg-orange-50 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-900 dark:text-orange-100">
              {t('resourceMonitoring.warningTitle')}
            </AlertTitle>
            <AlertDescription className="text-orange-800 dark:text-orange-200 flex items-center justify-between">
              <span>{t('resourceMonitoring.warningDescription')}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/settings')}
                className="ml-4 border-orange-600 text-orange-600 hover:bg-orange-100"
              >
                {t('resourceMonitoring.upgradePlan')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Card de Perguntas por Quiz */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{t('resourceMonitoring.questionsPerQuiz')}</p>
                <p className="text-2xl font-bold mt-1">
                  {isAdmin ? '∞ Ilimitado' : `Até ${limits.questionsPerQuizLimit} perguntas`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAdmin 
                    ? 'Você tem acesso ilimitado como administrador' 
                    : t('resourceMonitoring.questionsPerQuizDescription')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {resources.map((resource) => (
          <div key={resource.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{resource.icon}</span>
                <span className="font-medium">{resource.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {resource.data.current} {isAdmin ? '(∞)' : `/ ${resource.data.limit}`}
                </span>
                {isAdmin ? (
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                ) : resource.data.isAtLimit ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : resource.data.isNearLimit ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            
            {!isAdmin && (
              <>
                <Progress 
                  value={resource.data.percentage} 
                  className={`h-3 ${
                    resource.data.isAtLimit 
                      ? 'bg-red-100' 
                      : resource.data.isNearLimit 
                      ? 'bg-orange-100' 
                      : 'bg-green-100'
                  }`}
                />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {resource.data.percentage.toFixed(1)}% {t('resourceMonitoring.used')}
                  </span>
                  {resource.data.isAtLimit && (
                    <span className="text-destructive font-semibold">
                      {t('resourceMonitoring.limitReached')}
                    </span>
                  )}
                  {resource.data.isNearLimit && !resource.data.isAtLimit && (
                    <span className="text-orange-600 font-semibold">
                      {t('resourceMonitoring.nearLimit')}
                    </span>
                  )}
                </div>
              </>
            )}
            
            {isAdmin && (
              <div className="text-xs text-purple-600 font-medium">
                ✨ Ilimitado (Acesso Admin)
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
