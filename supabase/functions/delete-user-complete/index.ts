import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('[DELETE-USER] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.warn('[DELETE-USER] Invalid token');
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      console.warn('[DELETE-USER] Invalid JSON body');
      return new Response(
        JSON.stringify({ error: 'JSON inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = deleteRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.warn('[DELETE-USER] Validation failed', validationResult.error.errors);
      return new Response(
        JSON.stringify({
          error: 'Parâmetros inválidos',
          details: validationResult.error.errors.map(e => e.message)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, cancellation_token, reason } = validationResult.data;

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
        return new Response(
          JSON.stringify({
            error: 'Exclusão já agendada',
            scheduled_for: existingDeletion.scheduled_for,
            cancellation_token: existingDeletion.cancellation_token
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        .single();

      if (insertError) throw insertError;

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

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Exclusão agendada com sucesso',
          scheduled_for: scheduledFor.toISOString(),
          cancellation_token: newDeletion.cancellation_token,
          days_remaining: 30
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CANCELAR EXCLUSÃO
    if (action === 'cancel') {
      if (!cancellation_token) {
        return new Response(
          JSON.stringify({ error: 'Token de cancelamento necessário' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        return new Response(
          JSON.stringify({ error: 'Exclusão não encontrada ou já cancelada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Exclusão cancelada com sucesso. Sua conta foi reativada.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        throw deleteError;
      }

      console.log(`[DELETE-USER] User permanently deleted: ${user.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Conta excluída permanentemente'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DELETE-USER] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar exclusão' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
