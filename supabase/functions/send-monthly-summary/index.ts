import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_URL = 'https://kmmdzwoidakmbekqvkmq.supabase.co/functions/v1/egoi-email-webhook';

async function resolveSenderId(apiKey: string, senderEmail: string): Promise<{ senderId: string } | null> {
  try {
    const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/senders', { headers: { ApiKey: apiKey } });
    if (!res.ok) return null;
    const senders = await res.json();
    const list = Array.isArray(senders) ? senders : senders?.items || senders?.data || [];
    for (const s of list) {
      if ((s.email || s.senderEmail || '').toLowerCase() === senderEmail.toLowerCase()) return { senderId: String(s.senderId || s.id) };
    }
    if (list.length > 0) return { senderId: String(list[0].senderId || list[0].id) };
    return null;
  } catch { return null; }
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

async function logAutomation(supabase: any, key: string, status: string, emailsSent: number, details: any = null, errorMessage: string | null = null) {
  try {
    await supabase.from('email_automation_logs').insert({
      automation_key: key,
      status,
      emails_sent: emailsSent,
      details: details ? JSON.stringify(details) : null,
      error_message: errorMessage,
    });
    const { data: config } = await supabase.from('email_automation_config').select('execution_count').eq('automation_key', key).single();
    await supabase.from('email_automation_config')
      .update({
        last_executed_at: new Date().toISOString(),
        last_result: { status, emails_sent: emailsSent, timestamp: new Date().toISOString() },
        execution_count: (config?.execution_count || 0) + 1,
      })
      .eq('automation_key', key);
  } catch (e) {
    console.error('Failed to log automation:', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const AUTOMATION_KEY = 'monthly_summary';

  try {
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');
    if (!egoisApiKey) throw new Error('EGOI_API_KEY missing');

    let testMode = false;
    let testEmail = '';
    try { const body = await req.json(); testMode = body?.test === true; testEmail = body?.testEmail || ''; } catch { /* no body */ }

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthName = MONTH_NAMES[prevMonthStart.getMonth()];

    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquizz.com';
    const senderName = settings?.sender_name || 'MasterQuizz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) throw new Error('No sender in E-goi');

    if (testMode && testEmail) {
      const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
        body: JSON.stringify({
          templateType: 'monthly_summary',
          context: { monthName, userStats: { quiz_count: 5, lead_count: 120, response_count: 120, prev_lead_count: 80 } },
          recipientName: 'Admin',
        }),
      });
      if (!genResponse.ok) throw new Error(`Generator failed`);
      const { subject, html } = await genResponse.json();

      const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ApiKey: egoisApiKey },
        body: JSON.stringify({ senderId: senderInfo.senderId, senderName, to: testEmail, subject: `[TESTE] ${subject}`, htmlBody: html, openTracking: false, clickTracking: false }),
      });
      return new Response(JSON.stringify({ sent: res.ok ? 1 : 0, test: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: unsubscribed } = await supabase.from('email_unsubscribes').select('email');
    const unsubSet = new Set((unsubscribed || []).map(u => u.email.toLowerCase()));

    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const ninetyDaysAgo = Date.now() - 90 * 86400000;
    const activeUsers = (authUsers?.users || []).filter(u => {
      const lastSign = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
      return lastSign > ninetyDaysAgo && u.email;
    });

    const userIds = activeUsers.map(u => u.id);
    const profiles: any[] = [];
    const BATCH_SIZE = 150;
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      const { data } = await supabase.from('profiles').select('id, full_name, email').in('id', batch).not('email', 'is', null);
      if (data) profiles.push(...data);
    }
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    let sentCount = 0;

    for (const profile of (profiles || [])) {
      if (blacklistedIds.has(profile.id)) continue;
      if (unsubSet.has((profile.email || '').toLowerCase())) continue;

      const { data: userQuizzes } = await supabase.from('quizzes').select('id').eq('user_id', profile.id).eq('status', 'active');
      const quizIds = (userQuizzes || []).map(q => q.id);

      let leadCount = 0, prevLeadCount = 0;
      if (quizIds.length > 0) {
        const { count: leads } = await supabase.from('quiz_responses').select('*', { count: 'exact', head: true }).in('quiz_id', quizIds).gte('completed_at', prevMonthStart.toISOString()).lt('completed_at', currentMonth.toISOString());
        leadCount = leads || 0;
        const { count: prevLeads } = await supabase.from('quiz_responses').select('*', { count: 'exact', head: true }).in('quiz_id', quizIds).gte('completed_at', twoMonthsAgo.toISOString()).lt('completed_at', prevMonthStart.toISOString());
        prevLeadCount = prevLeads || 0;
      }

      try {
        const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
          body: JSON.stringify({
            templateType: 'monthly_summary',
            context: { monthName, userStats: { quiz_count: quizIds.length, lead_count: leadCount, response_count: leadCount, prev_lead_count: prevLeadCount } },
            recipientName: profile.full_name || 'Usuário',
            recipientEmail: profile.email,
            recipientUserId: profile.id,
          }),
        });
        if (!genResponse.ok) continue;
        const { subject, html } = await genResponse.json();

        const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ApiKey: egoisApiKey },
          body: JSON.stringify({ senderId: senderInfo.senderId, senderName, to: profile.email, subject, htmlBody: html, openTracking: true, clickTracking: true, webhookUrl: WEBHOOK_URL }),
        });
        if (res.ok) { sentCount++; await new Promise(r => setTimeout(r, 2000)); }
      } catch (e) { console.error(`Error:`, e); }
    }

    await logAutomation(supabase, AUTOMATION_KEY, 'success', sentCount, { month: monthName, total_targets: (profiles || []).length });

    return new Response(JSON.stringify({ sent: sentCount, month: monthName }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('send-monthly-summary error:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro';
    await logAutomation(supabase, AUTOMATION_KEY, 'error', 0, null, errMsg);
    return new Response(JSON.stringify({ error: errMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
