import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const cronSecret = req.headers.get('X-Cron-Secret');
    
    if (!cronSecret && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return errorResponse('UNAUTHORIZED', 'Não autorizado', traceId, corsHeaders);
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'master_admin')
        .maybeSingle();

      if (!roleData) {
        return errorResponse('FORBIDDEN', 'Acesso negado. Requer permissão de master_admin.', traceId, corsHeaders);
      }
    }

    console.log('🔒 Iniciando anonimização de IPs antigos...');

    const { data: affectedCount, error: rpcError } = await supabase
      .rpc('anonymize_old_ips');

    if (rpcError) {
      console.error('Erro ao anonimizar IPs:', rpcError);
      throw rpcError;
    }

    await supabase.from('audit_logs').insert({
      action: 'system:ip_anonymization',
      resource_type: 'system',
      metadata: { 
        records_affected: affectedCount,
        executed_at: new Date().toISOString()
      }
    });

    console.log(`✅ Anonimização concluída: ${affectedCount} registros afetados`);

    return okResponse(
      { message: 'Anonimização de IPs concluída', records_affected: affectedCount },
      traceId,
      corsHeaders,
    );

  } catch (error) {
    console.error('❌ Erro na anonimização:', error);
    return errorResponse('INTERNAL_ERROR', 'Erro interno ao anonimizar IPs', traceId, corsHeaders);
  }
});
