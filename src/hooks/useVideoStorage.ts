import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlanFeatures } from "./usePlanFeatures";

export const useVideoStorage = () => {
  const { allowVideoUpload, videoStorageLimitMb, isMasterAdmin, isLoading: planLoading } = usePlanFeatures();

  const { data: usage, isLoading: usageLoading, refetch } = useQuery({
    queryKey: ['video-usage'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('video_usage')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar uso de vídeo:', error);
      }

      return data || { 
        total_size_mb: 0, 
        video_count: 0,
        bunny_size_mb: 0,
        bunny_video_count: 0
      };
    },
    enabled: allowVideoUpload || isMasterAdmin
  });

  // Use bunny_size_mb if available, otherwise fallback to total_size_mb
  const usedMb = usage?.bunny_size_mb ?? usage?.total_size_mb ?? 0;
  const videoCount = usage?.bunny_video_count ?? usage?.video_count ?? 0;

  const checkCanUploadVideo = (fileSizeMb: number): { canUpload: boolean; reason?: string } => {
    // Master admin sempre pode fazer upload
    if (isMasterAdmin) {
      return { canUpload: true };
    }

    if (!allowVideoUpload) {
      return {
        canUpload: false,
        reason: 'Seu plano não permite upload de vídeos. Faça upgrade para desbloquear.'
      };
    }

    const limitMb = videoStorageLimitMb || 0;

    if (limitMb === 0) {
      return {
        canUpload: false,
        reason: 'Limite de storage não configurado. Entre em contato com o suporte.'
      };
    }

    const remainingMb = limitMb - usedMb;

    if (fileSizeMb > remainingMb) {
      return {
        canUpload: false,
        reason: `Espaço insuficiente. Você tem ${remainingMb.toFixed(2)}MB disponíveis e precisa de ${fileSizeMb.toFixed(2)}MB.`
      };
    }

    return { canUpload: true };
  };

  const limitMb = isMasterAdmin ? 999999 : videoStorageLimitMb || 0;

  return {
    allowVideoUpload: isMasterAdmin || allowVideoUpload,
    videoStorageLimitMb: limitMb,
    usedMb,
    videoCount,
    remainingMb: isMasterAdmin ? 999999 : limitMb - usedMb,
    usagePercentage: isMasterAdmin ? 0 : (limitMb > 0 
      ? (usedMb / limitMb) * 100 
      : 0),
    checkCanUploadVideo,
    refetch,
    isLoading: planLoading || usageLoading,
    isUnlimited: isMasterAdmin
  };
};
