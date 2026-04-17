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

async function sendBulk(apiKey: string, batch: Array<{ senderId: string; senderName: string; to: string; subject: string; htmlBody: string }>): Promise<number> {
  const payload = batch.map(item => ({
    domain: 'masterquiz.com',
    senderId: item.senderId,
    senderName: item.senderName,
    to: [item.to],
    subject: item.subject,
    htmlBody: item.htmlBody,
    openTracking: true,
    clickTracking: true,
    webhookUrl: WEBHOOK_URL,
  }));

  try {
    const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ApiKey: apiKey },
      body: JSON.stringify(payload),
    });
    if (res.ok) return batch.length;
    console.log('Bulk failed, falling back to single sends. Status:', res.status);
    let sent = 0;
    for (const item of batch) {
      try {
        const r = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ApiKey: apiKey },
          body: JSON.stringify({ ...item, webhookUrl: WEBHOOK_URL }),
        });
        if (r.ok) sent++;
        await new Promise(r => setTimeout(r, 500));
      } catch { /* skip */ }
    }
    return sent;
  } catch {
    return 0;
  }
}

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
  const AUTOMATION_KEY = 'platform_news';

  try {
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');
    if (!egoisApiKey) throw new Error('EGOI_API_KEY missing');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Auth required');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'master_admin']).limit(1);
    if (!roleData?.length) throw new Error('Admin only');

    const body = await req.json();
    const { updates, version, segment, test, testEmail } = body as { updates: string[]; version?: string; segment?: string; test?: boolean; testEmail?: string };

    if (!updates?.length && !test) throw new Error('updates array required');

    const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
      body: JSON.stringify({ templateType: 'platform_news', context: { updates: updates || ['Teste de novidade'], version }, recipientName: test ? 'Admin' : '{first_name}' }),
    });
    if (!genResponse.ok) throw new Error(`Generator failed: ${await genResponse.text()}`);
    const { subject: baseSubject, html: baseHtml } = await genResponse.json();

    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquiz.com';
    const senderName = settings?.sender_name || 'MasterQuiz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) throw new Error('No sender in E-goi');

    if (test && testEmail) {
      const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ApiKey: egoisApiKey },
        body: JSON.stringify({ senderId: senderInfo.senderId, senderName, to: testEmail, subject: `[TESTE] ${baseSubject}`, htmlBody: baseHtml.replace(/{first_name}/g, 'Admin'), openTracking: false, clickTracking: false }),
      });
      return new Response(JSON.stringify({ sent: res.ok ? 1 : 0, test: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: unsubscribed } = await supabase.from('email_unsubscribes').select('email');
    const unsubSet = new Set((unsubscribed || []).map(u => u.email.toLowerCase()));

    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    let targetUsers = (authUsers?.users || []).filter(u => u.email);

    if (segment === 'active') {
      const thirtyDaysAgo = Date.now() - 30 * 86400000;
      targetUsers = targetUsers.filter(u => {
        const lastSign = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
        return lastSign > thirtyDaysAgo;
      });
    }

    const userIds = targetUsers.map(u => u.id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds).not('email', 'is', null);
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    let filteredProfiles = (profiles || []).filter(p => !blacklistedIds.has(p.id) && !unsubSet.has((p.email || '').toLowerCase()));
    if (segment === 'free' || segment === 'paid') {
      const { data: subs } = await supabase.from('user_subscriptions').select('user_id, plan_type').in('user_id', userIds);
      const subsMap = new Map((subs || []).map(s => [s.user_id, s.plan_type]));
      filteredProfiles = filteredProfiles.filter(p => {
        const plan = subsMap.get(p.id) || 'free';
        return segment === 'free' ? plan === 'free' : plan !== 'free';
      });
    }

    const emailBatch: Array<{ senderId: string; senderName: string; to: string; subject: string; htmlBody: string }> = [];
    for (const profile of filteredProfiles) {
      const firstName = profile.full_name?.split(' ')[0] || 'Usuário';
      emailBatch.push({
        senderId: senderInfo.senderId,
        senderName,
        to: profile.email!,
        subject: baseSubject.replace(/{first_name}/g, firstName),
        htmlBody: baseHtml.replace(/{first_name}/g, firstName),
      });
    }

    let sentCount = 0;
    for (let i = 0; i < emailBatch.length; i += 100) {
      const chunk = emailBatch.slice(i, i + 100);
      const sent = await sendBulk(egoisApiKey, chunk);
      sentCount += sent;
      if (i + 100 < emailBatch.length) await new Promise(r => setTimeout(r, 2000));
    }

    await logAutomation(supabase, AUTOMATION_KEY, 'success', sentCount, { segment: segment || 'all', total_targets: emailBatch.length });

    return new Response(JSON.stringify({ sent: sentCount, segment: segment || 'all', bulk: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('send-platform-news error:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro';
    await logAutomation(supabase, AUTOMATION_KEY, 'error', 0, null, errMsg);
    return new Response(JSON.stringify({ error: errMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
