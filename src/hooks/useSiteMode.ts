import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteMode = 'A' | 'B';

/**
 * Hook que retorna o modo de monetização ativo do site.
 *
 * - **Modo A**: Freemium (planos gratuito + pagos)
 * - **Modo B**: Apenas pago (sem trial gratuito, preços diferenciados via `price_monthly_mode_b`)
 *
 * Cache de 1h (configuração global, raramente muda). Usado para definir
 * checkout, paywall e dashboards de comparação A×B.
 *
 * @returns `{ siteMode, isModeB, isLoading }`
 *
 * @see docs/MONETIZATION.md
 */
export const useSiteMode = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['site-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('site_mode')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    siteMode: (data?.site_mode as SiteMode) || 'A',
    isModeB: data?.site_mode === 'B',
    isLoading,
  };
};

export const useUpdateSiteMode = () => {
  const queryClient = useQueryClient();

  const updateSiteMode = async (mode: SiteMode) => {
    const { error } = await supabase
      .from('site_settings')
      .update({ site_mode: mode, updated_at: new Date().toISOString() })
      .not('id', 'is', null); // update all rows (there's only one)

    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['site-mode'] });
  };

  return { updateSiteMode };
};
