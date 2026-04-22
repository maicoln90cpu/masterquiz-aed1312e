/**
 * 🦮 FormFieldA11y — wrapper acessível para campos de formulário (Onda 8.7)
 *
 * Garante automaticamente:
 *  - <label htmlFor> conectado ao input via id
 *  - aria-describedby conectado a hint e/ou erro
 *  - aria-invalid quando há erro
 *  - aria-required quando required=true
 *  - role="alert" no parágrafo de erro (anuncia em screen readers)
 *
 * Uso:
 *   <FormFieldA11y label="Email" required hint="Nunca compartilhamos" error={errors.email?.message}>
 *     {(props) => <Input type="email" {...props} {...register("email")} />}
 *   </FormFieldA11y>
 *
 * O `children` recebe `{ id, "aria-describedby", "aria-invalid", "aria-required", required }`
 * para serem espalhados no input — assim funciona com qualquer biblioteca (RHF, Formik, etc.).
 */
import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldA11yChildProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
  required?: boolean;
}

interface FormFieldA11yProps {
  label: React.ReactNode;
  children: (props: FormFieldA11yChildProps) => React.ReactNode;
  /** Texto de ajuda exibido abaixo do campo. */
  hint?: React.ReactNode;
  /** Mensagem de erro — quando presente, vira aria-invalid e role=alert. */
  error?: React.ReactNode;
  required?: boolean;
  /** Esconde label visualmente (mas mantém para SR). */
  hideLabel?: boolean;
  className?: string;
  /** ID customizado — caso contrário, gera um único via React.useId. */
  id?: string;
}

export function FormFieldA11y({
  label,
  children,
  hint,
  error,
  required = false,
  hideLabel = false,
  className,
  id: idProp,
}: FormFieldA11yProps) {
  const reactId = React.useId();
  const id = idProp ?? `f-${reactId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={id}
        className={cn(hideLabel && "sr-only", error && "text-destructive")}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </Label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": !!error,
        "aria-required": required,
        required,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}