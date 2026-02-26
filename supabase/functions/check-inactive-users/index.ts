import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecoverySettings {
  id: string;
  is_active: boolean;
  is_connected: boolean;
  inactivity_days_trigger: number;
  daily_message_limit: number;
  auto_campaign_enabled: boolean;
  exclude_plan_types: string[];
  allowed_hours_start: string;
  allowed_hours_end: string;
  user_cooldown_days: number;
}

interface TargetCriteria {
  no_leads?: boolean;
  no_quizzes?: boolean;
  plans?: string[];
  stages?: string[];
  objectives?: string[];
  min_inactive_days?: number;
}

interface InactiveUser {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  last_sign_in_at: string | null;
  days_inactive: number;
  plan_type: string;
  quiz_count: number;
  lead_count: number;
  user_stage: string | null;
  user_objectives: string[] | null;
}

function hasActiveCriteriaFilters(criteria: TargetCriteria): boolean {
  return !!(
    criteria.no_leads ||
    criteria.no_quizzes ||
    (criteria.plans && criteria.plans.length > 0) ||
    (criteria.stages && criteria.stages.length > 0) ||
    (criteria.objectives && criteria.objectives.length > 0)
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let campaignId: string | null = null;
    let templateId: string | null = null;
    let ignoreCooldown = false;
    let targetCriteria: TargetCriteria = {};

    try {
      const body = await req.json();
      campaignId = body.campaignId || null;
      templateId = body.templateId || null;
      ignoreCooldown = body.ignoreCooldown || false;
      targetCriteria = body.targetCriteria || {};
    } catch {
      // No body provided
    }

    // Se campaignId fornecido, buscar target_criteria da campanha (fallback)
    if (campaignId && Object.keys(targetCriteria).length === 0) {
      const { data: campaign } = await supabase
        .from('recovery_campaigns')
        .select('target_criteria')
        .eq('id', campaignId)
        .single();
      if (campaign?.target_criteria) {
        targetCriteria = campaign.target_criteria as TargetCriteria;
      }
    }

    // Buscar configurações
    const { data: settings, error: settingsError } = await supabase
      .from('recovery_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ message: 'Configurações não encontradas', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedSettings = settings as RecoverySettings;

    if (!typedSettings.is_active || !typedSettings.is_connected) {
      return new Response(
        JSON.stringify({ message: 'Sistema inativo ou desconectado', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar horário permitido
    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentTimeMinutes = brasilTime.getHours() * 60 + brasilTime.getMinutes();

    const [startHour, startMin] = typedSettings.allowed_hours_start.split(':').map(Number);
    const [endHour, endMin] = typedSettings.allowed_hours_end.split(':').map(Number);

    if (currentTimeMinutes < startHour * 60 + startMin || currentTimeMinutes > endHour * 60 + endMin) {
      return new Response(
        JSON.stringify({ message: 'Fora do horário permitido', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Contar mensagens já enviadas hoje
    const today = new Date().toISOString().split('T')[0];
    const { count: sentToday } = await supabase
      .from('recovery_contacts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .in('status', ['sent', 'delivered', 'read', 'responded']);

    const remainingLimit = typedSettings.daily_message_limit - (sentToday || 0);
    if (remainingLimit <= 0) {
      return new Response(
        JSON.stringify({ message: 'Limite diário atingido', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== DECISÃO: filtrar por inatividade ou buscar todos? =====
    // Se min_inactive_days NÃO foi definido explicitamente E existem outros filtros ativos,
    // buscar TODOS os usuários com WhatsApp (não filtrar por inatividade).
    const hasExplicitInactivity = targetCriteria.min_inactive_days !== undefined && targetCriteria.min_inactive_days > 0;
    const hasOtherFilters = hasActiveCriteriaFilters(targetCriteria);
    const shouldFilterByInactivity = hasExplicitInactivity || !hasOtherFilters;

    let userPool: Array<{ id: string; last_sign_in_at: string | null }> = [];

    if (shouldFilterByInactivity) {
      // Comportamento original: buscar apenas usuários inativos
      const minInactiveDays = targetCriteria.min_inactive_days || typedSettings.inactivity_days_trigger;
      const inactivityDate = new Date();
      inactivityDate.setDate(inactivityDate.getDate() - minInactiveDays);

      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;

      userPool = authUsers.users
        .filter(user => {
          const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
          return lastSignIn && lastSignIn < inactivityDate;
        })
        .map(user => ({ id: user.id, last_sign_in_at: user.last_sign_in_at ?? null }));

      console.log(`Inactivity filter: ${minInactiveDays} days, found ${userPool.length} inactive users`);
    } else {
      // Novo: buscar TODOS os usuários (sem filtro de inatividade)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;

      userPool = authUsers.users.map(user => ({
        id: user.id,
        last_sign_in_at: user.last_sign_in_at ?? null,
      }));

      console.log(`No inactivity filter (criteria-based campaign), pool: ${userPool.length} users`);
    }

    if (userPool.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum usuário encontrado', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar perfis com WhatsApp + stage + objectives
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp, user_stage, user_objectives')
      .in('id', userPool.map(u => u.id))
      .not('whatsapp', 'is', null);

    if (profilesError) throw profilesError;

    // Buscar blacklist
    const { data: blacklist } = await supabase.from('recovery_blacklist').select('phone_number, user_id');
    const blacklistedPhones = new Set((blacklist || []).map(b => b.phone_number));
    const blacklistedUserIds = new Set((blacklist || []).map(b => b.user_id));

    // Cooldown
    const cooldownDays = typedSettings.user_cooldown_days || 7;
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - cooldownDays);

    let recentlyContactedIds = new Set<string>();
    if (!ignoreCooldown) {
      const { data: recentContacts } = await supabase
        .from('recovery_contacts')
        .select('user_id')
        .gte('created_at', cooldownDate.toISOString())
        .not('status', 'eq', 'cancelled');
      recentlyContactedIds = new Set((recentContacts || []).map(c => c.user_id));
    }

    // Subscriptions
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('user_id, plan_type')
      .in('user_id', userPool.map(u => u.id));
    const userPlans = new Map((subscriptions || []).map(s => [s.user_id, s.plan_type]));

    // Quiz/lead stats
    const userStats = await supabase.rpc('get_user_quiz_stats', {
      user_ids: userPool.map(u => u.id)
    });
    const statsMap = new Map((userStats.data || []).map((s: { user_id: string; quiz_count: number; lead_count: number }) => [s.user_id, s]));

    // Filtrar usuários elegíveis
    const eligibleUsers: InactiveUser[] = [];

    for (const profile of profiles || []) {
      if (blacklistedUserIds.has(profile.id) || blacklistedPhones.has(profile.whatsapp)) continue;
      if (recentlyContactedIds.has(profile.id)) continue;

      const userPlan = userPlans.get(profile.id) || 'free';
      if (typedSettings.exclude_plan_types.includes(userPlan)) continue;

      const authUser = userPool.find(u => u.id === profile.id);
      const lastSignIn = authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null;
      const daysInactive = lastSignIn ? Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      const stats = statsMap.get(profile.id) as { quiz_count: number; lead_count: number } | undefined;
      const quizCount = stats?.quiz_count ?? 0;
      const leadCount = stats?.lead_count ?? 0;

      // ===== Aplicar filtros de target_criteria =====

      // Filtro: no_leads — apenas usuários com 0 leads
      if (targetCriteria.no_leads && leadCount > 0) continue;

      // Filtro: no_quizzes — apenas usuários com 0 quizzes
      if (targetCriteria.no_quizzes && quizCount > 0) continue;

      // Filtro: plans — apenas usuários no plano especificado
      if (targetCriteria.plans && targetCriteria.plans.length > 0) {
        if (!targetCriteria.plans.includes(userPlan)) continue;
      }

      // Filtro: stages — apenas usuários no estágio especificado
      if (targetCriteria.stages && targetCriteria.stages.length > 0) {
        const userStage = profile.user_stage || 'explorador';
        if (!targetCriteria.stages.includes(userStage)) continue;
      }

      // Filtro: objectives — pelo menos 1 objetivo em comum
      if (targetCriteria.objectives && targetCriteria.objectives.length > 0) {
        const userObjectives: string[] = profile.user_objectives || [];
        const hasMatch = targetCriteria.objectives.some((o: string) => userObjectives.includes(o));
        if (!hasMatch) continue;
      }

      eligibleUsers.push({
        id: profile.id,
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        days_inactive: daysInactive,
        plan_type: userPlan,
        quiz_count: quizCount,
        lead_count: leadCount,
        user_stage: profile.user_stage,
        user_objectives: profile.user_objectives,
      });
    }

    // Ordenar por prioridade
    eligibleUsers.sort((a, b) => b.lead_count - a.lead_count);
    const usersToQueue = eligibleUsers.slice(0, remainingLimit);

    // Template selection
    let selectedTemplate: { id: string; trigger_days: number } | null = null;
    let templates: Array<{ id: string; trigger_days: number }> = [];

    if (templateId) {
      const { data: template } = await supabase
        .from('recovery_templates')
        .select('id, trigger_days')
        .eq('id', templateId)
        .single();
      if (template) selectedTemplate = template;
    } else {
      const { data: templatesData } = await supabase
        .from('recovery_templates')
        .select('id, trigger_days')
        .eq('is_active', true)
        .order('trigger_days', { ascending: true });
      templates = templatesData || [];

      if (templates.length === 0) {
        return new Response(
          JSON.stringify({ message: 'Nenhum template ativo encontrado', queued: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Criar registros na fila
    const queuedContacts = [];
    for (const user of usersToQueue) {
      let templateToUse = selectedTemplate;
      if (!templateToUse && templates.length > 0) {
        const sortedDesc = [...templates].sort((a, b) => b.trigger_days - a.trigger_days);
        templateToUse = sortedDesc.find(t => t.trigger_days <= user.days_inactive) || templates[0];
      }
      if (!templateToUse) continue;

      queuedContacts.push({
        user_id: user.id,
        phone_number: user.whatsapp,
        template_id: templateToUse.id,
        campaign_id: campaignId,
        status: 'pending',
        priority: user.lead_count,
        days_inactive_at_contact: user.days_inactive,
        user_plan_at_contact: user.plan_type,
        user_quiz_count: user.quiz_count,
        user_lead_count: user.lead_count,
        scheduled_at: new Date().toISOString()
      });
    }

    if (queuedContacts.length > 0) {
      const { error: insertError } = await supabase
        .from('recovery_contacts')
        .insert(queuedContacts);
      if (insertError) throw insertError;

      if (campaignId) {
        await supabase
          .from('recovery_campaigns')
          .update({
            total_targets: queuedContacts.length,
            queued_count: queuedContacts.length,
            status: 'running',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
      }
    }

    console.log(`Queued ${queuedContacts.length} contacts (eligible: ${eligibleUsers.length}, inactivity_filter: ${shouldFilterByInactivity}, cooldown_ignored: ${ignoreCooldown})`);

    return new Response(
      JSON.stringify({
        message: `${queuedContacts.length} usuários adicionados à fila`,
        queued: queuedContacts.length,
        total_eligible: eligibleUsers.length,
        targetCount: queuedContacts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Check inactive users error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
