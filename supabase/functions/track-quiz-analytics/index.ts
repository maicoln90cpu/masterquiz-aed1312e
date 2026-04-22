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
  quizId: z.string().uuid('quizId deve ser UUID'),
  event: z.enum(['view', 'start', 'complete']),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { quizId, event } = parsed.data;

    const { data: quiz } = await supabase.from('quizzes').select('id').eq('id', quizId).maybeSingle();
    if (!quiz) return errorResponse('NOT_FOUND', 'Quiz not found', traceId, corsHeaders);

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('quiz_analytics').select('*').eq('quiz_id', quizId).eq('date', today).maybeSingle();

    const updates: Record<string, unknown> = {
      quiz_id: quizId, date: today,
      views: existing?.views || 0, starts: existing?.starts || 0, completions: existing?.completions || 0
    };
    if (event === 'view') updates.views = (existing?.views || 0) + 1;
    if (event === 'start') updates.starts = (existing?.starts || 0) + 1;
    if (event === 'complete') updates.completions = (existing?.completions || 0) + 1;

    const { data: result, error } = await supabase.from('quiz_analytics').upsert(updates, { onConflict: 'quiz_id,date' }).select().maybeSingle();
    if (error) throw error;

    return okResponse({ result }, traceId, corsHeaders);
  } catch (error) {
    console.error('[TRACK-ANALYTICS] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Unable to track analytics', traceId, corsHeaders);
  }
});
