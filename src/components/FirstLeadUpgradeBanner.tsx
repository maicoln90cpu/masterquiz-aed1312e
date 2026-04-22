import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function FirstLeadUpgradeBanner() {
  const { user } = useCurrentUser();
  const { planType } = useSubscriptionLimits();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    // Only show for free plan users
    if (planType !== 'free') return;

    const checkNotification = async () => {
      const { data } = await supabase
        .from('admin_notifications')
        .select('id, read')
        .eq('user_id', user.id)
        .eq('type', 'first_lead_upgrade')
        .eq('read', false)
        .maybeSingle();

      if (data) {
        setNotificationId(data.id);
        setVisible(true);
      }
    };

    checkNotification();
  }, [user?.id, planType]);

  const dismiss = async () => {
    setVisible(false);
    if (notificationId) {
      await supabase
        .from('admin_notifications')
        .update({ read: true } as any)
        .eq('id', notificationId);
    }
  };

  const goToPlans = async () => {
    await dismiss();
    navigate('/precos');
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4"
      >
        <button
type="button" onClick={dismiss}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              🎉 Seu primeiro lead chegou!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Para receber mais leads sem limite, faça upgrade do seu plano.
            </p>
          </div>
          <Button size="sm" onClick={goToPlans} className="shrink-0 gap-1.5">
            Ver planos <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
