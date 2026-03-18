import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function resolveSenderId(apiKey: string, senderEmail: string): Promise<{ senderId: string; domain: string } | null> {
  try {
    const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/senders', {
      headers: { 'ApiKey': apiKey },
    });
    if (!res.ok) {
      console.error('Failed to fetch senders:', res.status, await res.text());
      return null;
    }
    const senders = await res.json();
    console.log('Available senders:', JSON.stringify(senders));

    const list = Array.isArray(senders) ? senders : senders?.items || senders?.data || [];
    
    // Try exact match
    for (const s of list) {
      const email = s.email || s.senderEmail || '';
      if (email.toLowerCase() === senderEmail.toLowerCase()) {
        return { senderId: String(s.senderId || s.id), domain: email.split('@')[1] };
      }
    }
    // Fallback: first available
    if (list.length > 0) {
      const first = list[0];
      const email = first.email || first.senderEmail || senderEmail;
      console.warn(`Sender ${senderEmail} not found, using fallback: ${email}`);
      return { senderId: String(first.senderId || first.id), domain: email.split('@')[1] || senderEmail.split('@')[1] };
    }
    return null;
  } catch (err) {
    console.error('resolveSenderId error:', err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');

    if (!egoisApiKey) {
      return new Response(JSON.stringify({ error: 'EGOI_API_KEY não configurada' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { to, template_id } = await req.json();

    if (!to || !template_id) {
      return new Response(JSON.stringify({ error: 'Email destinatário e template são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load settings
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquizz.com';
    const senderName = settings?.sender_name || 'MasterQuizz';

    // Resolve senderId from E-goi
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) {
      return new Response(JSON.stringify({ error: 'Nenhum sender configurado na E-goi. Configure um sender em slingshot.egoiapp.com' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log(`Resolved sender: id=${senderInfo.senderId}, domain=${senderInfo.domain}`);

    // Load template
    const { data: template, error: tErr } = await supabase
      .from('email_recovery_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (tErr || !template) {
      return new Response(JSON.stringify({ error: 'Template não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Replace variables with test data
    const testVars: Record<string, string> = {
      '{name}': 'João da Silva (Teste)',
      '{first_name}': 'João',
      '{days_inactive}': '7',
      '{quiz_count}': '3',
      '{lead_count}': '42',
      '{plan_name}': 'Pro',
      '{company_name}': 'MasterQuizz',
      '{login_link}': 'https://masterquiz.lovable.app/login',
      '{support_link}': 'https://masterquiz.lovable.app/faq',
    };

    let htmlContent = template.html_content;
    let subject = `[TESTE] ${template.subject}`;

    for (const [key, value] of Object.entries(testVars)) {
      htmlContent = htmlContent.replaceAll(key, value);
      subject = subject.replaceAll(key, value);
    }

    // Send via E-goi Transactional V2 - Single endpoint
    const payload: Record<string, any> = {
      senderId: senderInfo.senderId,
      senderName,
      to,
      subject,
      htmlBody: htmlContent,
      openTracking: true,
      clickTracking: true,
    };
    // Only include domain if available
    if (senderInfo.domain) {
      payload.domain = senderInfo.domain;
    }

    console.log('Sending to E-goi single endpoint with payload keys:', Object.keys(payload));

    const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': egoisApiKey,
      },
      body: JSON.stringify(payload),
    });

    let data: any = {};
    const responseText = await res.text();
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText, status: res.status }; }

    console.log(`E-goi response: status=${res.status}, body=${responseText.substring(0, 500)}`);

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || data?.errors?.[0]?.message || responseText.substring(0, 300);
      console.error('E-goi error:', errorMsg);
      return new Response(JSON.stringify({ error: `E-goi: ${errorMsg}` }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Test email sent to ${to} using template "${template.name}"`);

    return new Response(JSON.stringify({ success: true, message: `Email de teste enviado para ${to}`, messageId: data.messageId || data.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Send test email error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
