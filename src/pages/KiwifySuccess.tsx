import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, PartyPopper } from "lucide-react";
import { PlanDetails } from "@/components/kiwify/PlanDetails";
import { QuickStart } from "@/components/kiwify/QuickStart";
import { PlatformFeatures } from "@/components/kiwify/PlatformFeatures";
import { NewUserFAQ } from "@/components/kiwify/NewUserFAQ";
import { SupportContacts } from "@/components/kiwify/SupportContacts";
import { useTranslation } from "react-i18next";

export default function KiwifySuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    planType: string;
  } | null>(null);

  useEffect(() => {
    // Dispara confetti ao carregar
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Verifica assinatura do usuário
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscription) {
        // Buscar nome do plano
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('plan_name')
          .eq('plan_type', subscription.plan_type)
          .maybeSingle();

        setPlanInfo({
          planName: plan?.plan_name || subscription.plan_type,
          planType: subscription.plan_type
        });
      }
    } catch (error) {
      console.error(t('kiwifySuccess.errorVerifying'), error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('kiwifySuccess.verifyingSubscription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="pt-16 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">
              {t('kiwifySuccess.paymentConfirmed')}
            </h1>
            <PartyPopper className="h-8 w-8 text-primary scale-x-[-1]" />
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('kiwifySuccess.congratulations')}
          </p>

          <Button 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            className="mt-4"
          >
            {t('kiwifySuccess.goToDashboard')}
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Coluna 1 */}
          <div className="space-y-6">
            {planInfo && (
              <PlanDetails 
                planName={planInfo.planName} 
                planType={planInfo.planType} 
              />
            )}
            <QuickStart />
          </div>

          {/* Coluna 2 */}
          <div className="space-y-6">
            <PlatformFeatures />
          </div>

          {/* Coluna 3 */}
          <div className="space-y-6 md:col-span-2 lg:col-span-1">
            <NewUserFAQ />
            <SupportContacts />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            {t('kiwifySuccess.needHelp')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t('kiwifySuccess.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </div>
  );
}
