/**
 * 📣 Callout — banner semântico reutilizável (Onda 8.6)
 *
 * Substitui banners coloridos hardcoded como:
 *   <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 ...">
 *
 * Por tokens do design system (success, warning, info, destructive),
 * garantindo dark mode automático e consistência visual.
 *
 * Uso:
 *   <Callout variant="warning">Texto importante…</Callout>
 *   <Callout variant="success" icon={<Check />}>Tudo certo!</Callout>
 *
 * @see mem://design/responsive-system
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const calloutVariants = cva(
  "rounded-lg border p-4 flex gap-3 text-sm",
  {
    variants: {
      variant: {
        info: "bg-info/10 border-info/30 text-info-foreground [&>svg]:text-info",
        success: "bg-success/10 border-success/30 text-success-foreground [&>svg]:text-success",
        warning: "bg-warning/10 border-warning/30 text-warning-foreground [&>svg]:text-warning",
        destructive: "bg-destructive/10 border-destructive/30 text-destructive-foreground [&>svg]:text-destructive",
        muted: "bg-muted border-border text-foreground [&>svg]:text-muted-foreground",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const DEFAULT_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  muted: Info,
} as const;

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
  /** Ícone customizado. Passe `null` para esconder. */
  icon?: React.ReactNode | null;
  title?: React.ReactNode;
}

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(
  ({ className, variant = "info", icon, title, children, ...props }, ref) => {
    const Default = DEFAULT_ICONS[variant ?? "info"];
    const renderedIcon =
      icon === null
        ? null
        : icon ?? <Default className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />;

    return (
      <div
        ref={ref}
        role={variant === "destructive" || variant === "warning" ? "alert" : "status"}
        className={cn(calloutVariants({ variant }), className)}
        {...props}
      >
        {renderedIcon}
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold mb-1">{title}</p>}
          {children}
        </div>
      </div>
    );
  },
);
Callout.displayName = "Callout";