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

    // Verificar master_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Requer master_admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { table_name, limit: queryLimit, offset: queryOffset } = await req.json();

    if (!table_name) {
      return new Response(
        JSON.stringify({ error: 'table_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist de tabelas permitidas
    const allowedTables = [
      'profiles', 'quizzes', 'quiz_questions', 'quiz_results', 'quiz_responses',
      'quiz_analytics', 'quiz_step_analytics', 'quiz_form_config', 'quiz_templates',
      'quiz_translations', 'quiz_question_translations', 'quiz_variants', 'quiz_tags',
      'quiz_tag_relations', 'custom_form_fields', 'user_subscriptions', 'subscription_plans',
      'user_roles', 'user_integrations', 'integration_logs', 'audit_logs',
      'bunny_videos', 'video_usage', 'video_analytics', 'cookie_consents',
      'notification_preferences', 'rate_limit_tracker', 'system_health_metrics',
      'system_settings', 'support_tickets', 'ticket_messages', 'landing_content',
      'landing_ab_tests', 'landing_ab_sessions', 'ab_test_sessions',
      'ai_quiz_generations', 'master_admin_emails', 'recovery_settings',
      'recovery_templates', 'recovery_campaigns', 'recovery_contacts',
      'recovery_blacklist', 'scheduled_deletions', 'user_onboarding',
      'user_webhooks', 'webhook_logs', 'validation_requests'
    ];

    if (!allowedTables.includes(table_name)) {
      return new Response(
        JSON.stringify({ error: 'Table not allowed for export' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const limit = Math.min(queryLimit || 1000, 1000);
    const offset = queryOffset || 0;

    const { data, error: queryError, count } = await supabase
      .from(table_name)
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (queryError) {
      return new Response(
        JSON.stringify({ error: 'Query failed', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'admin:export_table_data',
      resource_type: 'table',
      resource_id: table_name,
      metadata: { table: table_name, rows: data?.length || 0, total: count }
    });

    return new Response(
      JSON.stringify({
        success: true,
        table: table_name,
        data: data || [],
        total: count,
        limit,
        offset,
        exported_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Export table data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
