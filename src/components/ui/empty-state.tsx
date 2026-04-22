import { ReactNode } from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * 📭 EmptyState — Onda 8.2
 *
 * Componente padronizado para listas/painéis vazios.
 * Sempre prefira este componente em vez de uma `<div>` em branco com texto solto.
 *
 * Exemplo:
 *   <EmptyState
 *     icon={Users}
 *     title="Nenhum lead ainda"
 *     description="Quando seus quizzes receberem respostas, os leads aparecerão aqui."
 *     action={{ label: "Criar quiz", onClick: () => navigate('/new') }}
 *   />
 */
interface EmptyStateProps {
  /** Ícone (opcional). Padrão: Inbox. */
  icon?: LucideIcon;
  /** Título principal (obrigatório). */
  title: string;
  /** Descrição secundária. */
  description?: string;
  /** Ação primária opcional (botão CTA). */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  /** Conteúdo extra renderizado abaixo do CTA (ex.: link secundário). */
  children?: ReactNode;
  /** className adicional para o container. */
  className?: string;
  /** Tamanho do componente — afeta padding e tamanho do ícone. */
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: { padding: "py-6 px-4", icon: "h-8 w-8", title: "text-sm font-medium", desc: "text-xs" },
  md: { padding: "py-12 px-6", icon: "h-12 w-12", title: "text-base font-semibold", desc: "text-sm" },
  lg: { padding: "py-16 px-8", icon: "h-16 w-16", title: "text-lg font-semibold", desc: "text-base" },
} as const;

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  children,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = SIZE_CLASSES[size];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3",
        sizes.padding,
        className,
      )}
    >
      <Icon className={cn(sizes.icon, "text-muted-foreground/40")} aria-hidden="true" />
      <div className="space-y-1 max-w-md">
        <h3 className={cn(sizes.title, "text-foreground")}>{title}</h3>
        {description && (
          <p className={cn(sizes.desc, "text-muted-foreground")}>{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant ?? "default"}
          size={size === "sm" ? "sm" : "default"}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}