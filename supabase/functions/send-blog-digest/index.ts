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
    domain: 'masterquizz.com',
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
    // Also update config
    await supabase.from('email_automation_config')
      .update({
        last_executed_at: new Date().toISOString(),
        last_result: { status, emails_sent: emailsSent, timestamp: new Date().toISOString() },
        execution_count: undefined, // will be handled separately
      })
      .eq('automation_key', key);
    // Increment execution count
    const { data: config } = await supabase.from('email_automation_config').select('execution_count').eq('automation_key', key).single();
    if (config) {
      await supabase.from('email_automation_config')
        .update({ execution_count: (config.execution_count || 0) + 1 })
        .eq('automation_key', key);
    }
  } catch (e) {
    console.error('Failed to log automation:', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const AUTOMATION_KEY = 'blog_digest';

  try {
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');
    if (!egoisApiKey) throw new Error('EGOI_API_KEY missing');

    let force = false;
    let testMode = false;
    let testEmail = '';
    try {
      const body = await req.json();
      force = body?.force === true;
      testMode = body?.test === true;
      testEmail = body?.testEmail || '';
    } catch { /* no body */ }

    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, excerpt, slug, featured_image_url')
      .eq('status', 'published')
      .eq('included_in_digest', false)
      .order('published_at', { ascending: false })
      .limit(5);

    if (!posts || (posts.length < 3 && !force && !testMode)) {
      await logAutomation(supabase, AUTOMATION_KEY, 'skipped', 0, { reason: `Apenas ${posts?.length || 0} posts (mínimo 3)` });
      return new Response(JSON.stringify({ message: `Apenas ${posts?.length || 0} posts (mínimo 3)`, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!posts?.length) {
      await logAutomation(supabase, AUTOMATION_KEY, 'skipped', 0, { reason: 'Nenhum post' });
      return new Response(JSON.stringify({ message: 'Nenhum post', sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
      body: JSON.stringify({ templateType: 'blog_digest', context: { posts }, recipientName: testMode ? 'Admin' : '{first_name}' }),
    });
    if (!genResponse.ok) throw new Error(`Generator failed: ${await genResponse.text()}`);
    const { subject: baseSubject, html: baseHtml } = await genResponse.json();

    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquizz.com';
    const senderName = settings?.sender_name || 'MasterQuizz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) throw new Error('No sender in E-goi');

    // Test mode
    if (testMode && testEmail) {
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
    const sixtyDaysAgo = Date.now() - 60 * 86400000;
    const activeUsers = (authUsers?.users || []).filter(u => {
      const lastSign = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
      return lastSign > sixtyDaysAgo && u.email;
    });

    const userIds = activeUsers.map(u => u.id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds).not('email', 'is', null);
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    const emailBatch: Array<{ senderId: string; senderName: string; to: string; subject: string; htmlBody: string }> = [];
    for (const profile of (profiles || [])) {
      if (blacklistedIds.has(profile.id)) continue;
      if (unsubSet.has((profile.email || '').toLowerCase())) continue;

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

    // Mark posts as included
    await supabase.from('blog_posts').update({ included_in_digest: true }).in('slug', posts.map(p => p.slug));

    await logAutomation(supabase, AUTOMATION_KEY, 'success', sentCount, { posts: posts.length, total_targets: emailBatch.length });

    return new Response(JSON.stringify({ sent: sentCount, posts: posts.length, bulk: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('send-blog-digest error:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro';
    await logAutomation(supabase, AUTOMATION_KEY, 'error', 0, null, errMsg);
    return new Response(JSON.stringify({ error: errMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
