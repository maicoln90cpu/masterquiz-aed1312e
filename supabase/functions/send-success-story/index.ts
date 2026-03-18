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

    // Get platform-wide average stats for realistic case
    const { count: totalQuizzes } = await supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: totalLeads } = await supabase.from('quiz_responses').select('*', { count: 'exact', head: true });
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    const avgLeads = totalUsers ? Math.round((totalLeads || 0) / (totalUsers || 1)) : 50;
    const avgQuizzes = totalUsers ? Math.round((totalQuizzes || 0) / (totalUsers || 1)) : 2;

    // Generate via shared generator
    const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        templateType: 'success_story',
        context: { platformStats: { avg_leads: avgLeads, avg_quizzes: avgQuizzes } },
        recipientName: '{first_name}',
      }),
    });

    if (!genResponse.ok) throw new Error(`Generator failed: ${await genResponse.text()}`);
    const { subject: baseSubject, html: baseHtml } = await genResponse.json();

    // Send to all active users
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquizz.com';
    const senderName = settings?.sender_name || 'MasterQuizz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) throw new Error('No sender in E-goi');

    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const activeUsers = (authUsers?.users || []).filter(u => u.email);

    const userIds = activeUsers.map(u => u.id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds).not('email', 'is', null);
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    let sentCount = 0;
    for (const profile of (profiles || [])) {
      if (blacklistedIds.has(profile.id)) continue;
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
      } catch (e) { console.error(`Error sending story to ${profile.email}:`, e); }
    }

    console.log(`Success story sent to ${sentCount} users`);
    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-success-story error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
