import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { incrementProfileCounter, setProfileFirstText } from "@/lib/icpTracking";
import { useEffect, useRef } from "react";

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

  const isAtLimit = current >= limit;
  const percentage = (current / limit) * 100;

  // 🎯 GTM: plan_limit_hit — disparado 1x quando atinge o limite
  const limitFired = useRef(false);
  useEffect(() => {
    if (isAtLimit && !limitFired.current && !roleLoading && !subLoading && !isMasterAdmin && subscription?.plan_type !== 'admin') {
      limitFired.current = true;
      pushGTMEvent('plan_limit_hit', {
        limit_type: type,
        current,
        limit,
        plan_type: subscription?.plan_type || 'free',
      });
      setProfileFirstText('plan_limit_hit_type', type); // M05
    }
  }, [isAtLimit, roleLoading, subLoading]);
  
  // ✅ Aguardar carregamento para evitar flash de aviso
  if (roleLoading || subLoading) return null;
  
  // ✅ Master admin ou plano admin nunca vê avisos de limite
  if (isMasterAdmin || subscription?.plan_type === 'admin') return null;
  
  // Mostrar aviso apenas quando atingir 80% do limite
  if (percentage < 80) return null;

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
          onClick={() => {
            pushGTMEvent('upgrade_clicked', {
              source: 'plan_limit_warning',
              limit_type: type,
              plan_type: subscription?.plan_type || 'free',
            });
            incrementProfileCounter('upgrade_clicked_count'); // M06
            navigate('/precos');
          }}
          className="ml-4 whitespace-nowrap"
        >
          {t('settings.viewAllPlans')}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
