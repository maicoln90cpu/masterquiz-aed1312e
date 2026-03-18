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
      console.error('Failed to fetch senders:', res.status);
      return null;
    }
    const senders = await res.json();
    const list = Array.isArray(senders) ? senders : senders?.items || senders?.data || [];
    
    for (const s of list) {
      const email = s.email || s.senderEmail || '';
      if (email.toLowerCase() === senderEmail.toLowerCase()) {
        return { senderId: String(s.senderId || s.id), domain: email.split('@')[1] };
      }
    }
    if (list.length > 0) {
      const first = list[0];
      const email = first.email || first.senderEmail || senderEmail;
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

    // Load settings
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    if (!settings?.is_active) {
      return new Response(JSON.stringify({ message: 'Inativo', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Time window check
    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentMinutes = brasilTime.getHours() * 60 + brasilTime.getMinutes();
    const [sH, sM] = (settings.allowed_hours_start || '09:00').split(':').map(Number);
    const [eH, eM] = (settings.allowed_hours_end || '18:00').split(':').map(Number);
    if (currentMinutes < sH * 60 + sM || currentMinutes > eH * 60 + eM) {
      return new Response(JSON.stringify({ message: 'Fora do horário', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Daily limit
    const today = new Date().toISOString().split('T')[0];
    const { count: sentToday } = await supabase.from('email_recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', `${today}T00:00:00`);
    const dailyLimit = settings.daily_email_limit || 100;
    if ((sentToday || 0) >= dailyLimit) {
      return new Response(JSON.stringify({ message: 'Limite diário', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Hourly limit
    const hourAgo = new Date(now.getTime() - 3600000);
    const { count: sentHour } = await supabase.from('email_recovery_contacts').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('sent_at', hourAgo.toISOString());
    const hourlyLimit = settings.hourly_email_limit || 30;
    if ((sentHour || 0) >= hourlyLimit) {
      return new Response(JSON.stringify({ message: 'Limite hora', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve sender once for all emails
    const senderEmail = settings.sender_email || 'noreply@masterquizz.com';
    const senderName = settings.sender_name || 'MasterQuizz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) {
      console.error('No sender found in E-goi for:', senderEmail);
      return new Response(JSON.stringify({ error: 'Nenhum sender configurado na E-goi' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get pending contacts
    const batchSize = settings.batch_size || 10;
    const maxBatch = Math.min(batchSize, dailyLimit - (sentToday || 0), hourlyLimit - (sentHour || 0));

    const { data: contacts } = await supabase
      .from('email_recovery_contacts')
      .select('*, email_recovery_templates(*)')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(maxBatch);

    if (!contacts?.length) {
      return new Response(JSON.stringify({ message: 'Nenhum pendente', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let successCount = 0;

    for (const contact of contacts) {
      try {
        const template = contact.email_recovery_templates;
        if (!template) {
          await supabase.from('email_recovery_contacts').update({ status: 'failed', error_message: 'Template não encontrado' }).eq('id', contact.id);
          continue;
        }

        // Get user profile for variable replacement
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', contact.user_id).single();
        const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

        const htmlContent = template.html_content
          .replace(/{name}/g, profile?.full_name || 'Usuário')
          .replace(/{first_name}/g, firstName)
          .replace(/{days_inactive}/g, String(contact.days_inactive_at_contact || 0))
          .replace(/{quiz_count}/g, String(contact.user_quiz_count || 0))
          .replace(/{lead_count}/g, String(contact.user_lead_count || 0))
          .replace(/{plan_name}/g, contact.user_plan_at_contact || 'Free')
          .replace(/{company_name}/g, 'MasterQuizz')
          .replace(/{login_link}/g, 'https://masterquiz.lovable.app/login')
          .replace(/{support_link}/g, 'https://masterquiz.lovable.app/faq');

        const subject = template.subject
          .replace(/{name}/g, profile?.full_name || 'Usuário')
          .replace(/{first_name}/g, firstName)
          .replace(/{days_inactive}/g, String(contact.days_inactive_at_contact || 0));

        // Send via E-goi Transactional V2 - Single endpoint
        const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ApiKey': egoisApiKey,
          },
          body: JSON.stringify({
            domain: senderInfo.domain,
            senderId: senderInfo.senderId,
            senderName,
            to: contact.email,
            subject,
            htmlBody: htmlContent,
            openTracking: true,
            clickTracking: true,
          }),
        });

        let data: any = {};
        const responseText = await res.text();
        try { data = JSON.parse(responseText); } catch { data = { raw: responseText, status: res.status }; }

        if (!res.ok) {
          const errorMsg = data?.detail || data?.message || data?.errors?.[0]?.message || responseText.substring(0, 300);
          const retry = (contact.retry_count || 0) + 1;
          await supabase.from('email_recovery_contacts').update({
            status: retry >= 3 ? 'failed' : 'pending',
            retry_count: retry,
            error_message: `HTTP ${res.status}: ${errorMsg}`,
          }).eq('id', contact.id);
          continue;
        }

        // Success
        await supabase.from('email_recovery_contacts').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          egoi_message_id: data.messageId || data.id || null,
        }).eq('id', contact.id);

        await supabase.from('email_recovery_templates').update({
          usage_count: (template.usage_count || 0) + 1,
        }).eq('id', template.id);

        successCount++;

        // Small delay between sends
        if (contacts.indexOf(contact) < contacts.length - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err) {
        await supabase.from('email_recovery_contacts').update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Erro',
        }).eq('id', contact.id);
      }
    }

    return new Response(JSON.stringify({ processed: successCount, total: contacts.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Process email queue error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
