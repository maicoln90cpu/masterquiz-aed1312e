import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
}

/**
 * Hook para verificar rate limiting antes de ações críticas (signup, AI gen, webhooks).
 *
 * Invoca a Edge Function `rate-limiter`, que persiste contadores em
 * `rate_limit_tracker`. Estratégia **fail-open**: em caso de erro de rede,
 * a ação é permitida (preferimos UX a bloqueio falso).
 *
 * @returns `{ checkRateLimit(action, identifier): Promise<{ allowed, retryAfter? }> }`
 *
 * @example
 * ```tsx
 * const { checkRateLimit } = useRateLimit();
 * const { allowed } = await checkRateLimit('ai_generation', user.id);
 * if (!allowed) return; // toast de erro já foi exibido pelo hook
 * ```
 */
export const useRateLimit = () => {
  const { t } = useTranslation();

  const checkRateLimit = async (
    action: string,
    identifier: string
  ): Promise<RateLimitResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: { action, identifier }
      });

      if (error) {
        console.error('[Rate Limit] Error:', error);
        // Em caso de erro, permitir a ação (fail-open)
        return { allowed: true };
      }

      if (!data.allowed) {
        const retryAfter = data.retryAfter || 60;
        const minutes = Math.ceil(retryAfter / 60);
        
        toast.error(
          t('hooks.rateLimit.tooManyAttempts', { minutes }),
          { duration: 5000 }
        );
        
        return { allowed: false, retryAfter };
      }

      return { allowed: true };
    } catch (err) {
      console.error('[Rate Limit] Exception:', err);
      // Em caso de exceção, permitir a ação (fail-open)
      return { allowed: true };
    }
  };

  return { checkRateLimit };
};
