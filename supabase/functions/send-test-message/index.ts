import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  try {
    const { templateId, phoneNumber } = await req.json();
    if (!templateId || !phoneNumber) return new Response(JSON.stringify({ error: 'templateId e phoneNumber obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (!/^\d{10,15}$/.test(cleanPhone)) return new Response(JSON.stringify({ error: 'Número inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: template } = await supabase.from('recovery_templates').select('*').eq('id', templateId).single();
    if (!template) return new Response(JSON.stringify({ error: 'Template não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: settings } = await supabase.from('recovery_settings').select('*').limit(1).maybeSingle();
    if (!settings?.is_connected) return new Response(JSON.stringify({ error: 'WhatsApp não conectado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const evolutionApiUrl = normalizeApiUrl(settings.evolution_api_url || Deno.env.get('EVOLUTION_API_URL') || '');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!evolutionApiUrl || !evolutionApiKey) return new Response(JSON.stringify({ error: 'Evolution API incompleta' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const messageContent = replaceTestVariables(template.message_content);
    const testMessage = `🧪 *[MENSAGEM DE TESTE]*\n\n${messageContent}\n\n---\n_Template "${template.name}"_`;

    const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${settings.instance_name || 'masterquizz'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': evolutionApiKey },
      body: JSON.stringify({ number: cleanPhone, text: testMessage }),
    });
    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) return new Response(JSON.stringify({ error: 'Falha ao enviar', details: sendResult.message || sendResult.error }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ success: true, message: 'Enviada!', phone: cleanPhone, templateName: template.name }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[send-test-message] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
