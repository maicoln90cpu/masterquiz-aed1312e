import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteMode } from "./useSiteMode";

export interface PricingPlan {
  id: string;
  dbId: string;
  name: string;
  price: string;
  showPerMonth: boolean;
  description: string;
  features: string[];
  enabledFeatures: Array<{
    key: string;
    label: string;
    enabled: boolean;
  }>;
  highlighted: boolean;
  popular: boolean;
  kiwifyCheckoutUrl: string | null;
  ctaText: string;
  ctaVariant: 'default' | 'outline';
  planType: string;
}

export const usePricingPlans = () => {
  const { isModeB } = useSiteMode();

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['pricing-plans', isModeB],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(plan => {
        // Use Mode B price if available and in Mode B
        const effectivePrice = isModeB && (plan as any).price_monthly_mode_b != null
          ? (plan as any).price_monthly_mode_b
          : plan.price_monthly;

        // Use Mode B checkout URL if available and in Mode B
        const effectiveCheckoutUrl = isModeB && (plan as any).kiwify_checkout_url_mode_b
          ? (plan as any).kiwify_checkout_url_mode_b
          : (plan as any).kiwify_checkout_url;

        // Format price
        let formattedPrice = 'R$ 0';
        let showPerMonth = false;
        
        if (effectivePrice === null || effectivePrice === 0) {
          formattedPrice = 'Grátis';
        } else if (effectivePrice === -1) {
          formattedPrice = 'Sob consulta';
        } else {
          formattedPrice = `R$ ${effectivePrice}`;
          showPerMonth = true;
        }

        // Build features array (main limits)
        const features = [
          `${plan.quiz_limit === -1 ? '∞' : plan.quiz_limit} quizzes ativos`,
          `${plan.response_limit === -1 ? '∞' : plan.response_limit.toLocaleString('pt-BR')} respostas/mês`,
          `Gerenciamento de Leads - ${plan.lead_limit === -1 ? '∞' : (plan.lead_limit || 1000).toLocaleString('pt-BR')}`,
          `${Array.isArray(plan.allowed_templates) ? plan.allowed_templates.length : 2} templates inclusos`,
          `${plan.questions_per_quiz_limit === -1 ? '∞' : plan.questions_per_quiz_limit} perguntas por quiz`,
        ];

        // Build enabled features array
        const enabledFeatures = [
          { 
            key: 'allow_ai_generation', 
            label: plan.allow_ai_generation 
              ? `Geração por IA (${plan.ai_generations_per_month || 0}/mês)` 
              : 'Geração por IA', 
            enabled: plan.allow_ai_generation ?? false
          },
          { 
            key: 'allow_video_upload', 
            label: plan.allow_video_upload 
              ? `Upload de Vídeos (${plan.video_storage_limit_mb || 0} MB)` 
              : 'Upload de Vídeos', 
            enabled: plan.allow_video_upload ?? false
          },
          { key: 'allow_gtm', label: 'Google Tag Manager', enabled: plan.allow_gtm ?? false },
          { key: 'allow_facebook_pixel', label: 'Facebook Pixel', enabled: plan.allow_facebook_pixel ?? false },
          { key: 'allow_white_label', label: 'White Label (remover marca)', enabled: plan.allow_white_label ?? false },
          { key: 'allow_webhook', label: 'Webhooks', enabled: plan.allow_webhook ?? false },
          { key: 'allow_export_pdf', label: 'Exportação PDF', enabled: plan.allow_export_pdf ?? false },
          { key: 'allow_quiz_sharing', label: 'Compartilhamento de Quiz', enabled: plan.allow_quiz_sharing ?? false },
          { key: 'allow_custom_domain', label: 'Domínio Personalizado', enabled: plan.allow_custom_domain ?? false },
          { key: 'integrations', label: 'Integrações Externas (CRM, E-mail, Automação)', enabled: true },
          { key: 'allow_heatmap', label: 'Heatmap de Respostas', enabled: (plan as any).allow_heatmap ?? false },
          { key: 'allow_ab_testing', label: 'Testes A/B de Quizzes', enabled: (plan as any).allow_ab_testing ?? false },
          { key: 'allow_quiz_branching', label: 'Perguntas Condicionais (Branching)', enabled: (plan as any).allow_quiz_branching ?? false },
          { key: 'allow_advanced_analytics', label: 'Analytics Avançado', enabled: (plan as any).allow_advanced_analytics ?? false },
        ];

        const planData: PricingPlan = {
          id: plan.plan_type,
          dbId: plan.id,
          name: plan.plan_name,
          price: formattedPrice,
          showPerMonth,
          description: plan.plan_name,
          features,
          enabledFeatures,
          highlighted: plan.plan_type === 'partner',
          popular: plan.is_popular ?? false,
          kiwifyCheckoutUrl: effectiveCheckoutUrl || null,
          ctaText: plan.plan_type === 'free' ? 'Criar conta grátis' : 'Assinar Agora',
          ctaVariant: (plan.is_popular ? 'default' : 'outline') as 'default' | 'outline',
          planType: plan.plan_type,
        };

        return planData;
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    plans: plans || [],
    isLoading,
    error
  };
};
