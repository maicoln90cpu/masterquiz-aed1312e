import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { quizTemplates as hardcodedTemplates } from '@/data/quizTemplates';
import { premiumQuizTemplates as hardcodedPremiumTemplates } from '@/data/premiumQuizTemplates';
import { QuizTemplate } from '@/data/quizTemplates';
import type { TemplatePreviewConfig, TemplateFullConfig } from '@/types';

export interface DBTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  is_active: boolean;
  is_premium: boolean;
  display_order: number;
  preview_config: TemplatePreviewConfig;
  full_config: TemplateFullConfig;
}

const convertDBTemplateToQuizTemplate = (dbTemplate: DBTemplate): QuizTemplate => {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description || '',
    category: dbTemplate.category as QuizTemplate['category'],
    icon: dbTemplate.icon || '📝',
    preview: dbTemplate.preview_config as unknown as QuizTemplate['preview'],
    config: dbTemplate.full_config as unknown as QuizTemplate['config']
  };
};

export const useQuizTemplates = () => {
  const { data: dbTemplates, isLoading, error } = useQuery({
    queryKey: ['quiz-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching templates from database:', error);
        throw error;
      }

      return data as unknown as DBTemplate[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Query para verificar se existem templates no banco (ativos ou não)
  const { data: totalCount } = useQuery({
    queryKey: ['quiz-templates-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('quiz_templates')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Se existem templates no banco (mesmo que inativos), NÃO usar fallback
  const hasTemplatesInDB = totalCount !== undefined && totalCount > 0;
  
  const templates = hasTemplatesInDB
    ? (dbTemplates || []).map(convertDBTemplateToQuizTemplate)
    : [...hardcodedTemplates, ...hardcodedPremiumTemplates];

  // ✅ CORREÇÃO: Usar APENAS o campo is_premium do banco, não verificar string no ID
  const normalTemplates = templates.filter(t => {
    const dbTemplate = dbTemplates?.find(dt => dt.id === t.id);
    // Se veio do banco, usar is_premium do banco; senão, considerar não-premium
    return dbTemplate ? !dbTemplate.is_premium : true;
  });
  
  const premiumTemplates = templates.filter(t => {
    const dbTemplate = dbTemplates?.find(dt => dt.id === t.id);
    // Só é premium se is_premium === true no banco
    return dbTemplate?.is_premium === true;
  });

  return {
    templates,
    normalTemplates,
    premiumTemplates,
    dbTemplates, // Expor para uso no selector
    isLoading,
    error,
    usingFallback: !dbTemplates || dbTemplates.length === 0
  };
};

export const useAllQuizTemplates = () => {
  const { data: dbTemplates, isLoading, error, refetch } = useQuery({
    queryKey: ['all-quiz-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching all templates:', error);
        throw error;
      }

      return data as unknown as DBTemplate[];
    },
    staleTime: 2 * 60 * 1000,
  });

  return {
    templates: dbTemplates || [],
    isLoading,
    error,
    refetch
  };
};
