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

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const egoisApiKey = Deno.env.get('EGOI_API_KEY');
    if (!egoisApiKey) throw new Error('EGOI_API_KEY missing');

    // Calculate date ranges for current and previous months
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthName = MONTH_NAMES[prevMonthStart.getMonth()];

    // Get settings + sender
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquizz.com';
    const senderName = settings?.sender_name || 'MasterQuizz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) throw new Error('No sender in E-goi');

    // Get active users (logged in within 90 days)
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const ninetyDaysAgo = Date.now() - 90 * 86400000;
    const activeUsers = (authUsers?.users || []).filter(u => {
      const lastSign = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
      return lastSign > ninetyDaysAgo && u.email;
    });

    const userIds = activeUsers.map(u => u.id);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds).not('email', 'is', null);
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    let sentCount = 0;

    for (const profile of (profiles || [])) {
      if (blacklistedIds.has(profile.id)) continue;

      // Get user's stats for previous month
      const { data: userQuizzes } = await supabase
        .from('quizzes')
        .select('id')
        .eq('user_id', profile.id)
        .eq('status', 'active');
      const quizIds = (userQuizzes || []).map(q => q.id);

      let leadCount = 0;
      let responseCount = 0;
      let prevLeadCount = 0;

      if (quizIds.length > 0) {
        // Leads in previous month
        const { count: leads } = await supabase
          .from('quiz_responses')
          .select('*', { count: 'exact', head: true })
          .in('quiz_id', quizIds)
          .gte('completed_at', prevMonthStart.toISOString())
          .lt('completed_at', currentMonth.toISOString());
        leadCount = leads || 0;

        // Total responses in previous month
        responseCount = leadCount;

        // Leads two months ago (for growth comparison)
        const { count: prevLeads } = await supabase
          .from('quiz_responses')
          .select('*', { count: 'exact', head: true })
          .in('quiz_id', quizIds)
          .gte('completed_at', twoMonthsAgo.toISOString())
          .lt('completed_at', prevMonthStart.toISOString());
        prevLeadCount = prevLeads || 0;
      }

      // Generate personalized email
      try {
        const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            templateType: 'monthly_summary',
            context: {
              monthName,
              userStats: {
                quiz_count: quizIds.length,
                lead_count: leadCount,
                response_count: responseCount,
                prev_lead_count: prevLeadCount,
              },
            },
            recipientName: profile.full_name || 'Usuário',
          }),
        });

        if (!genResponse.ok) {
          console.error(`Generator failed for ${profile.email}`);
          continue;
        }

        const { subject, html } = await genResponse.json();

        const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ApiKey: egoisApiKey },
          body: JSON.stringify({ senderId: senderInfo.senderId, senderName, to: profile.email, subject, htmlBody: html, openTracking: true, clickTracking: true }),
        });

        if (res.ok) {
          sentCount++;
          await new Promise(r => setTimeout(r, 2000)); // Slightly longer delay for personalized content
        }
      } catch (e) {
        console.error(`Error sending summary to ${profile.email}:`, e);
      }
    }

    console.log(`Monthly summary for ${monthName} sent to ${sentCount} users`);
    return new Response(JSON.stringify({ sent: sentCount, month: monthName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-monthly-summary error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
