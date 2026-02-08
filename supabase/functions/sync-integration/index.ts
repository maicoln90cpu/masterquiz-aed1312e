import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  name?: string; email?: string; whatsapp?: string;
  quiz_title?: string; result_text?: string;
  answers?: Record<string, unknown>; custom_fields?: Record<string, unknown>;
  completed_at?: string;
}

type SyncResult = { success: boolean; data?: unknown; error?: string };

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timeoutId); }
}

async function syncToHubSpot(apiKey: string, lead: LeadData): Promise<SyncResult> {
  try {
    const properties: Record<string, string> = {};
    if (lead.email) properties.email = lead.email;
    if (lead.name) { const parts = lead.name.split(' '); properties.firstname = parts[0]; properties.lastname = parts.slice(1).join(' '); }
    if (lead.whatsapp) properties.phone = lead.whatsapp;
    const response = await fetchWithTimeout('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties }),
    });
    if (!response.ok) return { success: false, error: 'HubSpot API error' };
    return { success: true, data: await response.json() };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }; }
}

async function syncToWebhook(webhookUrl: string, lead: LeadData): Promise<SyncResult> {
  try {
    const payload = { ...lead, timestamp: new Date().toISOString(), source: 'masterquizz' };
    const response = await fetchWithTimeout(webhookUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok && response.status !== 200) return { success: false, error: `Status ${response.status}` };
    return { success: true, data: { status: 'sent' } };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { integration_id, response_id, quiz_id } = await req.json();

    const { data: integration } = await supabase.from('user_integrations').select('*').eq('id', integration_id).single();
    if (!integration) return new Response(JSON.stringify({ error: 'Integration not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!integration.is_active) return new Response(JSON.stringify({ message: 'Integration inactive' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: response } = await supabase.from('quiz_responses').select('*, quiz:quizzes(title), result:quiz_results(result_text)').eq('id', response_id).single();
    if (!response) return new Response(JSON.stringify({ error: 'Response not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const leadData: LeadData = {
      name: response.respondent_name, email: response.respondent_email, whatsapp: response.respondent_whatsapp,
      quiz_title: response.quiz?.title, result_text: response.result?.result_text,
      answers: response.answers as Record<string, unknown>, custom_fields: response.custom_field_data as Record<string, unknown>,
      completed_at: response.completed_at,
    };

    let result: SyncResult;
    switch (integration.provider) {
      case 'hubspot': result = await syncToHubSpot(integration.api_key, leadData); break;
      case 'zapier': case 'make': case 'n8n': result = await syncToWebhook(integration.webhook_url, leadData); break;
      default: result = { success: false, error: `Unknown provider: ${integration.provider}` };
    }

    await supabase.from('integration_logs').insert({
      integration_id: integration.id, user_id: integration.user_id, quiz_id, response_id,
      provider: integration.provider, action: 'sync_lead', status: result.success ? 'success' : 'error',
      request_payload: leadData, response_payload: result.data || null, error_message: result.error || null,
    });

    if (result.success) await supabase.from('user_integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration_id);

    return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[SYNC] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
