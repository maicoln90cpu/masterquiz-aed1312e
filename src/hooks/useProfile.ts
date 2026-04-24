import { logger } from '@/lib/logger';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { trackOperation } from '@/lib/performanceCapture';
import type { Profile } from '@/types';

// 4.1: Lista de colunas lidas pelos consumidores de useProfile.
// ⚠️ Ao adicionar leitura de uma nova coluna de `profiles` em qualquer
// componente que use useProfile(), INCLUIR a coluna aqui — caso contrário
// virá `undefined`. Evite voltar a `select('*')`: payload era ~3,7s P95.
const PROFILE_COLUMNS =
  'id, email, full_name, whatsapp, company_slug, facebook_pixel_id, gtm_container_id, user_objectives, user_stage, login_count, objective_selected_at, deleted_at, created_at, updated_at';

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // 4.1: TanStack Query com staleTime de 5min (era useEffect direto a cada mount).
  // Profile muda raramente; updateProfile faz setQueryData manual abaixo.
  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await trackOperation('profile_fetch', 'query', async () =>
        await supabase
          .from('profiles')
          .select(PROFILE_COLUMNS)
          .eq('id', user.id)
          .single()
      );

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching profile:', error);
        return null;
      }
      return (data as unknown as Profile) ?? null;
    },
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
        .select(PROFILE_COLUMNS)
        .single();

      if (error) return { error };

      // Atualiza cache local imediatamente (sem refetch)
      queryClient.setQueryData(['profile', user.id], data as unknown as Profile);
      return { data, error: null };
    } catch (error) {
      return { error, data: null };
    }
  };

  return {
    profile: profile ?? null,
    loading: isLoading || authLoading,
    updateProfile,
  };
};
