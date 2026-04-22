/**
 * 🔔 Helper unificado de notificações — Onda 8.1
 *
 * Wrapper fino sobre `sonner` que padroniza tom, duração e ícones.
 * Use SEMPRE estes helpers em vez de `toast.success/error/...` direto,
 * para garantir UX consistente em toda a aplicação.
 *
 * Exemplos:
 *   notifySuccess("Quiz publicado!");
 *   notifyError("Falha ao salvar", { description: err.message });
 *   notifyInfo("Sincronizando dados...");
 *
 * @see mem://design/responsive-system
 */
import { toast } from "sonner";

interface NotifyOptions {
  description?: string;
  duration?: number;
  /** Ação opcional (ex: { label: "Desfazer", onClick: () => {...} }) */
  action?: { label: string; onClick: () => void };
}

const DEFAULT_DURATION = {
  success: 3000,
  error: 5000,
  info: 3500,
  warning: 4000,
} as const;

export function notifySuccess(message: string, options?: NotifyOptions) {
  return toast.success(message, {
    duration: options?.duration ?? DEFAULT_DURATION.success,
    description: options?.description,
    action: options?.action,
  });
}

export function notifyError(message: string, options?: NotifyOptions) {
  return toast.error(message, {
    duration: options?.duration ?? DEFAULT_DURATION.error,
    description: options?.description,
    action: options?.action,
  });
}

export function notifyInfo(message: string, options?: NotifyOptions) {
  return toast.info(message, {
    duration: options?.duration ?? DEFAULT_DURATION.info,
    description: options?.description,
    action: options?.action,
  });
}

export function notifyWarning(message: string, options?: NotifyOptions) {
  return toast.warning(message, {
    duration: options?.duration ?? DEFAULT_DURATION.warning,
    description: options?.description,
    action: options?.action,
  });
}

/** Re-exporta `toast` para casos avançados (loading com promise, dismiss, etc.). */
export { toast };