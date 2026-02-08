import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
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

    console.log(`[EXPORT-USER-DATA] Exporting data for user: ${user.id}`);

    // Buscar dados do usuário de todas as tabelas relevantes
    const [
      profileResult,
      quizzesResult,
      questionsResult,
      responsesResult,
      subscriptionResult,
      rolesResult,
      integrationsResult,
      videosResult,
      analyticsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('quizzes').select('*').eq('user_id', user.id),
      supabase.from('quiz_questions').select('*, quiz_id').in('quiz_id',
        (await supabase.from('quizzes').select('id').eq('user_id', user.id)).data?.map(q => q.id) || []
      ),
      supabase.from('quiz_responses').select('*').in('quiz_id',
        (await supabase.from('quizzes').select('id').eq('user_id', user.id)).data?.map(q => q.id) || []
      ),
      supabase.from('user_subscriptions').select('*').eq('user_id', user.id).single(),
      supabase.from('user_roles').select('*').eq('user_id', user.id),
      supabase.from('user_integrations').select('*').eq('user_id', user.id),
      supabase.from('bunny_videos').select('*').eq('user_id', user.id),
      supabase.from('quiz_analytics').select('*').in('quiz_id',
        (await supabase.from('quizzes').select('id').eq('user_id', user.id)).data?.map(q => q.id) || []
      ),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      profile: profileResult.data,
      quizzes: quizzesResult.data || [],
      questions: questionsResult.data || [],
      responses: responsesResult.data || [],
      subscription: subscriptionResult.data,
      roles: rolesResult.data || [],
      integrations: integrationsResult.data || [],
      videos: videosResult.data || [],
      analytics: analyticsResult.data || [],
    };

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'user:export_data',
      resource_type: 'user',
      resource_id: user.id,
      metadata: {
        quizzes_count: exportData.quizzes.length,
        responses_count: exportData.responses.length,
        videos_count: exportData.videos.length
      }
    });

    console.log(`[EXPORT-USER-DATA] Export complete: ${exportData.quizzes.length} quizzes, ${exportData.responses.length} responses`);

    return new Response(
      JSON.stringify(exportData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EXPORT-USER-DATA] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
