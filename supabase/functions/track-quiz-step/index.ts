import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

const BodySchema = z.object({
  quizId: z.string().uuid(),
  sessionId: z.string().min(1),
  stepNumber: z.number().int().min(0),
  questionId: z.string().uuid().optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { quizId, sessionId, stepNumber, questionId } = parsed.data;

    const { data: quiz } = await supabase.from('quizzes').select('id').eq('id', quizId).maybeSingle();
    if (!quiz) return errorResponse('NOT_FOUND', 'Quiz not found', traceId, corsHeaders);

    const today = new Date().toISOString().split('T')[0];
    const { data: result, error } = await supabase.from('quiz_step_analytics').upsert(
      { quiz_id: quizId, session_id: sessionId, step_number: stepNumber, question_id: questionId || null, date: today },
      { onConflict: 'quiz_id,session_id,step_number', ignoreDuplicates: true }
    ).select().maybeSingle();

    if (error) throw error;

    return okResponse({ result }, traceId, corsHeaders);
  } catch (error) {
    console.error('[track-quiz-step] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Unable to track step', traceId, corsHeaders);
  }
});
