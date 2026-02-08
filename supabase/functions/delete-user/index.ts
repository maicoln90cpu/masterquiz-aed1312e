import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Autenticar - precisa ser master_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é master_admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!roleData) {
      console.warn(`[${PREFIX}] Non-admin user attempted deletion: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Requer permissão de master_admin.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevenir auto-exclusão
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Não é possível deletar o próprio usuário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
            return new Response(
              JSON.stringify({ error: 'Cannot delete user. Please contact support.', details: deleteError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          console.log(`[${PREFIX}] Successfully deleted via SQL: ${user_id}`);
          return new Response(
            JSON.stringify({ success: true, method: 'sql', message: 'User deleted via SQL (corrupted data workaround)' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (sqlException: unknown) {
          console.error(`[${PREFIX}] SQL deletion exception:`, sqlException);
          return new Response(
            JSON.stringify({ error: 'Failed to delete user', details: sqlException instanceof Error ? sqlException.message : 'Unknown' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${PREFIX}] Successfully deleted user via API: ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, method: 'api' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error(`[${PREFIX}] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
