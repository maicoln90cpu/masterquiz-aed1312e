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
      if ((s.email || s.senderEmail || '').toLowerCase() === senderEmail.toLowerCase()) {
        return { senderId: String(s.senderId || s.id) };
      }
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

    // Check body for force mode
    let force = false;
    try { const body = await req.json(); force = body?.force === true; } catch { /* no body */ }

    // Get published posts not yet included in digest
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('title, excerpt, slug, featured_image_url')
      .eq('status', 'published')
      .eq('included_in_digest', false)
      .order('published_at', { ascending: false })
      .limit(5);

    if (!posts || posts.length < 3) {
      if (!force) {
        return new Response(JSON.stringify({ message: `Apenas ${posts?.length || 0} posts disponíveis (mínimo 3)`, sent: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!posts?.length) {
      return new Response(JSON.stringify({ message: 'Nenhum post disponível', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate email content via the shared generator
    const genResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-email-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        templateType: 'blog_digest',
        context: { posts },
        recipientName: '{first_name}',
      }),
    });

    if (!genResponse.ok) throw new Error(`Generator failed: ${await genResponse.text()}`);
    const { subject: baseSubject, html: baseHtml } = await genResponse.json();

    // Get email settings
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    const senderEmail = settings?.sender_email || 'noreply@masterquizz.com';
    const senderName = settings?.sender_name || 'MasterQuizz';
    const senderInfo = await resolveSenderId(egoisApiKey, senderEmail);
    if (!senderInfo) throw new Error('No sender in E-goi');

    // Get active users with email (logged in within 60 days)
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const sixtyDaysAgo = Date.now() - 60 * 86400000;
    const activeUsers = (authUsers?.users || []).filter(u => {
      const lastSign = u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : 0;
      return lastSign > sixtyDaysAgo && u.email;
    });

    const userIds = activeUsers.map(u => u.id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
      .not('email', 'is', null);

    // Blacklist
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    let sentCount = 0;
    for (const profile of (profiles || [])) {
      if (blacklistedIds.has(profile.id)) continue;

      const firstName = profile.full_name?.split(' ')[0] || 'Usuário';
      const personalHtml = baseHtml.replace(/{first_name}/g, firstName);
      const personalSubject = baseSubject.replace(/{first_name}/g, firstName);

      try {
        const res = await fetch('https://slingshot.egoiapp.com/api/v2/email/messages/action/send/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ApiKey: egoisApiKey },
          body: JSON.stringify({
            senderId: senderInfo.senderId,
            senderName,
            to: profile.email,
            subject: personalSubject,
            htmlBody: personalHtml,
            openTracking: true,
            clickTracking: true,
          }),
        });

        if (res.ok) {
          sentCount++;
          // Small delay
          await new Promise(r => setTimeout(r, 1500));
        } else {
          console.error(`Failed to send digest to ${profile.email}:`, res.status);
        }
      } catch (e) {
        console.error(`Error sending to ${profile.email}:`, e);
      }
    }

    // Mark posts as included in digest
    const slugs = posts.map(p => p.slug);
    await supabase.from('blog_posts').update({ included_in_digest: true }).in('slug', slugs);

    console.log(`Blog digest sent to ${sentCount} users, marked ${slugs.length} posts`);

    return new Response(JSON.stringify({ message: `Digest enviado para ${sentCount} usuários`, sent: sentCount, posts: slugs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-blog-digest error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
