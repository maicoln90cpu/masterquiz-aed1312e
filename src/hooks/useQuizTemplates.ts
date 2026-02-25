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
    preview: (dbTemplate.preview_config as unknown as QuizTemplate['preview']) || {
      title: '',
      description: '',
      questionCount: 5,
      template: 'moderno'
    },
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
    staleTime: 5 * 60 * 1000,
  });

  // ✅ CORREÇÃO: Mesclar hardcoded + banco, priorizando hardcoded por ID
  // Isso garante que os templates de funil aparecem no selector mesmo com banco populado
  const mergedTemplates = (() => {
    const allHardcoded = [...hardcodedTemplates, ...hardcodedPremiumTemplates];

    if (!dbTemplates || dbTemplates.length === 0) {
      return allHardcoded;
    }

    // Começar com todos os hardcoded
    const templateMap = new Map<string, QuizTemplate>();
    allHardcoded.forEach(t => templateMap.set(t.id, t));

    // Adicionar do banco os que NÃO existem no hardcoded
    dbTemplates.forEach(dt => {
      if (!templateMap.has(dt.id)) {
        templateMap.set(dt.id, convertDBTemplateToQuizTemplate(dt));
      }
    });

    return Array.from(templateMap.values());
  })();

  // ✅ Separar normais e premium
  // Premium: se veio do banco, usar is_premium do banco; se hardcoded premium, marcar como premium
  const premiumIds = new Set(hardcodedPremiumTemplates.map(t => t.id));

  const normalTemplates = mergedTemplates.filter(t => {
    const dbT = dbTemplates?.find(dt => dt.id === t.id);
    if (dbT) return !dbT.is_premium;
    return !premiumIds.has(t.id);
  });

  const premiumTemplates = mergedTemplates.filter(t => {
    const dbT = dbTemplates?.find(dt => dt.id === t.id);
    if (dbT) return dbT.is_premium === true;
    return premiumIds.has(t.id);
  });

  return {
    templates: mergedTemplates,
    normalTemplates,
    premiumTemplates,
    dbTemplates,
    isLoading,
    error,
    usingFallback: !dbTemplates || dbTemplates.length === 0
  };
};

export interface AdminTemplate {
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
  source: 'hardcoded' | 'database';
  question_count?: number;
}

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

  // Mesclar hardcoded + DB para visão completa no admin
  const allTemplates: AdminTemplate[] = (() => {
    const allHardcoded = [...hardcodedTemplates, ...hardcodedPremiumTemplates];
    const dbIds = new Set((dbTemplates || []).map(t => t.id));
    const premiumIds = new Set(hardcodedPremiumTemplates.map(t => t.id));

    // Templates base hardcoded (ordens 1-9)
    const baseOnly: AdminTemplate[] = hardcodedTemplates
      .filter(t => !dbIds.has(t.id))
      .map((t, i) => ({
        id: t.id,
        name: t.name,
        description: t.description || null,
        category: t.category,
        icon: t.icon || '📝',
        is_active: true,
        is_premium: false,
        display_order: i + 1,
        preview_config: t.preview as unknown as TemplatePreviewConfig,
        full_config: t.config as unknown as TemplateFullConfig,
        source: 'hardcoded' as const,
        question_count: t.config?.questions?.length || 0,
      }));

    // Templates premium hardcoded (ordens 10-14)
    const premiumOnly: AdminTemplate[] = hardcodedPremiumTemplates
      .filter(t => !dbIds.has(t.id))
      .map((t, i) => ({
        id: t.id,
        name: t.name,
        description: t.description || null,
        category: t.category,
        icon: t.icon || '📝',
        is_active: true,
        is_premium: true,
        display_order: hardcodedTemplates.length + i + 1,
        preview_config: t.preview as unknown as TemplatePreviewConfig,
        full_config: t.config as unknown as TemplateFullConfig,
        source: 'hardcoded' as const,
        question_count: t.config?.questions?.length || 0,
      }));

    // Templates do banco (ordens 15+)
    const totalHardcoded = hardcodedTemplates.length + hardcodedPremiumTemplates.length;
    const fromDB: AdminTemplate[] = (dbTemplates || []).map((dt, i) => ({
      ...dt,
      display_order: dt.display_order ?? (totalHardcoded + i + 1),
      source: 'database' as const,
    }));

    return [...baseOnly, ...premiumOnly, ...fromDB];
  })();

  return {
    templates: allTemplates,
    isLoading,
    error,
    refetch
  };
};
