import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const deleteRequestSchema = z.object({
  action: z.enum(['schedule', 'cancel', 'execute']),
  cancellation_token: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = getTraceId(req);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[DELETE-USER] Missing authorization header');
      return errorResponse('UNAUTHORIZED', 'Não autorizado', traceId, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('[DELETE-USER] Invalid token');
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    const parsed = await parseBody(req, deleteRequestSchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { action, cancellation_token, reason } = parsed.data;

    console.log(`[DELETE-USER] Action: ${action} for user: ${user.id}`);

    // AGENDAR EXCLUSÃO (30 dias)
    if (action === 'schedule') {
      const { data: existingDeletion } = await supabase
        .from('scheduled_deletions')
        .select('*')
        .eq('user_id', user.id)
        .is('cancelled_at', null)
        .maybeSingle();

      if (existingDeletion) {
        return errorResponse(
          'VALIDATION_FAILED',
          `Exclusão já agendada para ${existingDeletion.scheduled_for}`,
          traceId,
          corsHeaders,
        );
      }

      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 30);

      const { data: newDeletion, error: insertError } = await supabase
        .from('scheduled_deletions')
        .insert({
          user_id: user.id,
          scheduled_for: scheduledFor.toISOString(),
          reason: reason || 'Solicitado pelo usuário',
        })
        .select()
        .maybeSingle();

      if (insertError || !newDeletion) {
        return errorResponse('INTERNAL_ERROR', insertError?.message || 'Falha ao agendar exclusão', traceId, corsHeaders);
      }

      // Soft delete no perfil
      await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      // Desativar subscription
      await supabase
        .from('user_subscriptions')
        .update({ status: 'inactive' })
        .eq('user_id', user.id);

      // Arquivar quizzes
      await supabase
        .from('quizzes')
        .update({ is_public: false, status: 'archived' })
        .eq('user_id', user.id);

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'user:deletion_scheduled',
        resource_type: 'user',
        resource_id: user.id,
        metadata: { scheduled_for: scheduledFor.toISOString(), has_reason: !!reason }
      });

      console.log(`[DELETE-USER] Scheduled for: ${scheduledFor.toISOString()}`);

      return okResponse({
        message: 'Exclusão agendada com sucesso',
        scheduled_for: scheduledFor.toISOString(),
        cancellation_token: newDeletion.cancellation_token,
        days_remaining: 30,
      }, traceId, corsHeaders);
    }

    // CANCELAR EXCLUSÃO
    if (action === 'cancel') {
      if (!cancellation_token) {
        return errorResponse('VALIDATION_FAILED', 'Token de cancelamento necessário', traceId, corsHeaders);
      }

      const { data: deletion, error: findError } = await supabase
        .from('scheduled_deletions')
        .select('*')
        .eq('user_id', user.id)
        .eq('cancellation_token', cancellation_token)
        .is('cancelled_at', null)
        .maybeSingle();

      if (findError || !deletion) {
        console.warn('[DELETE-USER] Deletion not found or already cancelled');
        return errorResponse('NOT_FOUND', 'Exclusão não encontrada ou já cancelada', traceId, corsHeaders);
      }

      await supabase
        .from('scheduled_deletions')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('id', deletion.id);

      // Reativar perfil
      await supabase
        .from('profiles')
        .update({ deleted_at: null })
        .eq('id', user.id);

      // Reativar subscription
      await supabase
        .from('user_subscriptions')
        .update({ status: 'active' })
        .eq('user_id', user.id);

      // Log de auditoria
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'user:deletion_cancelled',
        resource_type: 'user',
        resource_id: user.id,
        metadata: { cancelled: true }
      });

      console.log(`[DELETE-USER] Deletion cancelled for user: ${user.id}`);

      return okResponse({
        message: 'Exclusão cancelada com sucesso. Sua conta foi reativada.',
      }, traceId, corsHeaders);
    }

    // EXECUTAR EXCLUSÃO IMEDIATA
    if (action === 'execute') {
      // Anonimizar dados em audit_logs antes de deletar
      await supabase
        .from('audit_logs')
        .update({
          user_id: null,
          metadata: { anonymized: true }
        })
        .eq('user_id', user.id);

      // Deletar usuário usando função do banco
      const { error: deleteError } = await supabase.rpc('delete_user_by_id', {
        target_user_id: user.id
      });

      if (deleteError) {
        console.error('[DELETE-USER] Error deleting user:', deleteError);
        return errorResponse('INTERNAL_ERROR', deleteError.message, traceId, corsHeaders);
      }

      console.log(`[DELETE-USER] User permanently deleted: ${user.id}`);

      return okResponse({ message: 'Conta excluída permanentemente' }, traceId, corsHeaders);
    }

    return errorResponse('VALIDATION_FAILED', 'Ação inválida', traceId, corsHeaders);

  } catch (error) {
    console.error('[DELETE-USER] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Erro interno ao processar exclusão', traceId, corsHeaders);
  }
});
