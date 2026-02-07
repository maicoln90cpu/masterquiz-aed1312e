import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface LandingContent {
  id: string;
  key: string;
  value_pt: string | null;
  value_en: string | null;
  value_es: string | null;
  category: string | null;
  description: string | null;
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
  const queryClient = useQueryClient();

  const { data: allContent, isLoading, error } = useQuery({
    queryKey: ['landing-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_content')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as LandingContent[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - longer cache
    gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab focus
    refetchOnMount: false, // Don't refetch on component mount if fresh
  });

  // Get content value by key with current language fallback
  const getContent = (key: string, fallback?: string): string => {
    if (!allContent) return fallback || '';
    
    const item = allContent.find(c => c.key === key);
    if (!item) return fallback || '';

    const valueField = getValueField(i18n.language);
    const value = item[valueField];
    
    // Fallback chain: current lang -> pt -> fallback
    return value || item.value_pt || fallback || '';
  };

  // Get all content as a key-value map
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

  // Get content grouped by category
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

// Admin hook with mutation capabilities
export const useLandingContentAdmin = () => {
  const queryClient = useQueryClient();

  const { data: allContent, isLoading, error } = useQuery({
    queryKey: ['landing-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_content')
        .select('*')
        .order('category', { ascending: true });

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
      queryClient.invalidateQueries({ queryKey: ['landing-content'] });
    },
  });

  // Group content by category for admin UI
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
