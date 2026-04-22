import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeApiUrl(url: string): string {
  let n = url.trim();
  if (n.endsWith('/')) n = n.slice(0, -1);
  if (!n.startsWith('http://') && !n.startsWith('https://')) n = `https://${n}`;
  return n;
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  // Se já começa com 55 e tem 12-13 dígitos, já tem DDI
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }
  // Número brasileiro sem DDI (10-11 dígitos)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
}

const BodySchema = z.object({
  user_id: z.string().uuid(),
  phone_number: z.string().min(8),
  user_name: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { user_id, phone_number, user_name } = parsed.data;

    const { data: settings } = await supabase.from('recovery_settings').select('*').limit(1).maybeSingle();
    if (!settings?.is_connected) return okResponse({ success: false, reason: 'whatsapp_not_connected' }, traceId, corsHeaders);

    const normalizedPhone = normalizePhoneNumber(phone_number);
    const { data: blacklisted } = await supabase.from('recovery_blacklist').select('id').eq('phone_number', normalizedPhone).maybeSingle();
    if (blacklisted) return okResponse({ success: false, reason: 'blacklisted' }, traceId, corsHeaders);

    const { data: template } = await supabase.from('recovery_templates').select('*').eq('category', 'welcome').eq('is_active', true).order('priority', { ascending: true }).limit(1).maybeSingle();
    if (!template) return okResponse({ success: false, reason: 'no_template' }, traceId, corsHeaders);

    const firstName = user_name?.split(' ')[0] || 'Cliente';
    const message = replaceVariables(template.message_content, { name: user_name || 'Cliente', first_name: firstName, login_link: 'https://masterquiz.lovable.app/login' });

    const evolutionApiUrl = normalizeApiUrl(settings.evolution_api_url || Deno.env.get('EVOLUTION_API_URL') || '');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!evolutionApiUrl || !evolutionApiKey) return errorResponse('INTERNAL_ERROR', 'Evolution API não configurada', traceId, corsHeaders);

    const sendRes = await fetch(`${evolutionApiUrl}/message/sendText/${settings.instance_name || 'masterquizz'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
      body: JSON.stringify({ number: normalizedPhone, text: message }),
    });

    let sendData: any = {};
    try { sendData = await sendRes.json(); } catch { sendData = { rawStatus: sendRes.status }; }

    if (!sendRes.ok) {
      const errorDetail = sendData?.message || sendData?.error || sendData?.response?.message || JSON.stringify(sendData).substring(0, 200);
      await supabase.from('recovery_contacts').update({ status: 'failed', error_message: `HTTP ${sendRes.status}: ${errorDetail}` }).eq('user_id', user_id).eq('phone_number', normalizedPhone).eq('status', 'pending');
      return errorResponse('INTERNAL_ERROR', `Erro ao enviar: ${errorDetail}`, traceId, corsHeaders);
    }
    // Atualizar registro existente (do trigger) em vez de inserir duplicata
    await supabase.from('recovery_contacts').update({ status: 'sent', sent_at: new Date().toISOString(), message_sent: message, template_id: template.id, evolution_message_id: sendData?.key?.id }).eq('user_id', user_id).eq('phone_number', normalizedPhone).eq('status', 'pending');
    await supabase.from('recovery_templates').update({ usage_count: (template.usage_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', template.id);

    return okResponse({ success: true, message_id: sendData?.key?.id }, traceId, corsHeaders);
  } catch (error) {
    console.error('send-welcome-message error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro', traceId, corsHeaders);
  }
});
