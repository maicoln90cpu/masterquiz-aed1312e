import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { useCurrentUser } from "./useCurrentUser";
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

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

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
    enabled: !roleLoading && !!user
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

    return plan?.questions_per_quiz_limit || 10;
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
    quizLimit: isMasterAdmin ? 999999 : subscription?.quiz_limit || 3,
    responseLimit: isMasterAdmin ? 999999 : subscription?.response_limit || 100,
    isMasterAdmin
  };
};
