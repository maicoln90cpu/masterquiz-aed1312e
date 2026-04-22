import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeApiUrl(url: string): string {
  if (!url) return '';
  let u = url.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
  return u.replace(/\/+$/, '');
}

function replaceTestVariables(content: string): string {
  return content
    .replace(/{name}/g, 'João Silva (TESTE)')
    .replace(/{first_name}/g, 'João')
    .replace(/{email}/g, 'teste@exemplo.com')
    .replace(/{days_inactive}/g, '15')
    .replace(/{last_login_date}/g, new Date().toLocaleDateString('pt-BR'))
    .replace(/{plan_name}/g, 'Pro')
    .replace(/{quiz_count}/g, '5')
    .replace(/{lead_count}/g, '127')
    .replace(/{login_link}/g, 'https://masterquiz.lovable.app/login')
    .replace(/{promo_code}/g, 'TESTE20');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);
  try {
    const parsed = await parseBody(req, z.object({
      templateId: z.string().uuid(),
      phoneNumber: z.string().min(8),
    }), traceId);
    if (parsed instanceof Response) return parsed;
    const { templateId, phoneNumber } = parsed.data;

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) return errorResponse('VALIDATION_FAILED', 'Número inválido', traceId, corsHeaders);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: template } = await supabase.from('recovery_templates').select('*').eq('id', templateId).maybeSingle();
    if (!template) return errorResponse('NOT_FOUND', 'Template não encontrado', traceId, corsHeaders);

    const { data: settings } = await supabase.from('recovery_settings').select('*').limit(1).maybeSingle();
    if (!settings?.is_connected) return errorResponse('VALIDATION_FAILED', 'WhatsApp não conectado', traceId, corsHeaders);

    const evolutionApiUrl = normalizeApiUrl(settings.evolution_api_url || Deno.env.get('EVOLUTION_API_URL') || '');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!evolutionApiUrl || !evolutionApiKey) return errorResponse('INTERNAL_ERROR', 'Evolution API incompleta', traceId, corsHeaders);

    const messageContent = replaceTestVariables(template.message_content);
    const testMessage = `🧪 *[MENSAGEM DE TESTE]*\n\n${messageContent}\n\n---\n_Template "${template.name}"_`;

    const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${settings.instance_name || 'masterquizz'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
      body: JSON.stringify({ number: cleanPhone, text: testMessage }),
    });
    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) return errorResponse('INTERNAL_ERROR', `Falha ao enviar: ${sendResult.message || sendResult.error || ''}`, traceId, corsHeaders);

    return okResponse({ success: true, message: 'Enviada!', phone: cleanPhone, templateName: template.name }, traceId, corsHeaders);
  } catch (error) {
    console.error('[send-test-message] Error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro', traceId, corsHeaders);
  }
});
