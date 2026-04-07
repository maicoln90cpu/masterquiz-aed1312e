import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useTranslation } from "react-i18next";
import { useSiteMode } from "@/hooks/useSiteMode";

interface Plan {
  id: string;
  plan_name: string;
  plan_type: string;
  price_monthly: number;
  price_monthly_mode_b?: number | null;
  quiz_limit: number;
  response_limit: number;
  features: any;
  allowed_templates: any;
  allow_facebook_pixel: boolean;
  allow_gtm: boolean;
  display_order: number;
  kiwify_checkout_url?: string;
  kiwify_checkout_url_mode_b?: string | null;
}

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription } = useSubscriptionLimits();
  const { isModeB } = useSiteMode();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();

    // Check payment status from URL
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success(t('checkout.paymentSuccess'));
      navigate('/checkout', { replace: true });
    } else if (paymentStatus === 'cancelled') {
      toast.error(t('checkout.paymentCancelled'));
      navigate('/checkout', { replace: true });
    }
  }, [searchParams, t]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error(t('checkout.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (plan: Plan) => {
    setCheckingOut(plan.id);
    try {
      // Use Mode B checkout URL if available
      const checkoutUrl = isModeB && plan.kiwify_checkout_url_mode_b
        ? plan.kiwify_checkout_url_mode_b
        : plan.kiwify_checkout_url;

      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        toast.success(t('checkout.redirecting'));
        return;
      }

      toast.error(t('checkout.urlNotConfigured'));
    } catch (error: any) {
      console.error('Error redirecting to Kiwify:', error);
      toast.error(error.message || t('checkout.paymentError'));
    } finally {
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  const currentPlanType = subscription?.plan_type || 'free';

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <LanguageSwitch />
          </div>
          <h1 className="text-3xl font-bold">{t('pricing.title')}</h1>
          <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.plan_type === currentPlanType;
            const isFree = plan.plan_type === 'free';
            
            return (
              <Card 
                key={plan.id} 
                className={isCurrent ? 'border-primary shadow-lg relative' : ''}
              >
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {t('checkout.currentPlan')}
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
                  <CardDescription>
                    {(() => {
                      const effectivePrice = isModeB && plan.price_monthly_mode_b != null
                        ? plan.price_monthly_mode_b
                        : plan.price_monthly;
                      return (
                        <>
                          <span className="text-3xl font-bold text-foreground">
                            {isFree ? 'R$ 0' : `R$ ${effectivePrice.toFixed(2)}`}
                          </span>
                          {!isFree && <span className="text-muted-foreground">{t('checkout.perMonth')}</span>}
                        </>
                      );
                    })()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">{t('checkout.features')}</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>
                          {plan.quiz_limit === 999 
                            ? t('checkout.unlimitedQuizzes') 
                            : `${plan.quiz_limit} quizzes`}
                        </span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{plan.response_limit.toLocaleString()} {t('responses.title') === 'Respostas dos Quizzes' ? 'respostas/mês' : 'responses/month'}</span>
                      </li>
                      {plan.allow_facebook_pixel && (
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Facebook Pixel</span>
                        </li>
                      )}
                      {plan.allow_gtm && (
                        <li className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>Google Tag Manager</span>
                        </li>
                      )}
                      {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className="w-full" 
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || isFree || checkingOut === plan.id}
                    onClick={() => handleCheckout(plan)}
                  >
                    {checkingOut === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('checkout.processing')}
                      </>
                    ) : isCurrent ? (
                      t('checkout.currentPlanButton')
                    ) : isFree ? (
                      t('checkout.freePlan')
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {t('checkout.subscribeNow')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
