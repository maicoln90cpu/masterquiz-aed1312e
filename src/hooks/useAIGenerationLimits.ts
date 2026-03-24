import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { useCurrentUser } from "./useCurrentUser";

export const useAIGenerationLimits = () => {
  const { isMasterAdmin, loading: roleLoading } = useUserRole();
  const { user } = useCurrentUser();
  
  const { data, isLoading } = useQuery({
    queryKey: ['ai-generation-limits', isMasterAdmin, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // ✅ Master admin tem acesso ilimitado
      if (isMasterAdmin) {
        return {
          allowed: true,
          limit: Infinity,
          used: 0,
          remaining: Infinity,
          isUnlimited: true,
        };
      }

      // Buscar subscription do usuário
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .single();

      if (!subscription) return null;

      // ✅ Plano admin tem acesso ilimitado
      if (subscription.plan_type === 'admin') {
        return {
          allowed: true,
          limit: Infinity,
          used: 0,
          remaining: Infinity,
          isUnlimited: true,
        };
      }

      // Buscar configuração do plano (apenas planos ativos)
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('allow_ai_generation, ai_generations_per_month')
        .eq('plan_type', subscription.plan_type)
        .eq('is_active', true)
        .single();

      if (!plan) return null;

      // Se não permite IA, retorna logo
      if (!plan.allow_ai_generation) {
        return {
          allowed: false,
          limit: 0,
          used: 0,
          remaining: 0,
        };
      }

      // Buscar uso do mês atual
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: usageData, count } = await supabase
        .from('ai_quiz_generations')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('generation_month', currentMonth);

      const used = count || 0;
      const limit = plan.ai_generations_per_month;
      const remaining = limit === 0 ? Infinity : Math.max(0, limit - used);

      return {
        allowed: true,
        limit: limit === 0 ? Infinity : limit,
        used,
        remaining,
        isUnlimited: limit === 0,
      };
    },
    enabled: !roleLoading,
  });

  return {
    allowed: data?.allowed ?? false,
    limit: data?.limit ?? 0,
    used: data?.used ?? 0,
    remaining: data?.remaining ?? 0,
    isUnlimited: data?.isUnlimited ?? false,
    isLoading: isLoading || roleLoading,
  };
};