import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { useLandingABTest } from "@/hooks/useLandingABTest";

interface PricingCardProps {
  plan: {
    id: string;
    dbId?: string;
    name: string;
    price: string;
    showPerMonth?: boolean;
    description: string;
    features: string[];
    enabledFeatures?: Array<{
      key: string;
      label: string;
      enabled: boolean;
    }>;
    highlighted?: boolean;
    popular?: boolean;
    kiwifyCheckoutUrl?: string;
    ctaText: string;
    ctaVariant?: 'default' | 'outline';
  };
  index: number;
}

export const PricingCard = ({ plan, index }: PricingCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  const handleCTA = async () => {
    console.log('[PricingCard] handleCTA - 100% Kiwify mode', {
      planId: plan.id,
      planName: plan.name,
      kiwifyCheckoutUrl: plan.kiwifyCheckoutUrl,
    });

    pushGTMEvent('pricing_cta_click', {
      plan_type: plan.id,
      plan_name: plan.name,
      cta_location: 'landing_page',
      payment_gateway: 'kiwify',
    });

    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[PricingCard] No user, redirecting to login');
        navigate('/login');
        return;
      }

      // Plano gratuito -> dashboard
      if (plan.id === 'free') {
        console.log('[PricingCard] Free plan, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      // Planos pagos -> Kiwify
      if (plan.kiwifyCheckoutUrl) {
        console.log('[PricingCard] Redirecting to Kiwify:', plan.kiwifyCheckoutUrl);
        
        // Save A/B context for conversion tracking
        try {
          const abSessionId = localStorage.getItem('ab_session_id');
          const abVariant = localStorage.getItem('ab_variant');
          const abTestId = localStorage.getItem('ab_test_id');
          if (abSessionId) {
            localStorage.setItem('ab_conversion_pending', JSON.stringify({
              session_id: abSessionId,
              variant: abVariant,
              test_id: abTestId,
              plan_id: plan.id,
              email: user.email,
              timestamp: Date.now()
            }));
          }
        } catch (e) {
          console.warn('[PricingCard] Failed to save AB context:', e);
        }
        
        // 🎯 GTM: upgrade_clicked
        const { pushGTMEvent } = await import("@/lib/gtmLogger");
        pushGTMEvent('upgrade_clicked', {
          plan_type: plan.name,
          source: 'landing_pricing',
        });

        window.open(plan.kiwifyCheckoutUrl, '_blank');
        toast.success('Redirecionando para Kiwify...');
      } else {
        console.error('[PricingCard] No Kiwify URL configured for plan:', plan.name);
        toast.error('URL de checkout não configurada. Configure no painel admin.');
      }
    } catch (error: any) {
      console.error('[PricingCard] Error:', error);
      toast.error(error.message || 'Erro ao processar');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div 
      className="h-full animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Card 
        className={`h-full flex flex-col relative transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
          plan.popular || plan.highlighted
            ? 'border-2 border-primary shadow-2xl shadow-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:shadow-primary/30 hover:border-primary/80' 
            : 'border hover:shadow-xl hover:border-primary/30'
        }`}
      >
        {(plan.popular || plan.highlighted) && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-gradient-to-r from-primary via-primary/90 to-primary shadow-lg shadow-primary/50 animate-pulse px-4 py-1">
              <Sparkles className="h-3 w-3 mr-1 animate-spin" style={{ animationDuration: '3s' }} />
              {t('landing.pricing.popular')}
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4 pt-8">
          <h3 className={`text-xl font-semibold mb-3 transition-colors ${(plan.popular || plan.highlighted) ? 'text-primary' : ''}`}>
            {plan.name}
          </h3>
          <div className="mt-1">
            <span className={`text-4xl font-bold transition-all ${(plan.popular || plan.highlighted) ? 'bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent' : ''}`}>
              {plan.price}
            </span>
            {plan.showPerMonth && (
              <span className="text-muted-foreground text-base">{t('landing.pricing.perMonth')}</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-0">
          {/* Main Features (limits) */}
          <ul className="space-y-3 pb-4">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Divider */}
          {plan.enabledFeatures && plan.enabledFeatures.filter(f => f.enabled).length > 0 && (
            <div className="border-t border-border my-4" />
          )}

          {/* Boolean Features - Only show enabled ones */}
          {plan.enabledFeatures && plan.enabledFeatures.filter(f => f.enabled).length > 0 && (
            <ul className="space-y-3">
              {plan.enabledFeatures
                .filter(feature => feature.enabled)
                .map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature.label}</span>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            onClick={handleCTA}
            disabled={processing}
            variant={plan.ctaVariant || 'default'}
            className={`w-full transition-all duration-300 ${
              (plan.popular || plan.highlighted)
                ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105' 
                : 'hover:scale-105'
            }`}
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('pricing.processing')}
              </>
            ) : (
              plan.ctaText
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
