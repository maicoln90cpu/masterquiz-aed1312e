import { logger } from '@/lib/logger';
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { useCurrentUser } from "./useCurrentUser";
import { trackOperation } from "@/lib/performanceCapture";
import type { UserSubscription, PlanType } from "@/types";

/** Extended subscription for master admin simulation */
interface AdminSubscription extends UserSubscription {
  id: 'admin';
}

export const useSubscriptionLimits = () => {
  const { isMasterAdmin, loading: roleLoading } = useUserRole();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Realtime: invalidar cache quando subscription muda
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`sub-realtime-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['resource-limits'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const { data: subscription, isLoading } = useQuery<UserSubscription | AdminSubscription | null>({
    queryKey: ['subscription', isMasterAdmin, user?.id],
    queryFn: async (): Promise<UserSubscription | AdminSubscription | null> => {
      if (!user) return null;

      // Master admin: retorna subscription simulada com limites ilimitados
      if (isMasterAdmin) {
        return {
          id: 'admin',
          user_id: user.id,
          plan_type: 'admin' as PlanType,
          status: 'active' as const,
          quiz_limit: 999999,
          response_limit: 999999,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      const { data, error } = await trackOperation('user_subscription_fetch', 'query', async () =>
        await supabase
          .from('user_subscriptions')
          // 4.5: Colunas específicas (era select('*')) — payload menor + uso de índices.
          // ⚠️ Ao adicionar leitura de novo campo de user_subscriptions em qualquer
          // consumidor de useSubscriptionLimits, INCLUIR a coluna aqui.
          .select('id, user_id, plan_type, status, quiz_limit, response_limit, payment_confirmed, trial_end_date, created_at, updated_at')
          .eq('user_id', user.id)
          .single()
      );

      if (error) throw error;
      
      // ✅ Se plano é admin, retornar limites ilimitados
      if (data?.plan_type === 'admin') {
        return {
          ...data,
          quiz_limit: 999999,
          response_limit: 999999,
        } as UserSubscription;
      }
      
      return data as UserSubscription;
    },
    enabled: !roleLoading && !!user,
    // 4.5: Cache 10min — subscription muda raramente; invalidação realtime
    // já cobre updates via canal `sub-realtime-${user.id}` acima.
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Master admin sempre retorna true para todas as verificações de limite
  const checkQuizLimit = async () => {
    if (isMasterAdmin) return true;
    if (!subscription) return false;
    if (!user) return false;

    const { count } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('creation_source', 'express_auto');

    return (count || 0) < subscription.quiz_limit;
  };

  const checkResponseLimit = async (quizId: string) => {
    if (isMasterAdmin) return true;
    if (!subscription) return false;

    const { count } = await supabase
      .from('quiz_responses')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);

    return (count || 0) < subscription.response_limit;
  };

  const checkLeadLimit = async () => {
    if (isMasterAdmin) return true;
    if (!subscription) return false;
    
    // ✅ Plano admin tem limite ilimitado
    if (subscription.plan_type === 'admin') return true;
    if (!user) return false;

    // Buscar lead_limit do plano (aceitar planos ativos OU admin)
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('lead_limit')
      .eq('plan_type', subscription.plan_type)
      .eq('is_active', true)
      .single();

    if (!plan || !plan.lead_limit) return true; // Se não tem limite, permite

    // Buscar quizzes do usuário
    const { data: userQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('user_id', user.id);

    if (!userQuizzes || userQuizzes.length === 0) return true;

    const quizIds = userQuizzes.map(q => q.id);

    // Contar leads atuais do usuário (de todos os seus quizzes)
    const { count } = await supabase
      .from('quiz_responses')
      .select('*', { count: 'exact', head: true })
      .in('quiz_id', quizIds);

    return (count || 0) < plan.lead_limit;
  };

  const checkQuestionsPerQuizLimit = async (currentCount: number) => {
    if (isMasterAdmin) return true;
    if (!subscription) return false;
    
    // ✅ Plano admin tem limite ilimitado
    if (subscription.plan_type === 'admin') return true;

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('questions_per_quiz_limit')
      .eq('plan_type', subscription.plan_type)
      .eq('is_active', true)
      .single();

    if (!plan || !plan.questions_per_quiz_limit) return true;
    
    return currentCount < plan.questions_per_quiz_limit;
  };

  const getQuestionsPerQuizLimit = async () => {
    if (isMasterAdmin) return 999;
    if (!subscription) return 10;
    
    // ✅ Plano admin tem limite ilimitado
    if (subscription.plan_type === 'admin') return 999;

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('questions_per_quiz_limit')
      .eq('plan_type', subscription.plan_type)
      .eq('is_active', true)
      .single();

    // ✅ Sem fallback hardcoded — subscription_plans é fonte única de verdade
    if (!plan?.questions_per_quiz_limit) {
      logger.warn(`[useSubscriptionLimits] questions_per_quiz_limit ausente para plano "${subscription.plan_type}".`);
    }
    return plan?.questions_per_quiz_limit ?? 0;
  };

  return {
    subscription,
    isLoading: isLoading || roleLoading,
    checkQuizLimit,
    checkResponseLimit,
    checkLeadLimit,
    checkQuestionsPerQuizLimit,
    getQuestionsPerQuizLimit,
    planType: isMasterAdmin ? 'Admin' : subscription?.plan_type || 'free',
    // ✅ Sem fallback numérico — usa o valor já sincronizado de user_subscriptions
    // (mantido em sync via trigger sync_user_subscription_limits_on_plan_update)
    quizLimit: isMasterAdmin ? 999999 : (subscription?.quiz_limit ?? 0),
    responseLimit: isMasterAdmin ? 999999 : (subscription?.response_limit ?? 0),
    isMasterAdmin
  };
};
