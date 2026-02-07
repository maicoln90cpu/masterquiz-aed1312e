import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VideoProvider = 'supabase' | 'bunny';

export const useVideoProvider = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['video-provider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'video_provider')
        .single();

      if (error) {
        console.error('Error fetching video provider:', error);
        return 'supabase' as VideoProvider;
      }

      return (data?.setting_value as VideoProvider) || 'supabase';
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    provider: data || 'supabase',
    isBunny: data === 'bunny',
    isLoading
  };
};
