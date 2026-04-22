import { AlertTriangle, RefreshCw, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * ⚠️ ErrorState — Onda 8.2
 *
 * Componente padronizado para falhas de carregamento/ação.
 * Sempre mostre uma mensagem clara + botão "Tentar novamente" — nunca apenas "Erro.".
 *
 * Exemplo:
 *   <ErrorState
 *     title="Não foi possível carregar os leads"
 *     message={error.message}
 *     onRetry={refetch}
 *     isRetrying={isFetching}
 *   />
 */
interface ErrorStateProps {
  /** Título curto e amigável. */
  title?: string;
  /** Mensagem técnica/contextual (ex.: error.message). */
  message?: string;
  /** Callback de retry. Quando ausente, o botão não é renderizado. */
  onRetry?: () => void;
  /** Estado de "tentando novamente" — desabilita o botão e mostra spinner. */
  isRetrying?: boolean;
  /** Sinaliza que o usuário está offline (mostra ícone WiFi). */
  isOffline?: boolean;
  /** Tamanho do componente. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: { padding: "py-4 px-3", icon: "h-6 w-6", title: "text-sm font-medium", msg: "text-xs" },
  md: { padding: "py-8 px-4", icon: "h-10 w-10", title: "text-base font-semibold", msg: "text-sm" },
  lg: { padding: "py-12 px-6", icon: "h-14 w-14", title: "text-lg font-semibold", msg: "text-base" },
} as const;

export function ErrorState({
  title = "Algo deu errado",
  message,
  onRetry,
  isRetrying = false,
  isOffline = false,
  size = "md",
  className,
}: ErrorStateProps) {
  const sizes = SIZE_CLASSES[size];
  const Icon = isOffline ? WifiOff : AlertTriangle;
  const finalMessage = isOffline
    ? "Você está offline. Verifique sua conexão e tente novamente."
    : message;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3",
        sizes.padding,
        className,
      )}
    >
      <Icon className={cn(sizes.icon, "text-destructive")} aria-hidden="true" />
      <div className="space-y-1 max-w-md">
        <h3 className={cn(sizes.title, "text-foreground")}>{title}</h3>
        {finalMessage && (
          <p className={cn(sizes.msg, "text-muted-foreground break-words")}>{finalMessage}</p>
        )}
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          disabled={isRetrying || isOffline}
          className="mt-2 gap-2"
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Tentar novamente
        </Button>
      )}
    </div>
  );
}