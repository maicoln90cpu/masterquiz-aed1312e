import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useSiteMode, SiteMode } from "@/hooks/useSiteMode";

interface LandingContent {
  id: string;
  key: string;
  value_pt: string | null;
  value_en: string | null;
  value_es: string | null;
  category: string | null;
  description: string | null;
  site_mode: string;
  updated_at: string;
}

type LanguageCode = 'pt' | 'en' | 'es';

const getValueField = (lang: string): keyof LandingContent => {
  if (lang.startsWith('en')) return 'value_en';
  if (lang.startsWith('es')) return 'value_es';
  return 'value_pt';
};

export const useLandingContent = () => {
  const { i18n } = useTranslation();
  const { siteMode } = useSiteMode();
  const queryClient = useQueryClient();

  const { data: allContent, isLoading, error } = useQuery({
    queryKey: ['landing-content', siteMode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_content')
        .select('*')
        .eq('site_mode', siteMode)
        .order('category', { ascending: true });

      if (error) throw error;
      return data as LandingContent[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const getContent = (key: string, fallback?: string): string => {
    if (!allContent) return fallback || '';
    
    const item = allContent.find(c => c.key === key);
    if (!item) return fallback || '';

    const valueField = getValueField(i18n.language);
    const value = item[valueField];
    
    return value || item.value_pt || fallback || '';
  };

  const getContentMap = (): Record<string, string> => {
    if (!allContent) return {};
    
    const map: Record<string, string> = {};
    const valueField = getValueField(i18n.language);
    
    allContent.forEach(item => {
      const value = item[valueField];
      map[item.key] = value || item.value_pt || '';
    });
    
    return map;
  };

  const getContentByCategory = (category: string): LandingContent[] => {
    if (!allContent) return [];
    return allContent.filter(c => c.category === category);
  };

  return {
    allContent,
    isLoading,
    error,
    getContent,
    getContentMap,
    getContentByCategory,
  };
};

// Admin hook with mutation capabilities — accepts explicit mode override
export const useLandingContentAdmin = (modeOverride?: SiteMode) => {
  const queryClient = useQueryClient();

  const { data: allContent, isLoading, error } = useQuery({
    queryKey: ['landing-content-admin', modeOverride || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('landing_content')
        .select('*')
        .order('category', { ascending: true });

      if (modeOverride) {
        query = query.eq('site_mode', modeOverride);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LandingContent[];
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({ 
      id, 
      value_pt, 
      value_en, 
      value_es 
    }: { 
      id: string; 
      value_pt?: string; 
      value_en?: string; 
      value_es?: string;
    }) => {
      const { error } = await supabase
        .from('landing_content')
        .update({ 
          value_pt, 
          value_en, 
          value_es,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-content-admin'] });
      queryClient.invalidateQueries({ queryKey: ['landing-content'] });
    },
  });

  const createContent = useMutation({
    mutationFn: async (content: Omit<LandingContent, 'id' | 'updated_at'>) => {
      const { error } = await supabase
        .from('landing_content')
        .insert(content);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-content-admin'] });
      queryClient.invalidateQueries({ queryKey: ['landing-content'] });
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-content-admin'] });
      queryClient.invalidateQueries({ queryKey: ['landing-content'] });
    },
  });

  const contentByCategory = allContent?.reduce((acc, item) => {
    const category = item.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, LandingContent[]>) || {};

  return {
    allContent,
    contentByCategory,
    isLoading,
    error,
    updateContent,
    createContent,
    deleteContent,
  };
};
