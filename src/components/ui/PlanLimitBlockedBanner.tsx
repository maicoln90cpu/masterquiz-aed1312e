import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";
import { pushGTMEvent } from "@/lib/gtmLogger";

export type PlanLimitLabelKey =
  | "leads"
  | "responses"
  | "sessions"
  | "completions"
  | "starts";

export type PlanLimitArea =
  | "crm"
  | "analytics_funnel"
  | "analytics_responses"
  | "dashboard"
  | "responses";

interface PlanLimitBlockedBannerProps {
  blockedCount: number;
  /** Chave i18n do tipo de dado bloqueado. Recomendado. */
  labelKey?: PlanLimitLabelKey;
  /** (Legado) string crua. Usado como fallback se labelKey não for fornecido. */
  label?: string;
  /** Texto adicional traduzido (ex: "(funil baseado em 15 de 23)") */
  context?: string;
  /** Área da app onde o banner é exibido — usado p/ tracking GTM. */
  area?: PlanLimitArea;
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
  area,
  className,
}: PlanLimitBlockedBannerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const firedRef = useRef(false);

  const resolvedLabel = labelKey
    ? t(`planLimitBanner.labels.${labelKey}`)
    : (label ?? "");
  const contextSuffix = context ? ` ${context}` : "";

  // Dispara evento GTM mount-once quando o banner é efetivamente exibido.
  useEffect(() => {
    if (firedRef.current) return;
    if (!blockedCount || blockedCount <= 0) return;
    firedRef.current = true;
    pushGTMEvent("plan_limit_blocked_viewed", {
      blocked_count: blockedCount,
      label: resolvedLabel,
      area: area ?? "unknown",
    });
  }, [blockedCount, resolvedLabel, area]);

  if (!blockedCount || blockedCount <= 0) return null;

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
