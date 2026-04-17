import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export type PlanLimitLabelKey =
  | "leads"
  | "responses"
  | "sessions"
  | "completions"
  | "starts";

interface PlanLimitBlockedBannerProps {
  blockedCount: number;
  /** Chave i18n do tipo de dado bloqueado. Recomendado. */
  labelKey?: PlanLimitLabelKey;
  /** (Legado) string crua. Usado como fallback se labelKey não for fornecido. */
  label?: string;
  /** Texto adicional traduzido (ex: "(funil baseado em 15 de 23)") */
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
  labelKey,
  label,
  context,
  className,
}: PlanLimitBlockedBannerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!blockedCount || blockedCount <= 0) return null;

  const resolvedLabel = labelKey
    ? t(`planLimitBanner.labels.${labelKey}`)
    : (label ?? "");
  const contextSuffix = context ? ` ${context}` : "";

  return (
    <Alert variant="warning" className={className}>
      <Lock className="h-4 w-4" />
      <AlertTitle>
        {t("planLimitBanner.title", {
          count: blockedCount,
          label: resolvedLabel,
          context: contextSuffix,
        })}
      </AlertTitle>
      <AlertDescription className="mt-2 flex items-center justify-between gap-4">
        <span>
          {t("planLimitBanner.description", { label: resolvedLabel })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/precos")}
          className="whitespace-nowrap"
        >
          {t("planLimitBanner.cta")}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
