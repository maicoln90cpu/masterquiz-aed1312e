import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { useCurrentUser } from "./useCurrentUser";
import type { PlanType } from "@/types";

export interface ResourceLimit {
  current: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean; // >= 80%
  isAtLimit: boolean; // >= 100%
  isUnlimited?: boolean; // Master admin has unlimited
}

export interface ResourceLimits {
  quizzes: ResourceLimit;
  responses: ResourceLimit;
  leads: ResourceLimit;
  questionsPerQuizLimit: number;
  planType: PlanType | 'admin';
  isMasterAdmin?: boolean;
}

export const useResourceLimits = () => {
  const { isMasterAdmin, loading: roleLoading } = useUserRole();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['resource-limits', isMasterAdmin],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Se for master admin, retorna limites ilimitados
      if (isMasterAdmin) {
        // Ainda buscar contagens atuais para exibição
        const { count: quizCount } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { data: userQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .eq('user_id', user.id);

        const quizIds = userQuizzes?.map(q => q.id) || [];
        let responseCount = 0;
        if (quizIds.length > 0) {
          const { count } = await supabase
            .from('quiz_responses')
            .select('*', { count: 'exact', head: true })
            .in('quiz_id', quizIds);
          responseCount = count || 0;
        }

        const unlimitedResource = (current: number): ResourceLimit => ({
          current,
          limit: Infinity,
          percentage: 0,
          isNearLimit: false,
          isAtLimit: false,
          isUnlimited: true
        });

        return {
          quizzes: unlimitedResource(quizCount || 0),
          responses: unlimitedResource(responseCount),
          leads: unlimitedResource(responseCount),
          questionsPerQuizLimit: 999,
          planType: 'admin',
          isMasterAdmin: true
        } as ResourceLimits;
      }

      // Buscar subscription do usuário
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type, quiz_limit, response_limit')
        .eq('user_id', user.id)
        .single();

      if (!subscription) return null;

    // Buscar lead_limit e questions_per_quiz_limit do plano
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('lead_limit, questions_per_quiz_limit')
      .eq('plan_type', subscription.plan_type)
      .eq('is_active', true)
      .single();

      // Contar quizzes do usuário
      const { count: quizCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Buscar IDs dos quizzes do usuário
      const { data: userQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', user.id);

      const quizIds = userQuizzes?.map(q => q.id) || [];

      // Contar respostas de todos os quizzes do usuário
      let responseCount = 0;
      if (quizIds.length > 0) {
        const { count } = await supabase
          .from('quiz_responses')
          .select('*', { count: 'exact', head: true })
          .in('quiz_id', quizIds);
        responseCount = count || 0;
      }

      const quizLimit = subscription.quiz_limit;
      const responseLimit = subscription.response_limit;
      const leadLimit = plan?.lead_limit || 1000;

      const calculateMetrics = (current: number, limit: number): Omit<ResourceLimit, 'current' | 'limit'> => {
        const percentage = Math.min((current / limit) * 100, 100);
        return {
          percentage,
          isNearLimit: percentage >= 80,
          isAtLimit: percentage >= 100
        };
      };

      const limits: ResourceLimits = {
        quizzes: {
          current: quizCount || 0,
          limit: quizLimit,
          ...calculateMetrics(quizCount || 0, quizLimit)
        },
        responses: {
          current: responseCount,
          limit: responseLimit,
          ...calculateMetrics(responseCount, responseLimit)
        },
        leads: {
          current: responseCount, // Leads = respostas com dados de contato
          limit: leadLimit,
          ...calculateMetrics(responseCount, leadLimit)
        },
        questionsPerQuizLimit: plan?.questions_per_quiz_limit || 10,
        planType: subscription.plan_type
      };

      return limits;
    },
    enabled: !roleLoading,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  return {
    limits: data,
    isLoading: isLoading || roleLoading,
    refetch
  };
};
