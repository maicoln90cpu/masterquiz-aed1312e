import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { requireAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

const BodySchema = z.object({
  quiz_id: z.string().uuid(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  const auth = await requireAuth(req, traceId, corsHeaders);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, BodySchema, traceId);
  if (parsed instanceof Response) return parsed;
  const { quiz_id, start_date, end_date } = parsed.data;

  try {
    const { supabase, user } = auth;
    const { data: quiz } = await supabase
      .from('quizzes').select('*')
      .eq('id', quiz_id).eq('user_id', user.id).maybeSingle();
    if (!quiz) return errorResponse('NOT_FOUND', 'Quiz not found', traceId, corsHeaders);

    let analyticsQuery = supabase
      .from('quiz_analytics').select('*')
      .eq('quiz_id', quiz_id).order('date', { ascending: true });
    if (start_date) analyticsQuery = analyticsQuery.gte('date', start_date);
    if (end_date) analyticsQuery = analyticsQuery.lte('date', end_date);
    const { data: analytics } = await analyticsQuery;

    let responsesQuery = supabase
      .from('quiz_responses').select('*')
      .eq('quiz_id', quiz_id).order('completed_at', { ascending: false });
    if (start_date) responsesQuery = responsesQuery.gte('completed_at', `${start_date}T00:00:00`);
    if (end_date) responsesQuery = responsesQuery.lte('completed_at', `${end_date}T23:59:59`);
    const { data: responses } = await responsesQuery;

    const { data: results } = await supabase
      .from('quiz_results').select('*').eq('quiz_id', quiz_id);
    const { data: questions } = await supabase
      .from('quiz_questions').select('*').eq('quiz_id', quiz_id).order('order_number');

    const totalViews = (analytics || []).reduce((s, a) => s + (a.views || 0), 0);
    const totalStarts = (analytics || []).reduce((s, a) => s + (a.starts || 0), 0);
    const totalCompletions = (analytics || []).reduce((s, a) => s + (a.completions || 0), 0);
    const avgCompletionTime = (analytics || []).reduce((s, a) => s + (a.avg_completion_time || 0), 0) / Math.max((analytics || []).length, 1);
    const conversionRate = totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(1) : '0';

    const resultDistribution: Record<string, number> = {};
    for (const response of responses || []) {
      const resultId = response.result_id || 'unknown';
      resultDistribution[resultId] = (resultDistribution[resultId] || 0) + 1;
    }

    const reportData = {
      quiz: { id: quiz.id, title: quiz.title, description: quiz.description, status: quiz.status, created_at: quiz.created_at },
      period: { start: start_date || 'all', end: end_date || 'all' },
      summary: {
        total_views: totalViews, total_starts: totalStarts, total_completions: totalCompletions,
        conversion_rate: `${conversionRate}%`,
        avg_completion_time_seconds: Math.round(avgCompletionTime),
        total_leads: (responses || []).filter((r) => r.respondent_email || r.respondent_whatsapp).length,
      },
      daily_analytics: analytics || [],
      questions_count: (questions || []).length,
      results_count: (results || []).length,
      result_distribution: resultDistribution,
      responses_count: (responses || []).length,
      generated_at: new Date().toISOString(),
    };

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'quiz:generate_report',
      resource_type: 'quiz',
      resource_id: quiz_id,
      metadata: { period: { start_date, end_date }, total_responses: reportData.responses_count, trace_id: traceId },
    });

    return okResponse(reportData, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[generate-pdf-report]', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});
