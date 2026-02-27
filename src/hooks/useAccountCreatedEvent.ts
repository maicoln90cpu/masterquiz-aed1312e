import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'mq_account_created_checked';

/**
 * Hook global que dispara o evento `account_created` no GTM/dataLayer.
 * Roda em qualquer rota autenticada (via RequireAuth).
 * 
 * Caminho 1: `mq_just_registered` no localStorage → dispara imediatamente
 * Caminho 2 (retroativo): consulta `profiles.account_created_event_sent` — sem limite de dias
 * Guard: sessionStorage para não re-consultar na mesma sessão
 */
export const useAccountCreatedEvent = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Guard: já verificou nesta sessão
    if (sessionStorage.getItem(SESSION_KEY) === 'true') return;

    const fireEvent = (userId: string, email: string | undefined, source: string) => {
      const w = window as Window & { dataLayer?: Record<string, unknown>[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: 'account_created',
        user_id: userId,
        user_email: email,
      });
      console.log(`🎯 [GTM] Event pushed: account_created (${source})`);
    };

    const run = async () => {
      // Caminho 1: flag de registro imediato
      const justRegistered = localStorage.getItem('mq_just_registered');
      if (justRegistered === 'true') {
        localStorage.removeItem('mq_just_registered');
        fireEvent(user.id, user.email, 'immediate');
        await supabase
          .from('profiles')
          .update({ account_created_event_sent: true } as any)
          .eq('id', user.id);
        sessionStorage.setItem(SESSION_KEY, 'true');
        return;
      }

      // Caminho 2: retroativo — sem limite de dias
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_created_event_sent')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && !(profile as any).account_created_event_sent) {
        fireEvent(user.id, user.email, 'retroactive');
        await supabase
          .from('profiles')
          .update({ account_created_event_sent: true } as any)
          .eq('id', user.id);
      }

      // Marcar sessão como verificada (independente do resultado)
      sessionStorage.setItem(SESSION_KEY, 'true');
    };

    run().catch((err) => console.error('[AccountCreatedEvent] Error:', err));
  }, [user]);
};
