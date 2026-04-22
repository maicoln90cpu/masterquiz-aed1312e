import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  quizId: z.string().uuid(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  template: z.string().optional(),
  questions: z.array(z.any()).optional(),
  timestamp: z.string().optional(),
}).passthrough();

Deno.serve(async (req) => {
  const traceId = getTraceId(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'x-trace-id': traceId } });
  }

  try {
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { quizId, title, description, template, questions, timestamp } = parsed.data;

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { error: quizError } = await supabase.from('quizzes').update({
      title, description, template, updated_at: timestamp || new Date().toISOString(),
    }).eq('id', quizId);

    if (quizError) {
      return errorResponse('INTERNAL_ERROR', quizError.message, traceId, corsHeaders);
    }

    if (questions && Array.isArray(questions) && questions.length > 0) {
      await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
      const questionsToInsert = questions.map((q: any, index: number) => ({
        quiz_id: quizId,
        question_text: q.question_text || q.blocks?.find((b: any) => b.type === 'question')?.content || 'Pergunta',
        answer_format: q.answer_format || 'single_choice',
        options: q.options || [], blocks: q.blocks || [], order_number: index,
      }));
      const { error: qError } = await supabase.from('quiz_questions').insert(questionsToInsert);
      if (qError) console.error('Error inserting questions:', qError);
    }

    return okResponse({ success: true, quizId }, traceId, corsHeaders);
  } catch (error) {
    console.error('save-quiz-draft error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error)?.message || 'Erro interno', traceId, corsHeaders);
  }
});
