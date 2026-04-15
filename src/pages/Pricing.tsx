import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { usePricingPlans } from "@/hooks/usePricingPlans";
import { useSiteMode } from "@/hooks/useSiteMode";
import { PricingCard } from "@/components/landing/PricingCard";
import { GuaranteeBanner } from "@/components/landing/GuaranteeBanner";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { pushGTMEvent } from "@/lib/gtmLogger";

export default function Pricing() {
  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plans: allPlans, isLoading } = usePricingPlans();
  const { isModeB } = useSiteMode();
  const plans = useMemo(() => {
    if (!isModeB) return allPlans;
    return allPlans.filter(p => p.planType !== 'free');
  }, [allPlans, isModeB]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const paywallFired = useRef(false);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  // 🎯 GTM: paywall_viewed — dispara 1x ao montar a página de preços
  useEffect(() => {
    if (paywallFired.current) return;
    const firePaywallViewed = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        paywallFired.current = true;
        pushGTMEvent('paywall_viewed', {
          source: 'pricing_page',
          user_id: user.id,
          current_plan: currentPlan || 'unknown',
        });
      }
    };
    firePaywallViewed();
  }, [currentPlan]);

  const loadCurrentSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('plan_type')
          .eq('user_id', user.id)
          .single();

        setCurrentPlan(subscription?.plan_type || 'free');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('pricing.backToDashboard')}
          </Button>
          <LanguageSwitch />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
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
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-green-500 shadow-lg">
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
