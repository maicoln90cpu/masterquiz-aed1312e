import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const PREFIX = 'DELETE-USER';

const BodySchema = z.object({
  user_id: z.string().uuid(),
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

    // Autenticar - precisa ser master_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', 'Não autorizado', traceId, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    // Verificar se é master_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .maybeSingle();

    if (!roleData) {
      console.warn(`[${PREFIX}] Non-admin user attempted deletion: ${user.id}`);
      return errorResponse('FORBIDDEN', 'Acesso negado. Requer permissão de master_admin.', traceId, corsHeaders);
    }

    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { user_id } = parsed.data;

    // Prevenir auto-exclusão
    if (user_id === user.id) {
      return errorResponse('VALIDATION_FAILED', 'Não é possível deletar o próprio usuário', traceId, corsHeaders);
    }

    console.log(`[${PREFIX}] Admin ${user.id} deleting user ${user_id}`);

    // Log de auditoria ANTES da exclusão
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'admin:delete_user',
      resource_type: 'user',
      resource_id: user_id,
      metadata: { admin_id: user.id, target_user_id: user_id }
    });

    // Tentar deletar via API do Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error(`[${PREFIX}] API deletion failed:`, deleteError.message);

      // Fallback: tentar via SQL
      if (deleteError.message.includes('corrupt') ||
          deleteError.message.includes('invalid') ||
          deleteError.message.includes('not found')) {
        try {
          const { error: sqlError } = await supabase.rpc('delete_user_by_id', {
            target_user_id: user_id
          });

          if (sqlError) {
            console.error(`[${PREFIX}] SQL deletion also failed:`, sqlError);
            return errorResponse('INTERNAL_ERROR', `Cannot delete user: ${deleteError.message}`, traceId, corsHeaders);
          }

          console.log(`[${PREFIX}] Successfully deleted via SQL: ${user_id}`);
          return okResponse({ method: 'sql', message: 'User deleted via SQL (corrupted data workaround)' }, traceId, corsHeaders);
        } catch (sqlException: unknown) {
          console.error(`[${PREFIX}] SQL deletion exception:`, sqlException);
          return errorResponse('INTERNAL_ERROR', sqlException instanceof Error ? sqlException.message : 'Falha desconhecida', traceId, corsHeaders);
        }
      }

      return errorResponse('INTERNAL_ERROR', deleteError.message, traceId, corsHeaders);
    }

    console.log(`[${PREFIX}] Successfully deleted user via API: ${user_id}`);

    return okResponse({ method: 'api' }, traceId, corsHeaders);

  } catch (error: unknown) {
    console.error(`[${PREFIX}] Unexpected error:`, error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro desconhecido', traceId, corsHeaders);
  }
});
