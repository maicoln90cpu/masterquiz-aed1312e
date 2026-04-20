import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePricingPlans } from "@/hooks/usePricingPlans";
import { useSiteMode } from "@/hooks/useSiteMode";
import { PricingCard } from "@/components/landing/PricingCard";
import { GuaranteeBanner } from "@/components/landing/GuaranteeBanner";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { incrementProfileCounter } from "@/lib/icpTracking";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Pricing() {
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plans: allPlans, isLoading } = usePricingPlans();
  const { isModeB } = useSiteMode();
  const { user } = useCurrentUser();
  const plans = useMemo(() => {
    if (!isModeB) return allPlans;
    return allPlans.filter(p => p.planType !== 'free');
  }, [allPlans, isModeB]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const paywallFired = useRef(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_type')
          .eq('user_id', user.id)
          .single();
        setCurrentPlan(subscription?.plan_type || 'free');
      } catch (error) {
        logger.error('Error loading subscription:', error);
      }
    })();
  }, [user]);

  // 🎯 GTM: paywall_viewed — dispara 1x ao montar a página de preços
  useEffect(() => {
    if (paywallFired.current) return;
    if (user) {
      paywallFired.current = true;
      pushGTMEvent('paywall_viewed', {
        source: 'pricing_page',
        user_id: user.id,
        current_plan: currentPlan || 'unknown',
      });
      incrementProfileCounter('paywall_hit_count'); // M04
    }
  }, [currentPlan, user]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header global da landing — garante navegação cross-page consistente */}
      <LandingHeader />

      <div className="container mx-auto px-4 py-12 pt-28">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        <GuaranteeBanner />

        {/* Plans Grid - using unified PricingCard */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isModeB ? 'lg:grid-cols-3 max-w-5xl' : 'lg:grid-cols-4 max-w-7xl'} gap-6 mx-auto`}>
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.planType;
            
            return (
              <div key={plan.dbId} className="relative">
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-success text-success-foreground shadow-lg">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('pricing.currentPlan')}
                  </Badge>
                )}
                <PricingCard 
                  plan={{
                    ...plan,
                    ctaText: isCurrentPlan 
                      ? t('pricing.currentPlanButton') 
                      : plan.ctaText,
                  }} 
                  index={index} 
                />
              </div>
            );
          })}
        </div>

        {/* Testimonials Section */}
        <div className="mt-16">
          <TestimonialsCarousel />
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">
              {t('landing.faq.title')}
            </h2>
          </div>
          <FAQAccordion />
        </div>
      </div>
    </main>
  );
}
