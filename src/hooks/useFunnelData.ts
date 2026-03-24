import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

interface FunnelStep {
  stepNumber: number;
  label: string;
  count: number;
  questionId?: string;
}

interface UseFunnelDataOptions {
  quizId?: string;
  startDate?: string;
  endDate?: string;
}

export function useFunnelData(options: UseFunnelDataOptions = {}) {
  const { quizId, startDate, endDate } = options;

  return useQuery({
    queryKey: ['funnel-data', quizId, startDate, endDate],
    queryFn: async (): Promise<FunnelStep[]> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Primeiro buscar os quiz_ids do usuário
        let quizQuery = supabase
          .from('quizzes')
          .select('id')
          .eq('user_id', user.id);

        const { data: userQuizzes, error: quizError } = await quizQuery;
        
        if (quizError || !userQuizzes || userQuizzes.length === 0) {
          return [];
        }

        const userQuizIds = userQuizzes.map(q => q.id);
        const targetQuizIds = quizId ? [quizId].filter(id => userQuizIds.includes(id)) : userQuizIds;

        if (targetQuizIds.length === 0) return [];

        // Buscar step analytics filtrado pelos quizzes do usuário
        let stepQuery = supabase
          .from('quiz_step_analytics')
          .select('step_number, session_id, question_id, quiz_id')
          .in('quiz_id', targetQuizIds);

        if (startDate) {
          stepQuery = stepQuery.gte('date', startDate);
        }

        if (endDate) {
          stepQuery = stepQuery.lte('date', endDate);
        }

        const { data: rawData, error: rawError } = await stepQuery;

        if (rawError) {
          console.error('Error fetching funnel data:', rawError);
          return [];
        }

        if (!rawData || rawData.length === 0) {
          return [];
        }

        // Agregar por step_number contando sessões únicas
        const stepMap = new Map<number, {
          count: number;
          questionId?: string;
          sessions: Set<string>;
        }>();

        rawData.forEach(row => {
          if (!stepMap.has(row.step_number)) {
            stepMap.set(row.step_number, {
              count: 0,
              questionId: row.question_id || undefined,
              sessions: new Set()
            });
          }
          const step = stepMap.get(row.step_number)!;
          step.sessions.add(row.session_id);
          step.count = step.sessions.size;
        });

        // Buscar nomes das perguntas (com blocos para texto real)
        const questionIds = Array.from(stepMap.values())
          .map(s => s.questionId)
          .filter(Boolean) as string[];

        const questionNames = new Map<string, string>();
        if (questionIds.length > 0) {
          const { data: questions } = await supabase
            .from('quiz_questions')
            .select('id, question_text, blocks')
            .in('id', questionIds);
          
          questions?.forEach(q => {
            // Extract real text from blocks if available
            let text = q.question_text;
            if (Array.isArray(q.blocks)) {
              const qBlock = (q.blocks as any[]).find((b: any) => b.type === 'question');
              if (qBlock?.questionText) {
                text = qBlock.questionText.replace(/<[^>]*>/g, '').trim() || text;
              }
            }
            questionNames.set(q.id, text);
          });
        }

        // Converter para array ordenado
        const funnelSteps: FunnelStep[] = Array.from(stepMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([stepNumber, data]) => ({
            stepNumber,
            label: stepNumber === 0 
              ? 'Início do Quiz'
              : data.questionId && questionNames.has(data.questionId)
                ? `Pergunta ${stepNumber}: ${questionNames.get(data.questionId)?.substring(0, 30)}...`
                : `Etapa ${stepNumber}`,
            count: data.count,
            questionId: data.questionId
          }));

        return funnelSteps;
      } catch (error) {
        console.error('Error in useFunnelData:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
