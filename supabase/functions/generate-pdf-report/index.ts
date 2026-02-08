import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { quiz_id, start_date, end_date } = await req.json();

    if (!quiz_id) {
      return new Response(
        JSON.stringify({ error: 'quiz_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que o quiz pertence ao usuário
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quiz_id)
      .eq('user_id', user.id)
      .single();

    if (quizError || !quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do relatório
    let analyticsQuery = supabase
      .from('quiz_analytics')
      .select('*')
      .eq('quiz_id', quiz_id)
      .order('date', { ascending: true });

    if (start_date) {
      analyticsQuery = analyticsQuery.gte('date', start_date);
    }
    if (end_date) {
      analyticsQuery = analyticsQuery.lte('date', end_date);
    }

    const { data: analytics } = await analyticsQuery;

    // Buscar respostas
    let responsesQuery = supabase
      .from('quiz_responses')
      .select('*')
      .eq('quiz_id', quiz_id)
      .order('completed_at', { ascending: false });

    if (start_date) {
      responsesQuery = responsesQuery.gte('completed_at', `${start_date}T00:00:00`);
    }
    if (end_date) {
      responsesQuery = responsesQuery.lte('completed_at', `${end_date}T23:59:59`);
    }

    const { data: responses } = await responsesQuery;

    // Buscar resultados
    const { data: results } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quiz_id);

    // Buscar perguntas
    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz_id)
      .order('order_number');

    // Calcular estatísticas
    const totalViews = (analytics || []).reduce((sum, a) => sum + (a.views || 0), 0);
    const totalStarts = (analytics || []).reduce((sum, a) => sum + (a.starts || 0), 0);
    const totalCompletions = (analytics || []).reduce((sum, a) => sum + (a.completions || 0), 0);
    const avgCompletionTime = (analytics || []).reduce((sum, a) => sum + (a.avg_completion_time || 0), 0) / Math.max((analytics || []).length, 1);
    const conversionRate = totalViews > 0 ? ((totalCompletions / totalViews) * 100).toFixed(1) : '0';

    // Contar resultados por tipo
    const resultDistribution: Record<string, number> = {};
    for (const response of responses || []) {
      const resultId = response.result_id || 'unknown';
      resultDistribution[resultId] = (resultDistribution[resultId] || 0) + 1;
    }

    const reportData = {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        created_at: quiz.created_at,
      },
      period: {
        start: start_date || 'all',
        end: end_date || 'all',
      },
      summary: {
        total_views: totalViews,
        total_starts: totalStarts,
        total_completions: totalCompletions,
        conversion_rate: `${conversionRate}%`,
        avg_completion_time_seconds: Math.round(avgCompletionTime),
        total_leads: (responses || []).filter(r => r.respondent_email || r.respondent_whatsapp).length,
      },
      daily_analytics: analytics || [],
      questions_count: (questions || []).length,
      results_count: (results || []).length,
      result_distribution: resultDistribution,
      responses_count: (responses || []).length,
      generated_at: new Date().toISOString(),
    };

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'quiz:generate_report',
      resource_type: 'quiz',
      resource_id: quiz_id,
      metadata: { period: { start_date, end_date }, total_responses: reportData.responses_count }
    });

    return new Response(
      JSON.stringify(reportData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate PDF report error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
