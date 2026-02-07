import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";

interface PlanLimitWarningProps {
  current: number;
  limit: number;
  type: 'quiz' | 'response';
}

export const PlanLimitWarning = ({ current, limit, type }: PlanLimitWarningProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isMasterAdmin, loading: roleLoading } = useUserRole();
  const { subscription, isLoading: subLoading } = useSubscriptionLimits();
  
  // ✅ Aguardar carregamento para evitar flash de aviso
  if (roleLoading || subLoading) return null;
  
  // ✅ Master admin ou plano admin nunca vê avisos de limite
  if (isMasterAdmin || subscription?.plan_type === 'admin') return null;
  
  const percentage = (current / limit) * 100;
  
  // Mostrar aviso apenas quando atingir 80% do limite
  if (percentage < 80) return null;

  const isAtLimit = current >= limit;
  const typeText = type === 'quiz' ? t('planLimit.quizzes') : t('planLimit.responsesWord');
  
  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? `${t('planLimit.atLimit')} ${typeText}` : t('planLimit.nearLimit')}
      </AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between">
        <span>
          {isAtLimit 
            ? `Você atingiu o limite de ${limit} ${typeText} do plano gratuito.`
            : `Você está usando ${current} de ${limit} ${typeText} (${Math.round(percentage)}%).`
          } {t('planLimit.upgrade')}
        </span>
        <Button 
          variant={isAtLimit ? "default" : "outline"}
          size="sm"
          onClick={() => navigate('/settings')}
          className="ml-4 whitespace-nowrap"
        >
          {t('settings.viewAllPlans')}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
