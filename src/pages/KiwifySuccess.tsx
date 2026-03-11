import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, PartyPopper, Clock } from "lucide-react";
import { PlanDetails } from "@/components/kiwify/PlanDetails";
import { QuickStart } from "@/components/kiwify/QuickStart";
import { PlatformFeatures } from "@/components/kiwify/PlatformFeatures";
import { NewUserFAQ } from "@/components/kiwify/NewUserFAQ";
import { SupportContacts } from "@/components/kiwify/SupportContacts";
import { useTranslation } from "react-i18next";
import { useSiteMode } from "@/hooks/useSiteMode";

export default function KiwifySuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isModeB } = useSiteMode();
  const [loading, setLoading] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [pollingTimeout, setPollingTimeout] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    planType: string;
  } | null>(null);

  useEffect(() => {
    // Confetti on load
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
    checkSubscription();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
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
        .select('plan_type, status, payment_confirmed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subscription) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('plan_name')
          .eq('plan_type', subscription.plan_type)
          .maybeSingle();

        setPlanInfo({
          planName: plan?.plan_name || subscription.plan_type,
          planType: subscription.plan_type
        });

        if (subscription.payment_confirmed) {
          setPaymentConfirmed(true);
          setLoading(false);
          return;
        }
      }

      // ✅ ETAPA 3: Start polling for payment_confirmed in Mode B
      if (isModeB) {
        setLoading(false);
        startPolling(user.id);
      } else {
        setPaymentConfirmed(true);
        setLoading(false);
      }
    } catch (error) {
      console.error(t('kiwifySuccess.errorVerifying'), error);
      setLoading(false);
    }
  };

  const startPolling = (userId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 * 3s = 60s timeout

    pollingRef.current = setInterval(async () => {
      attempts++;
      
      const { data } = await supabase
        .from('user_subscriptions')
        .select('payment_confirmed, plan_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.payment_confirmed) {
        setPaymentConfirmed(true);
        if (pollingRef.current) clearInterval(pollingRef.current);

        // Update plan info if changed
        if (data.plan_type) {
          const { data: plan } = await supabase
            .from('subscription_plans')
            .select('plan_name')
            .eq('plan_type', data.plan_type)
            .maybeSingle();

          setPlanInfo({
            planName: plan?.plan_name || data.plan_type,
            planType: data.plan_type
          });
        }
      }

      if (attempts >= maxAttempts) {
        setPollingTimeout(true);
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    }, 3000);
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

  // ✅ ETAPA 3: Waiting for payment confirmation (Mode B)
  if (isModeB && !paymentConfirmed && !pollingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-semibold">Verificando pagamento...</h2>
          <p className="text-muted-foreground">
            Estamos confirmando seu pagamento com a Kiwify. Isso pode levar alguns segundos.
          </p>
        </div>
      </div>
    );
  }

  // ✅ ETAPA 3: Timeout - payment not confirmed yet
  if (isModeB && !paymentConfirmed && pollingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <Clock className="h-10 w-10 mx-auto text-warning" />
          <h2 className="text-xl font-semibold">Pagamento em processamento</h2>
          <p className="text-muted-foreground">
            Seu pagamento está sendo processado pela Kiwify. Isso pode levar alguns minutos.
            Você receberá acesso assim que for confirmado.
          </p>
          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={() => {
              setPollingTimeout(false);
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) startPolling(user.id);
              });
            }}>
              Verificar novamente
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              Ir para Dashboard
            </Button>
          </div>
          <SupportContacts />
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
          <div className="space-y-6">
            {planInfo && (
              <PlanDetails 
                planName={planInfo.planName} 
                planType={planInfo.planType} 
              />
            )}
            <QuickStart />
          </div>

          <div className="space-y-6">
            <PlatformFeatures />
          </div>

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
