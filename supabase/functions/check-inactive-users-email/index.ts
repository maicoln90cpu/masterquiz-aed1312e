import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Parse body
    let targetCriteria: Record<string, unknown> = {};
    let ignoreCooldown = false;
    try {
      const body = await req.json();
      targetCriteria = body.targetCriteria || {};
      ignoreCooldown = body.ignoreCooldown || false;
    } catch { /* no body */ }

    // Load email recovery settings
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').single();
    if (!settings || !settings.is_active) {
      return new Response(JSON.stringify({ message: 'Email recovery inativo', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check time window (Brazil)
    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentMinutes = brasilTime.getHours() * 60 + brasilTime.getMinutes();
    const [sH, sM] = (settings.allowed_hours_start || '09:00').split(':').map(Number);
    const [eH, eM] = (settings.allowed_hours_end || '18:00').split(':').map(Number);
    if (currentMinutes < sH * 60 + sM || currentMinutes > eH * 60 + eM) {
      return new Response(JSON.stringify({ message: 'Fora do horário', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Daily limit check
    const today = new Date().toISOString().split('T')[0];
    const { count: sentToday } = await supabase
      .from('email_recovery_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', `${today}T00:00:00`);

    const remainingLimit = (settings.daily_email_limit || 100) - (sentToday || 0);
    if (remainingLimit <= 0) {
      return new Response(JSON.stringify({ message: 'Limite diário atingido', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get all users
    // Use the minimum trigger_days from active templates (not global setting)
    const { data: activeTemplates } = await supabase
      .from('email_recovery_templates')
      .select('id, trigger_days, category')
      .eq('is_active', true)
      .order('trigger_days', { ascending: true });

    if (!activeTemplates?.length) {
      return new Response(JSON.stringify({ message: 'Nenhum template ativo', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Exclude welcome (trigger_days=0) from inactivity check — welcome is handled by DB trigger
    const inactivityTemplates = activeTemplates.filter(t => t.category !== 'welcome' && t.trigger_days > 0);
    if (!inactivityTemplates.length) {
      return new Response(JSON.stringify({ message: 'Nenhum template de inatividade ativo', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const minInactiveDays = (targetCriteria.min_inactive_days as number) || inactivityTemplates[0].trigger_days;
    const inactivityDate = new Date();
    inactivityDate.setDate(inactivityDate.getDate() - minInactiveDays);

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw authError;

    const inactiveUsers = authUsers.users
      .filter(u => {
        const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null;
        return lastSignIn && lastSignIn < inactivityDate;
      })
      .map(u => ({ id: u.id, last_sign_in_at: u.last_sign_in_at ?? null }));

    if (!inactiveUsers.length) {
      return new Response(JSON.stringify({ message: 'Nenhum inativo', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get profiles WITH EMAIL
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_stage, user_objectives')
      .in('id', inactiveUsers.map(u => u.id))
      .not('email', 'is', null);

    // Blacklist check (reuse WhatsApp blacklist user_ids)
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('user_id');
    const blacklistedIds = new Set((blacklist || []).map(b => b.user_id));

    // Cooldown
    const cooldownDays = settings.user_cooldown_days || 14;
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);
    let recentlyContactedIds = new Set<string>();
    if (!ignoreCooldown) {
      const { data: recent } = await supabase
        .from('email_recovery_contacts')
        .select('user_id')
        .gte('created_at', cooldownDate.toISOString())
        .not('status', 'eq', 'cancelled');
      recentlyContactedIds = new Set((recent || []).map(c => c.user_id));
    }

    // Subscriptions
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan_type')
      .in('user_id', inactiveUsers.map(u => u.id));
    const userPlans = new Map((subs || []).map(s => [s.user_id, s.plan_type]));

    // Quiz stats
    const { data: statsData } = await supabase.rpc('get_user_quiz_stats', { user_ids: inactiveUsers.map(u => u.id) });
    const statsMap = new Map((statsData || []).map((s: any) => [s.user_id, s]));

    // Filter eligible
    const eligible: Array<{ id: string; email: string; days_inactive: number; plan: string; quiz_count: number; lead_count: number }> = [];

    for (const profile of profiles || []) {
      if (blacklistedIds.has(profile.id)) continue;
      if (recentlyContactedIds.has(profile.id)) continue;

      const plan = userPlans.get(profile.id) || 'free';
      if ((settings.exclude_plan_types || []).includes(plan)) continue;

      const auth = inactiveUsers.find(u => u.id === profile.id);
      const lastSignIn = auth?.last_sign_in_at ? new Date(auth.last_sign_in_at) : null;
      const daysInactive = lastSignIn ? Math.floor((Date.now() - lastSignIn.getTime()) / 86400000) : 999;

      const stats = statsMap.get(profile.id) as any;
      const quizCount = stats?.quiz_count ?? 0;
      const leadCount = stats?.lead_count ?? 0;

      // Criteria filters
      if (targetCriteria.no_leads && leadCount > 0) continue;
      if (targetCriteria.no_quizzes && quizCount > 0) continue;
      if (targetCriteria.plans && (targetCriteria.plans as string[]).length > 0 && !(targetCriteria.plans as string[]).includes(plan)) continue;

      eligible.push({ id: profile.id, email: profile.email!, days_inactive: daysInactive, plan, quiz_count: quizCount, lead_count: leadCount });
    }

    eligible.sort((a, b) => b.lead_count - a.lead_count);
    const toQueue = eligible.slice(0, remainingLimit);

    // Get best template
    const { data: templates } = await supabase
      .from('email_recovery_templates')
      .select('id, trigger_days')
      .eq('is_active', true)
      .order('trigger_days', { ascending: true });

    if (!templates?.length) {
      return new Response(JSON.stringify({ message: 'Nenhum template de email ativo', queued: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const contacts = [];
    for (const user of toQueue) {
      const sortedDesc = [...templates].sort((a, b) => b.trigger_days - a.trigger_days);
      const template = sortedDesc.find(t => t.trigger_days <= user.days_inactive) || templates[0];

      contacts.push({
        user_id: user.id,
        email: user.email,
        template_id: template.id,
        status: 'pending',
        priority: user.lead_count,
        days_inactive_at_contact: user.days_inactive,
        user_plan_at_contact: user.plan,
        user_quiz_count: user.quiz_count,
        user_lead_count: user.lead_count,
        scheduled_at: new Date().toISOString(),
      });
    }

    if (contacts.length > 0) {
      const { error: insertError } = await supabase
        .from('email_recovery_contacts')
        .upsert(contacts, { onConflict: 'user_id,template_id', ignoreDuplicates: true });
      if (insertError) throw insertError;
    }

    console.log(`Email queue: ${contacts.length} contacts added (eligible: ${eligible.length})`);

    return new Response(JSON.stringify({ message: `${contacts.length} emails enfileirados`, queued: contacts.length, total_eligible: eligible.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Email check error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
