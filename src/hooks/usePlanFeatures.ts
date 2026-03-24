import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";
import { useCurrentUser } from "./useCurrentUser";
import type { SubscriptionPlan } from "@/types";

/** Features available based on subscription plan */
export interface PlanFeatures {
  allow_facebook_pixel: boolean;
  allow_gtm: boolean;
  allowed_templates: string[];
  allow_export_pdf: boolean;
  allow_webhook: boolean;
  allow_white_label: boolean;
  allow_video_upload: boolean;
  video_storage_limit_mb: number;
  allow_ai_generation: boolean;
  ai_generations_per_month: number;
  allow_custom_domain: boolean;
  allow_quiz_sharing: boolean;
  // Analytics Avançado
  allow_heatmap: boolean;
  allow_ab_testing: boolean;
  allow_quiz_branching: boolean;
  allow_advanced_analytics: boolean;
}

/** All available templates for master admin */
const ALL_TEMPLATES = ['moderno', 'colorido', 'profissional', 'criativo', 'elegante', 'vibrante', 'minimalista', 'escuro'];

/** Unlimited features for master admin */
const MASTER_ADMIN_FEATURES: PlanFeatures = {
  allow_facebook_pixel: true,
  allow_gtm: true,
  allowed_templates: ALL_TEMPLATES,
  allow_export_pdf: true,
  allow_webhook: true,
  allow_white_label: true,
  allow_video_upload: true,
  video_storage_limit_mb: 999999,
  allow_ai_generation: true,
  ai_generations_per_month: 999999,
  allow_custom_domain: true,
  allow_quiz_sharing: true,
  // Analytics Avançado
  allow_heatmap: true,
  allow_ab_testing: true,
  allow_quiz_branching: true,
  allow_advanced_analytics: true,
};

export const usePlanFeatures = () => {
  const { isMasterAdmin, loading: roleLoading } = useUserRole();
  const { user } = useCurrentUser();

  const { data: features, isLoading } = useQuery<PlanFeatures | null>({
    queryKey: ['plan-features', isMasterAdmin, user?.id],
    queryFn: async (): Promise<PlanFeatures | null> => {
      if (!user) return null;

      // Master admin tem acesso a TODAS as features
      if (isMasterAdmin) {
        return MASTER_ADMIN_FEATURES;
      }

      // Buscar subscription do usuário
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type')
        .eq('user_id', user.id)
        .single();

      if (!subscription) return null;

      // ✅ Se plano é admin, retornar features ilimitadas
      if (subscription.plan_type === 'admin') {
        return MASTER_ADMIN_FEATURES;
      }

      // Buscar features do plano
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('allow_facebook_pixel, allow_gtm, allowed_templates, allow_export_pdf, allow_webhook, allow_white_label, allow_video_upload, video_storage_limit_mb, allow_ai_generation, ai_generations_per_month, allow_custom_domain, allow_quiz_sharing, allow_heatmap, allow_ab_testing, allow_quiz_branching, allow_advanced_analytics')
        .eq('plan_type', subscription.plan_type)
        .eq('is_active', true)
        .single();

      if (!plan) return null;

      return {
        allow_facebook_pixel: plan.allow_facebook_pixel ?? false,
        allow_gtm: plan.allow_gtm ?? false,
        allowed_templates: (plan.allowed_templates as string[]) ?? ['moderno'],
        allow_export_pdf: plan.allow_export_pdf ?? false,
        allow_webhook: plan.allow_webhook ?? false,
        allow_white_label: plan.allow_white_label ?? false,
        allow_video_upload: plan.allow_video_upload ?? false,
        video_storage_limit_mb: plan.video_storage_limit_mb ?? 0,
        allow_ai_generation: plan.allow_ai_generation ?? false,
        ai_generations_per_month: plan.ai_generations_per_month ?? 0,
        allow_custom_domain: plan.allow_custom_domain ?? false,
        allow_quiz_sharing: plan.allow_quiz_sharing ?? false,
        // Analytics Avançado
        allow_heatmap: plan.allow_heatmap ?? false,
        allow_ab_testing: plan.allow_ab_testing ?? false,
        allow_quiz_branching: plan.allow_quiz_branching ?? false,
        allow_advanced_analytics: plan.allow_advanced_analytics ?? false,
      };
    },
    enabled: !roleLoading
  });

  return {
    allowedTemplates: isMasterAdmin 
      ? ['moderno', 'colorido', 'profissional', 'criativo', 'elegante', 'vibrante', 'minimalista', 'escuro']
      : (features?.allowed_templates as string[]) || ['moderno'],
    allowFacebookPixel: isMasterAdmin || features?.allow_facebook_pixel || false,
    allowGTM: isMasterAdmin || features?.allow_gtm || false,
    allowWhiteLabel: isMasterAdmin || features?.allow_white_label || false,
    allowExportPDF: isMasterAdmin || features?.allow_export_pdf || false,
    allowWebhook: isMasterAdmin || features?.allow_webhook || false,
    allowVideoUpload: isMasterAdmin || features?.allow_video_upload || false,
    videoStorageLimitMb: isMasterAdmin ? 999999 : features?.video_storage_limit_mb || 0,
    allowAIGeneration: isMasterAdmin || features?.allow_ai_generation || false,
    aiGenerationsPerMonth: isMasterAdmin ? 999999 : features?.ai_generations_per_month || 0,
    allowCustomDomain: isMasterAdmin || features?.allow_custom_domain || false,
    allowQuizSharing: isMasterAdmin || features?.allow_quiz_sharing || false,
    // Analytics Avançado
    allowHeatmap: isMasterAdmin || features?.allow_heatmap || false,
    allowABTesting: isMasterAdmin || features?.allow_ab_testing || false,
    allowQuizBranching: isMasterAdmin || features?.allow_quiz_branching || false,
    allowAdvancedAnalytics: isMasterAdmin || features?.allow_advanced_analytics || false,
    isMasterAdmin,
    isLoading: isLoading || roleLoading
  };
};
