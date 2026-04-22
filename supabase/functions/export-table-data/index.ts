import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  table_name: z.string().min(1),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().min(0).optional(),
});

Deno.serve(async (req) => {
  const traceId = getTraceId(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'x-trace-id': traceId } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', 'Token ausente', traceId, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    // Verificar master_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .maybeSingle();

    if (!roleData) {
      return errorResponse('FORBIDDEN', 'Acesso negado: requer master_admin', traceId, corsHeaders);
    }

    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { table_name, limit: queryLimit, offset: queryOffset } = parsed.data;

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
      return errorResponse('VALIDATION_FAILED', `Tabela "${table_name}" não permitida para exportação`, traceId, corsHeaders);
    }

    const limit = Math.min(queryLimit || 1000, 1000);
    const offset = queryOffset || 0;

    const { data, error: queryError, count } = await supabase
      .from(table_name)
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (queryError) {
      return errorResponse('INTERNAL_ERROR', `Falha na query: ${queryError.message}`, traceId, corsHeaders);
    }

    // Log de auditoria
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'admin:export_table_data',
      resource_type: 'table',
      resource_id: table_name,
      metadata: { table: table_name, rows: data?.length || 0, total: count }
    });

    return okResponse({
      success: true,
      table: table_name,
      data: data || [],
      total: count,
      limit,
      offset,
      exported_at: new Date().toISOString(),
    }, traceId, corsHeaders);

  } catch (error) {
    console.error('Export table data error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error)?.message || 'Erro interno', traceId, corsHeaders);
  }
});
