import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Send via E-goi
    const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': egoisApiKey,
      },
      body: JSON.stringify({
        domain: senderEmail.split('@')[1] || 'masterquizz.com',
        senderEmail,
        senderName,
        to: [to],
        subject,
        htmlBody: htmlContent,
        options: { trackOpens: true, trackClicks: true },
      }),
    });

    let data: any = {};
    try { data = await res.json(); } catch { data = { status: res.status }; }

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || JSON.stringify(data).substring(0, 300);
      console.error('E-goi error:', errorMsg);
      return new Response(JSON.stringify({ error: `E-goi: ${errorMsg}` }), { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Test email sent to ${to} using template "${template.name}"`);

    return new Response(JSON.stringify({ success: true, message: `Email de teste enviado para ${to}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Send test email error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
