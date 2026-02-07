import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { handleError, showErrorToast, showSuccessToast } from '@/lib/errorHandler';
import { useTranslation } from 'react-i18next';
import type { Quiz, QuizTag } from '@/types';

interface DashboardStats {
  totalQuizzes: number;
  totalResponses: number;
  activeQuizzes: number;
}

interface ChartDataPoint {
  date: string;
  respostas: number;
}

interface QuizTagRelationData {
  tag_id: string;
  quiz_tags: QuizTag | null;
}

export interface QuizWithTags extends Quiz {
  quiz_tag_relations?: QuizTagRelationData[];
  tags?: QuizTag[];
}

/**
 * Hook to fetch dashboard statistics
 */
export const useDashboardStats = () => {
  const { t } = useTranslation();

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('id, status')
        .eq('user_id', user.id);

      if (quizzesError) throw quizzesError;

      const quizIds = quizzes?.map(q => q.id) || [];
      
      const { count: totalResponses, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
        .in('quiz_id', quizIds);

      if (responsesError) throw responsesError;

      const activeQuizzes = quizzes?.filter(q => q.status === 'active').length || 0;

      return {
        totalQuizzes: quizzes?.length || 0,
        totalResponses: totalResponses || 0,
        activeQuizzes
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2,
    meta: {
      errorMessage: t('dashboard.errorLoading')
    }
  });
};

/**
 * Hook to fetch recent quizzes with tags
 */
export const useRecentQuizzes = () => {
  const { t } = useTranslation();

  return useQuery<QuizWithTags[]>({
    queryKey: ['recent-quizzes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_tag_relations(
            tag_id,
            quiz_tags(id, name, color)
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return (quizzes as unknown as QuizWithTags[])?.map(quiz => ({
        ...quiz,
        tags: quiz.quiz_tag_relations?.map((rel: QuizTagRelationData) => rel.quiz_tags).filter((t): t is QuizTag => t !== null) || []
      })) || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    meta: {
      errorMessage: t('dashboard.errorLoading')
    }
  });
};

/**
 * Hook to fetch analytics chart data
 */
export const useChartData = () => {
  const { t } = useTranslation();

  return useQuery<ChartDataPoint[]>({
    queryKey: ['chart-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', user.id);

      const quizIds = quizzes?.map(q => q.id) || [];

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const { data: analyticsData } = await supabase
        .from('quiz_analytics')
        .select('date, completions')
        .gte('date', last7Days[0])
        .in('quiz_id', quizIds);

      return last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        respostas: analyticsData?.filter(a => a.date === date)
          .reduce((sum, a) => sum + (a.completions || 0), 0) || 0
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache for analytics
    retry: 1,
    meta: {
      errorMessage: t('dashboard.errorLoading')
    }
  });
};

/**
 * Hook to delete a quiz with all dependencies
 */
export const useDeleteQuiz = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quizId: string) => {
      try {
        // Step 1: Delete quiz_question_translations first (depends on quiz_questions)
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id')
          .eq('quiz_id', quizId);
        
        if (questions && questions.length > 0) {
          const questionIds = questions.map(q => q.id);
          await supabase
            .from('quiz_question_translations')
            .delete()
            .in('question_id', questionIds);
        }

        // Step 2: Delete all other dependencies
        const deleteTasks = [
          supabase.from('quiz_questions').delete().eq('quiz_id', quizId),
          supabase.from('quiz_results').delete().eq('quiz_id', quizId),
          supabase.from('quiz_responses').delete().eq('quiz_id', quizId),
          supabase.from('quiz_form_config').delete().eq('quiz_id', quizId),
          supabase.from('custom_form_fields').delete().eq('quiz_id', quizId),
          supabase.from('quiz_tag_relations').delete().eq('quiz_id', quizId),
          supabase.from('quiz_analytics').delete().eq('quiz_id', quizId),
          supabase.from('quiz_translations').delete().eq('quiz_id', quizId),
        ];

        const results = await Promise.all(deleteTasks);
        
        // Check if any deletion failed
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
          const errorMessages = errors.map(e => e.error?.message || 'Unknown error').join(', ');
          throw new Error(`Failed to delete dependencies: ${errorMessages}`);
        }

        // Step 3: Delete the quiz itself
        const { error } = await supabase
          .from('quizzes')
          .delete()
          .eq('id', quizId);

        if (error) throw error;
      } catch (error) {
        console.error('[DELETE QUIZ] Complete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      showSuccessToast(t('dashboard.quizDeleted'));
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['chart-data'] });
    },
    onError: (error) => {
      showErrorToast(error, 'Delete Quiz', t('dashboard.errorDeleting'));
    }
  });
};

/**
 * Hook to duplicate a quiz
 */
export const useDuplicateQuiz = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, newName }: { quizId: string; newName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get original quiz
      const { data: originalQuiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      // Create new quiz
      const { data: newQuiz, error: newQuizError } = await supabase
        .from('quizzes')
        .insert({
          ...originalQuiz,
          id: undefined,
          title: newName,
          slug: null,
          user_id: user.id,
          is_public: false,
          status: 'draft'
        })
        .select()
        .single();

      if (newQuizError) throw newQuizError;

      // Duplicate questions with explicit field mapping
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

      if (questions && questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          quiz_id: newQuiz.id,
          question_text: q.question_text,
          answer_format: q.answer_format,
          options: q.options,
          order_number: q.order_number,
          media_url: q.media_url,
          media_type: q.media_type,
          blocks: q.blocks,
          conditions: q.conditions,
          custom_label: q.custom_label
        }));
        
        const { error: questionsError } = await supabase
          .from('quiz_questions')
          .insert(questionsToInsert);
          
        if (questionsError) {
          console.error('[Duplicate] Failed to copy questions:', questionsError);
          throw new Error('Failed to duplicate questions');
        }
      }

      // Duplicate results (was missing!)
      const { data: quizResults } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('quiz_id', quizId);

      if (quizResults && quizResults.length > 0) {
        const resultsToInsert = quizResults.map(r => ({
          quiz_id: newQuiz.id,
          result_text: r.result_text,
          condition_type: r.condition_type,
          min_score: r.min_score,
          max_score: r.max_score,
          image_url: r.image_url,
          video_url: r.video_url,
          redirect_url: r.redirect_url,
          button_text: r.button_text,
          order_number: r.order_number,
          result_type: r.result_type,
          formula: r.formula,
          result_unit: r.result_unit,
          display_format: r.display_format,
          decimal_places: r.decimal_places,
          variable_mapping: r.variable_mapping,
          calculator_ranges: r.calculator_ranges
        }));
        
        const { error: resultsError } = await supabase
          .from('quiz_results')
          .insert(resultsToInsert);
          
        if (resultsError) {
          console.error('[Duplicate] Failed to copy results:', resultsError);
          // Non-critical, continue
        }
      }

      // Duplicate form config
      const { data: formConfig } = await supabase
        .from('quiz_form_config')
        .select('*')
        .eq('quiz_id', quizId)
        .maybeSingle();

      if (formConfig) {
        await supabase.from('quiz_form_config').insert({
          ...formConfig,
          id: undefined,
          quiz_id: newQuiz.id
        });
      }

      return newQuiz;
    },
    onSuccess: () => {
      showSuccessToast(t('dashboard.quizDuplicated'));
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
    },
    onError: (error) => {
      showErrorToast(error, 'Duplicate Quiz', t('dashboard.errorDuplicating'));
    }
  });
};
