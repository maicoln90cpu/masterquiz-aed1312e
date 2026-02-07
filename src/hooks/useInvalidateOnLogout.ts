// ✅ ITEM 4: Hook para invalidar cache ao fazer logout
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useInvalidateOnLogout = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        logger.auth('Clearing React Query cache on logout');
        queryClient.clear();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [queryClient]);
};
