import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

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

  const traceId = getTraceId(req);
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');

    if (!egoisApiKey) {
      return errorResponse('VALIDATION_FAILED', 'EGOI_API_KEY não configurada', traceId, corsHeaders);
    }

    const parsed = await parseBody(req, z.object({
      to: z.string().email(),
      template_id: z.string().uuid(),
    }), traceId);
    if (parsed instanceof Response) return parsed;
    const { to, template_id } = parsed.data;

    // Load settings
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').maybeSingle();
    const senderEmail = settings?.sender_email || 'noreply@masterquiz.com';
    const senderName = settings?.sender_name || 'MasterQuiz';

    // Resolve senderId from E-goi
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) {
      return errorResponse('VALIDATION_FAILED', 'Nenhum sender configurado na E-goi. Configure um sender em slingshot.egoiapp.com', traceId, corsHeaders);
    }
    console.log(`Resolved sender: id=${senderInfo.senderId}, domain=${senderInfo.domain}`);

    // Load template
    const { data: template, error: tErr } = await supabase
      .from('email_recovery_templates')
      .select('*')
      .eq('id', template_id)
      .maybeSingle();

    if (tErr || !template) {
      return errorResponse('NOT_FOUND', 'Template não encontrado', traceId, corsHeaders);
    }

    // Replace variables with test data
    const testVars: Record<string, string> = {
      '{name}': 'João da Silva (Teste)',
      '{first_name}': 'João',
      '{days_inactive}': '7',
      '{quiz_count}': '3',
      '{lead_count}': '42',
      '{plan_name}': 'Pro',
      '{company_name}': 'MasterQuiz',
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
    // Note: omit domain to let E-goi use the default verified domain
    const payload: Record<string, any> = {
      senderId: senderInfo.senderId,
      senderName,
      to,
      subject,
      htmlBody: htmlContent,
      openTracking: true,
      clickTracking: true,
    };

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
      return errorResponse('INTERNAL_ERROR', `E-goi: ${errorMsg}`, traceId, corsHeaders, res.status);
    }

    console.log(`Test email sent to ${to} using template "${template.name}"`);

    return okResponse({ success: true, message: `Email de teste enviado para ${to}`, messageId: data.messageId || data.id }, traceId, corsHeaders);
  } catch (error) {
    console.error('Send test email error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro', traceId, corsHeaders);
  }
});
