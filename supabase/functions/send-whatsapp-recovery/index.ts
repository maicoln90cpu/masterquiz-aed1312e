import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: settings } = await supabase.from('recovery_settings').select('*').single();
    if (!settings?.is_active || !settings?.is_connected) {
      return new Response(JSON.stringify({ message: 'Sistema inativo', sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiUrl = (settings.evolution_api_url || Deno.env.get('EVOLUTION_API_URL') || '').trim();
    const apiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!apiUrl || !apiKey) return new Response(JSON.stringify({ error: 'API não configurada' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const normalizedUrl = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;

    const { data: contacts } = await supabase.from('recovery_contacts').select('*').eq('status', 'pending').order('priority', { ascending: false }).order('scheduled_at', { ascending: true }).limit(1);
    if (!contacts?.length) return new Response(JSON.stringify({ message: 'Nenhuma pendente', sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const contact = contacts[0];
    const days = contact.days_inactive_at_contact || 0;

    let template = null;
    if (contact.template_id) {
      const { data } = await supabase.from('recovery_templates').select('*').eq('id', contact.template_id).single();
      template = data;
    }
    if (!template) {
      const cats = days === 0 ? ['welcome', 'first_quiz'] : days < 10 ? ['check_in'] : ['recovery', 'reminder'];
      const { data } = await supabase.from('recovery_templates').select('*').eq('is_active', true).in('category', cats).lte('trigger_days', days).order('trigger_days', { ascending: false }).limit(1);
      template = data?.[0];
    }
    if (!template) {
      await supabase.from('recovery_contacts').update({ status: 'failed', error_message: 'Sem template' }).eq('id', contact.id);
      return new Response(JSON.stringify({ error: 'Sem template' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!contact.template_id) await supabase.from('recovery_contacts').update({ template_id: template.id }).eq('id', contact.id);

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', contact.user_id).single();
    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

    const msg = template.message_content
      .replace(/{name}/g, profile?.full_name || 'Usuário')
      .replace(/{first_name}/g, firstName)
      .replace(/{days_inactive}/g, String(days))
      .replace(/{quiz_count}/g, String(contact.user_quiz_count || 0))
      .replace(/{lead_count}/g, String(contact.user_lead_count || 0))
      .replace(/{plan_name}/g, contact.user_plan_at_contact || 'Free')
      .replace(/{company_name}/g, 'MasterQuizz')
      .replace(/{login_link}/g, 'https://masterquiz.lovable.app/login')
      .replace(/{support_link}/g, 'https://masterquiz.lovable.app/faq');

    let phone = contact.phone_number.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    // Se já começa com 55 e tem 12-13 dígitos, já tem DDI
    let formattedPhone = phone;
    if (phone.startsWith('55') && (phone.length === 12 || phone.length === 13)) {
      formattedPhone = phone;
    } else if (phone.length === 10 || phone.length === 11) {
      formattedPhone = `55${phone}`;
    }

    const res = await fetch(`${normalizedUrl}/message/sendText/${settings.instance_name || 'masterquizz'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ number: formattedPhone, text: msg }),
    });

    let data: any = {};
    try { data = await res.json(); } catch { data = { rawStatus: res.status, rawStatusText: res.statusText }; }

    if (!res.ok) {
      const errorDetail = data?.response?.message || data?.message || data?.error || data?.reason || (typeof data === 'string' ? data : JSON.stringify(data).substring(0, 300));
      const retry = (contact.retry_count || 0) + 1;
      await supabase.from('recovery_contacts').update({ status: retry >= 3 ? 'failed' : 'pending', retry_count: retry, error_message: `HTTP ${res.status}: ${errorDetail}` }).eq('id', contact.id);
      throw new Error(`HTTP ${res.status}: ${errorDetail}`);
    }

    await supabase.from('recovery_contacts').update({ status: 'sent', sent_at: new Date().toISOString(), message_sent: msg, template_id: template.id, evolution_message_id: data.key?.id }).eq('id', contact.id);
    await supabase.from('recovery_templates').update({ usage_count: (template.usage_count || 0) + 1 }).eq('id', template.id);

    return new Response(JSON.stringify({ message: 'Enviada', sent: 1, phone: formattedPhone, template: template.name }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
