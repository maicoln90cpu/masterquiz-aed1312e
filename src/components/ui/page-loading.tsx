import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * ⏳ PageLoading — Onda 8.2
 *
 * Estado de carregamento padronizado de página inteira.
 * Use em vez de spinners soltos ou skeletons inconsistentes.
 *
 * Variantes:
 *   - `spinner`: ações rápidas (<2s) ou centralizadas
 *   - `skeleton`: listas/cards (preferido — UX percebe como mais rápido)
 *   - `inline`: pequeno spinner inline (botões, células)
 *
 * Exemplo:
 *   <PageLoading variant="skeleton" rows={5} />
 */
interface PageLoadingProps {
  variant?: "spinner" | "skeleton" | "inline";
  /** Texto opcional abaixo do spinner. */
  label?: string;
  /** Número de linhas/cards no modo skeleton. */
  rows?: number;
  className?: string;
}

export function PageLoading({
  variant = "spinner",
  label,
  rows = 4,
  className,
}: PageLoadingProps) {
  if (variant === "inline") {
    return (
      <span
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label && <span>{label}</span>}
        <span className="sr-only">Carregando…</span>
      </span>
    );
  }

  if (variant === "skeleton") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Carregando conteúdo"
        className={cn("space-y-3 w-full", className)}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm">{label ?? "Carregando…"}</p>
    </div>
  );
}