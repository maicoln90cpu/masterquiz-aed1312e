import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from './useCurrentUser';

interface Tag {
  id: string;
  name: string;
  color: string;
}

/**
 * Hook to fetch user's tags
 */
export const useTagsData = () => {
  const { t } = useTranslation();

  return useQuery<Tag[]>({
    queryKey: ['user-tags'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('quiz_tags')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    meta: {
      errorMessage: 'Erro ao carregar tags'
    }
  });
};

/**
 * Hook to invalidate tags cache
 */
export const useInvalidateTags = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['user-tags'] });
    queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
  };
};
