import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanLimitBlockedBannerProps {
  blockedCount: number;
  /** ex: "leads", "respostas", "sessões" */
  label: string;
  /** opcional, ex: "no CRM" */
  context?: string;
  className?: string;
}

/**
 * Banner exibido quando o usuário tem mais dados no banco do que o
 * limite de visualização do plano permite mostrar.
 * Os dados continuam salvos — apenas a visualização é bloqueada.
 */
export const PlanLimitBlockedBanner = ({
  blockedCount,
  label,
  context,
  className,
}: PlanLimitBlockedBannerProps) => {
  const navigate = useNavigate();

  if (!blockedCount || blockedCount <= 0) return null;

  return (
    <Alert variant="warning" className={className}>
      <Lock className="h-4 w-4" />
      <AlertTitle>
        {blockedCount} {label} bloqueados{context ? ` ${context}` : ""}
      </AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between gap-4">
        <span>
          Esses {label} estão salvos na sua conta, mas o seu plano atual
          não permite visualizá-los. Faça upgrade para liberar o acesso completo.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/precos")}
          className="whitespace-nowrap"
        >
          Ver planos
        </Button>
      </AlertDescription>
    </Alert>
  );
};
