import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');
    if (!egoisApiKey) throw new Error('EGOI_API_KEY missing');

    let testMode = false;
    let testEmail = '';
    try { const body = await req.json(); testMode = body?.test === true; testEmail = body?.testEmail || ''; } catch { /* no body */ }

    const { data: previousTips } = await supabase.from('email_tips').select('topic').order('created_at', { ascending: false }).limit(10);
    const previousTopics = (previousTips || []).map(t => t.topic);

    const topics = [
      'taxa de conversão com quizzes', 'segmentação de leads', 'design de perguntas',
      'integração com CRM', 'copywriting para resultados', 'testes A/B em quizzes',
      'funil de vendas com quiz', 'remarketing com leads de quiz', 'quiz para e-commerce',
      'engajamento em redes sociais', 'landing pages com quiz', 'automação de follow-up',
    ];
    const available = topics.filter(t => !previousTopics.includes(t));
    const chosenTopic = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : topics[Math.floor(Math.random() * topics.length)];

    const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` },
      body: JSON.stringify({ templateType: 'weekly_tip', context: { topic: chosenTopic, previousTopics }, recipientName: testMode ? 'Admin' : '{first_name}' }),
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
      return new Response(JSON.stringify({ sent: res.ok ? 1 : 0, test: true, topic: chosenTopic }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Save tip (only in production mode)
    await supabase.from('email_tips').insert({ topic: chosenTopic, subject: baseSubject, html_content: baseHtml });

    // Load unsubscribes
    const { data: unsubscribed } = await supabase.from('email_unsubscribes').select('email');
    const unsubSet = new Set((unsubscribed || []).map(u => u.email.toLowerCase()));

    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const activeUsers = (authUsers?.users || []).filter(u => {
      const lastSign = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
      return lastSign > thirtyDaysAgo && u.email;
    });

    const userIds = activeUsers.map(u => u.id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds).not('email', 'is', null);
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    let sentCount = 0;
    for (const profile of (profiles || [])) {
      if (blacklistedIds.has(profile.id)) continue;
      if (unsubSet.has((profile.email || '').toLowerCase())) continue;

      const firstName = profile.full_name?.split(' ')[0] || 'Usuário';
      const html = baseHtml.replace(/{first_name}/g, firstName);
      const subject = baseSubject.replace(/{first_name}/g, firstName);

      try {
        const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ApiKey: egoisApiKey },
          body: JSON.stringify({ senderId: senderInfo.senderId, senderName, to: profile.email, subject, htmlBody: html, openTracking: true, clickTracking: true }),
        });
        if (res.ok) { sentCount++; await new Promise(r => setTimeout(r, 1500)); }
      } catch (e) { console.error(`Error:`, e); }
    }

    return new Response(JSON.stringify({ sent: sentCount, topic: chosenTopic }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('send-weekly-tip error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
