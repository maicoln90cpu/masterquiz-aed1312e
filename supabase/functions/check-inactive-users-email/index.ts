import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);
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
    const { data: settings } = await supabase.from('email_recovery_settings').select('*').maybeSingle();
    if (!settings || !settings.is_active) {
      return okResponse({ message: 'Email recovery inativo', queued: 0 }, traceId, corsHeaders);
    }

    // Check time window (Brazil)
    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentMinutes = brasilTime.getHours() * 60 + brasilTime.getMinutes();
    const [sH, sM] = (settings.allowed_hours_start || '09:00').split(':').map(Number);
    const [eH, eM] = (settings.allowed_hours_end || '18:00').split(':').map(Number);
    if (currentMinutes < sH * 60 + sM || currentMinutes > eH * 60 + eM) {
      return okResponse({ message: 'Fora do horário', queued: 0 }, traceId, corsHeaders);
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
      return okResponse({ message: 'Limite diário atingido', queued: 0 }, traceId, corsHeaders);
    }

    // Get all active templates (excluding welcome — handled by DB trigger)
    const { data: activeTemplates } = await supabase
      .from('email_recovery_templates')
      .select('id, trigger_days, category, name')
      .eq('is_active', true)
      .order('trigger_days', { ascending: true });

    if (!activeTemplates?.length) {
      return okResponse({ message: 'Nenhum template ativo', queued: 0 }, traceId, corsHeaders);
    }

    // Separate templates by type
    // Categories handled by SQL triggers (skip here): welcome, milestone, tutorial
    const inactivityCategories = ['check_in', 'reminder', 'recovery', 'special_offer', 'reactivation', 're_engagement'];
    const signupAgeCategories = ['survey']; // based on signup date, not inactivity

    const inactivityTemplates = activeTemplates.filter(t => inactivityCategories.includes(t.category) && t.trigger_days > 0);
    const surveyTemplates = activeTemplates.filter(t => signupAgeCategories.includes(t.category));
    const planCompareTemplates = activeTemplates.filter(t => t.category === 'plan_compare');
    const integrationGuideTemplates = activeTemplates.filter(t => t.category === 'integration_guide');
    // ETAPA 5 — 4 novos blocos
    const zombieTemplates = activeTemplates.filter(t => t.category === 'zombie');
    const noResponseTemplates = activeTemplates.filter(t => t.category === 'no_response');
    const draftAbandonedTemplates = activeTemplates.filter(t => t.category === 'draft_abandoned');
    const upgradeNudgeTemplates = activeTemplates.filter(t => t.category === 'upgrade_nudge');

    // ETAPA 6 — Blocos E (nurture pós-cadastro) e F (pós-tutorial)
    const nurtureD3Templates = activeTemplates.filter(t => t.category === 'nurture_d3');
    const nurtureD7Templates = activeTemplates.filter(t => t.category === 'nurture_d7');
    const nurtureD14Templates = activeTemplates.filter(t => t.category === 'nurture_d14');
    const nurtureD21Templates = activeTemplates.filter(t => t.category === 'nurture_d21');
    const postTutorialD7Templates = activeTemplates.filter(t => t.category === 'post_tutorial_d7');
    const postTutorialD14Templates = activeTemplates.filter(t => t.category === 'post_tutorial_d14');

    const hasAnyTemplate = inactivityTemplates.length || surveyTemplates.length ||
      planCompareTemplates.length || integrationGuideTemplates.length ||
      zombieTemplates.length || noResponseTemplates.length ||
      draftAbandonedTemplates.length || upgradeNudgeTemplates.length ||
      nurtureD3Templates.length || nurtureD7Templates.length ||
      nurtureD14Templates.length || nurtureD21Templates.length ||
      postTutorialD7Templates.length || postTutorialD14Templates.length;

    if (!hasAnyTemplate) {
      return okResponse({ message: 'Nenhum template processável ativo', queued: 0 }, traceId, corsHeaders);
    }

    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw authError;

    // Get all profiles with email
    const allUserIds = authUsers.users.map(u => u.id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_stage, user_objectives, created_at, facebook_pixel_id, gtm_container_id, whatsapp, login_count, plan_limit_hit_type')
      .in('id', allUserIds)
      .not('email', 'is', null);

    if (!profiles?.length) {
      return okResponse({ message: 'Nenhum perfil com email', queued: 0 }, traceId, corsHeaders);
    }

    // Institutional domains — query DB (single source of truth, fallback hardcoded)
    const FALLBACK_INSTITUTIONAL = ['gov.br','edu.br','mil.br','jus.br','mp.br','leg.br'];
    const { data: instDomainsData } = await supabase
      .from('institutional_email_domains')
      .select('domain')
      .eq('is_active', true);
    const institutionalDomains: string[] = (instDomainsData?.map((d: { domain: string }) => d.domain.toLowerCase()) || FALLBACK_INSTITUTIONAL);
    const isInstitutional = (email: string | null | undefined): boolean => {
      if (!email) return false;
      const host = email.toLowerCase().split('@')[1] || '';
      if (!host) return false;
      return institutionalDomains.some(d => host === d || host.endsWith('.' + d));
    };
    let institutionalSkipped = 0;

    // Blacklist
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
      .in('user_id', allUserIds);
    const userPlans = new Map((subs || []).map(s => [s.user_id, s.plan_type]));

    // Quiz stats
    const { data: statsData } = await supabase.rpc('get_user_quiz_stats', { user_ids: allUserIds });
    const statsMap = new Map((statsData || []).map((s: any) => [s.user_id, s]));

    // Already sent templates per user (to avoid duplicates)
    const { data: existingContacts } = await supabase
      .from('email_recovery_contacts')
      .select('user_id, template_id')
      .in('status', ['pending', 'sent', 'opened', 'clicked']);
    const sentSet = new Set((existingContacts || []).map(c => `${c.user_id}|${c.template_id}`));

    // Integrations check (for integration_guide)
    const { data: integrations } = await supabase
      .from('user_integrations')
      .select('user_id')
      .in('user_id', allUserIds);
    const usersWithIntegrations = new Set((integrations || []).map(i => i.user_id));

    // Quizzes (para Blocos B e C — Etapa 5)
    const needsQuizzes = noResponseTemplates.length > 0 || draftAbandonedTemplates.length > 0 ||
      nurtureD3Templates.length > 0 || nurtureD7Templates.length > 0 ||
      nurtureD14Templates.length > 0 || nurtureD21Templates.length > 0 ||
      postTutorialD7Templates.length > 0 || postTutorialD14Templates.length > 0;
    const quizzesByUser = new Map<string, Array<{ id: string; status: string; updated_at: string; creation_source: string | null; created_at: string }>>();
    if (needsQuizzes) {
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, user_id, status, updated_at, creation_source, created_at')
        .in('user_id', allUserIds);
      for (const q of quizzes || []) {
        const list = quizzesByUser.get(q.user_id) || [];
        list.push(q);
        quizzesByUser.set(q.user_id, list);
      }
    }

    const contacts: any[] = [];

    for (const profile of profiles) {
      if (blacklistedIds.has(profile.id)) continue;
      if (recentlyContactedIds.has(profile.id)) continue;

      const plan = userPlans.get(profile.id) || 'free';
      if ((settings.exclude_plan_types || []).includes(plan)) continue;

      const auth = authUsers.users.find(u => u.id === profile.id);
      const lastSignIn = auth?.last_sign_in_at ? new Date(auth.last_sign_in_at) : null;
      const daysInactive = lastSignIn ? Math.floor((Date.now() - lastSignIn.getTime()) / 86400000) : 999;
      const daysSinceSignup = profile.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) : 0;

      const stats = statsMap.get(profile.id) as any;
      const quizCount = stats?.quiz_count ?? 0;
      const leadCount = stats?.lead_count ?? 0;

      // Criteria filters
      if (targetCriteria.no_leads && leadCount > 0) continue;
      if (targetCriteria.no_quizzes && quizCount > 0) continue;
      if (targetCriteria.plans && (targetCriteria.plans as string[]).length > 0 && !(targetCriteria.plans as string[]).includes(plan)) continue;

      // --- INACTIVITY-BASED templates ---
      if (inactivityTemplates.length > 0 && lastSignIn) {
        const minDays = (targetCriteria.min_inactive_days as number) || inactivityTemplates[0].trigger_days;
        if (daysInactive >= minDays) {
          // Find best matching template
          const sortedDesc = [...inactivityTemplates].sort((a, b) => b.trigger_days - a.trigger_days);
          const template = sortedDesc.find(t => t.trigger_days <= daysInactive) || inactivityTemplates[0];
          const key = `${profile.id}|${template.id}`;
          if (!sentSet.has(key)) {
            contacts.push({
              user_id: profile.id,
              email: profile.email,
              template_id: template.id,
              status: 'pending',
              priority: leadCount,
              days_inactive_at_contact: daysInactive,
              user_plan_at_contact: plan,
              user_quiz_count: quizCount,
              user_lead_count: leadCount,
              scheduled_at: new Date().toISOString(),
            });
            sentSet.add(key);
          }
        }
      }

      // --- SURVEY: 30 days after signup ---
      for (const tmpl of surveyTemplates) {
        if (daysSinceSignup >= (tmpl.trigger_days || 30)) {
          const key = `${profile.id}|${tmpl.id}`;
          if (!sentSet.has(key)) {
            contacts.push({
              user_id: profile.id,
              email: profile.email,
              template_id: tmpl.id,
              status: 'pending',
              priority: leadCount,
              days_inactive_at_contact: daysInactive,
              user_plan_at_contact: plan,
              user_quiz_count: quizCount,
              user_lead_count: leadCount,
              scheduled_at: new Date().toISOString(),
            });
            sentSet.add(key);
          }
        }
      }

      // --- PLAN COMPARE: 14 days on free plan ---
      if (plan === 'free') {
        for (const tmpl of planCompareTemplates) {
          if (daysSinceSignup >= (tmpl.trigger_days || 14)) {
            const key = `${profile.id}|${tmpl.id}`;
            if (!sentSet.has(key)) {
              contacts.push({
                user_id: profile.id,
                email: profile.email,
                template_id: tmpl.id,
                status: 'pending',
                priority: leadCount,
                days_inactive_at_contact: daysInactive,
                user_plan_at_contact: plan,
                user_quiz_count: quizCount,
                user_lead_count: leadCount,
                scheduled_at: new Date().toISOString(),
              });
              sentSet.add(key);
            }
          }
        }
      }

      // --- INTEGRATION GUIDE: 7 days without integrations ---
      if (!usersWithIntegrations.has(profile.id) && !profile.facebook_pixel_id && !profile.gtm_container_id) {
        for (const tmpl of integrationGuideTemplates) {
          if (daysSinceSignup >= (tmpl.trigger_days || 7)) {
            const key = `${profile.id}|${tmpl.id}`;
            if (!sentSet.has(key)) {
              contacts.push({
                user_id: profile.id,
                email: profile.email,
                template_id: tmpl.id,
                status: 'pending',
                priority: leadCount,
                days_inactive_at_contact: daysInactive,
                user_plan_at_contact: plan,
                user_quiz_count: quizCount,
                user_lead_count: leadCount,
                scheduled_at: new Date().toISOString(),
              });
              sentSet.add(key);
            }
          }
        }
      }

      // --- FILTRO INSTITUCIONAL para Blocos A/B/C/D (não aplicado nos blocos antigos para preservar comportamento) ---
      const skipNewBlocksInstitutional = isInstitutional(profile.email);
      if (skipNewBlocksInstitutional) {
        institutionalSkipped++;
      }

      // --- BLOCO A — ZOMBIE: login_count <= 1 + 30+ dias signup + sem quiz real ---
      if (!skipNewBlocksInstitutional && zombieTemplates.length > 0 && (profile.login_count ?? 0) <= 1 && daysSinceSignup >= 30) {
        const userQuizzes = quizzesByUser.get(profile.id) || [];
        const hasRealQuiz = userQuizzes.some(q => (q.creation_source || 'manual') !== 'express_auto');
        if (!hasRealQuiz) {
          for (const tmpl of zombieTemplates) {
            const key = `${profile.id}|${tmpl.id}`;
            if (!sentSet.has(key)) {
              contacts.push({
                user_id: profile.id, email: profile.email, template_id: tmpl.id,
                status: 'pending', priority: 20,
                days_inactive_at_contact: daysInactive, user_plan_at_contact: plan,
                user_quiz_count: quizCount, user_lead_count: leadCount,
                scheduled_at: new Date().toISOString(),
              });
              sentSet.add(key);
            }
          }
        }
      }

      // --- BLOCO B — NO RESPONSE: quiz publicado há 7+ dias com 0 leads ---
      if (!skipNewBlocksInstitutional && noResponseTemplates.length > 0 && leadCount === 0) {
        const userQuizzes = quizzesByUser.get(profile.id) || [];
        const hasOldActiveQuiz = userQuizzes.some(q => {
          if (q.status !== 'active') return false;
          const ageDays = Math.floor((Date.now() - new Date(q.updated_at).getTime()) / 86400000);
          return ageDays >= 7;
        });
        if (hasOldActiveQuiz) {
          for (const tmpl of noResponseTemplates) {
            const key = `${profile.id}|${tmpl.id}`;
            if (!sentSet.has(key)) {
              contacts.push({
                user_id: profile.id, email: profile.email, template_id: tmpl.id,
                status: 'pending', priority: 15,
                days_inactive_at_contact: daysInactive, user_plan_at_contact: plan,
                user_quiz_count: quizCount, user_lead_count: leadCount,
                scheduled_at: new Date().toISOString(),
              });
              sentSet.add(key);
            }
          }
        }
      }

      // --- BLOCO C — DRAFT ABANDONED: rascunho não-express há 7+ dias + login_count >= 2 ---
      if (!skipNewBlocksInstitutional && draftAbandonedTemplates.length > 0 && (profile.login_count ?? 0) >= 2) {
        const userQuizzes = quizzesByUser.get(profile.id) || [];
        const hasOldDraft = userQuizzes.some(q => {
          if (q.status !== 'draft') return false;
          if ((q.creation_source || 'manual') === 'express_auto') return false;
          const ageDays = Math.floor((Date.now() - new Date(q.updated_at).getTime()) / 86400000);
          return ageDays >= 7;
        });
        if (hasOldDraft) {
          for (const tmpl of draftAbandonedTemplates) {
            const key = `${profile.id}|${tmpl.id}`;
            if (!sentSet.has(key)) {
              contacts.push({
                user_id: profile.id, email: profile.email, template_id: tmpl.id,
                status: 'pending', priority: 10,
                days_inactive_at_contact: daysInactive, user_plan_at_contact: plan,
                user_quiz_count: quizCount, user_lead_count: leadCount,
                scheduled_at: new Date().toISOString(),
              });
              sentSet.add(key);
            }
          }
        }
      }

      // --- BLOCO D — UPGRADE NUDGE (rede de segurança): plan_limit_hit_type='lead' ---
      if (!skipNewBlocksInstitutional && upgradeNudgeTemplates.length > 0 && profile.plan_limit_hit_type === 'lead') {
        for (const tmpl of upgradeNudgeTemplates) {
          const key = `${profile.id}|${tmpl.id}`;
          if (!sentSet.has(key)) {
            contacts.push({
              user_id: profile.id, email: profile.email, template_id: tmpl.id,
              status: 'pending', priority: 100,
              days_inactive_at_contact: daysInactive, user_plan_at_contact: plan,
              user_quiz_count: quizCount, user_lead_count: leadCount,
              scheduled_at: new Date().toISOString(),
            });
            sentSet.add(key);
          }
        }
      }

      // --- BLOCO E — NURTURE pós-cadastro (free, sem quiz real, login_count >= 1) em D3/D7/D14/D21 ---
      // Janela [X-1, X+1] para evitar colisão entre os 4 nurtures
      if (!skipNewBlocksInstitutional && plan === 'free' && (profile.login_count ?? 0) >= 1) {
        const userQuizzes = quizzesByUser.get(profile.id) || [];
        const hasRealQuizE = userQuizzes.some(q => (q.creation_source || 'manual') !== 'express_auto');
        if (!hasRealQuizE) {
          const nurtureBlocks: Array<{ day: number; templates: typeof nurtureD3Templates; priority: number }> = [
            { day: 3, templates: nurtureD3Templates, priority: 30 },
            { day: 7, templates: nurtureD7Templates, priority: 28 },
            { day: 14, templates: nurtureD14Templates, priority: 26 },
            { day: 21, templates: nurtureD21Templates, priority: 24 },
          ];
          for (const block of nurtureBlocks) {
            if (block.templates.length === 0) continue;
            if (daysSinceSignup < block.day - 1 || daysSinceSignup > block.day + 1) continue;
            for (const tmpl of block.templates) {
              const key = `${profile.id}|${tmpl.id}`;
              if (!sentSet.has(key)) {
                contacts.push({
                  user_id: profile.id, email: profile.email, template_id: tmpl.id,
                  status: 'pending', priority: block.priority,
                  days_inactive_at_contact: daysInactive, user_plan_at_contact: plan,
                  user_quiz_count: quizCount, user_lead_count: leadCount,
                  scheduled_at: new Date().toISOString(),
                });
                sentSet.add(key);
              }
            }
          }
        }
      }

      // --- BLOCO F — POST-TUTORIAL (free, criou 1º quiz REAL há 7 ou 14 dias, janela ±1) ---
      if (!skipNewBlocksInstitutional && plan === 'free' &&
          (postTutorialD7Templates.length > 0 || postTutorialD14Templates.length > 0)) {
        const userQuizzes = quizzesByUser.get(profile.id) || [];
        const realQuizzes = userQuizzes
          .filter(q => (q.creation_source || 'manual') !== 'express_auto')
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        if (realQuizzes.length > 0) {
          const firstRealCreatedAt = new Date(realQuizzes[0].created_at).getTime();
          const daysSinceFirstRealQuiz = Math.floor((Date.now() - firstRealCreatedAt) / 86400000);
          const postTutorialBlocks: Array<{ day: number; templates: typeof postTutorialD7Templates; priority: number }> = [
            { day: 7, templates: postTutorialD7Templates, priority: 22 },
            { day: 14, templates: postTutorialD14Templates, priority: 20 },
          ];
          for (const block of postTutorialBlocks) {
            if (block.templates.length === 0) continue;
            if (daysSinceFirstRealQuiz < block.day - 1 || daysSinceFirstRealQuiz > block.day + 1) continue;
            for (const tmpl of block.templates) {
              const key = `${profile.id}|${tmpl.id}`;
              if (!sentSet.has(key)) {
                contacts.push({
                  user_id: profile.id, email: profile.email, template_id: tmpl.id,
                  status: 'pending', priority: block.priority,
                  days_inactive_at_contact: daysInactive, user_plan_at_contact: plan,
                  user_quiz_count: quizCount, user_lead_count: leadCount,
                  scheduled_at: new Date().toISOString(),
                });
                sentSet.add(key);
              }
            }
          }
        }
      }
    }

    // Respect daily limit
    contacts.sort((a, b) => b.priority - a.priority);
    const toQueue = contacts.slice(0, remainingLimit);

    if (toQueue.length > 0) {
      const { error: insertError } = await supabase
        .from('email_recovery_contacts')
        .upsert(toQueue, { onConflict: 'user_id,template_id,campaign_id', ignoreDuplicates: true });
      if (insertError) throw insertError;
    }

    console.log(`Email queue: ${toQueue.length} contacts added (eligible: ${contacts.length})`);

    return okResponse({
      message: `${toQueue.length} emails enfileirados`,
      queued: toQueue.length,
      total_eligible: contacts.length,
      breakdown: {
        inactivity: inactivityTemplates.length,
        survey: surveyTemplates.length,
        plan_compare: planCompareTemplates.length,
        integration_guide: integrationGuideTemplates.length,
        zombie: zombieTemplates.length,
        no_response: noResponseTemplates.length,
        draft_abandoned: draftAbandonedTemplates.length,
        upgrade_nudge: upgradeNudgeTemplates.length,
        nurture_d3: nurtureD3Templates.length,
        nurture_d7: nurtureD7Templates.length,
        nurture_d14: nurtureD14Templates.length,
        nurture_d21: nurtureD21Templates.length,
        post_tutorial_d7: postTutorialD7Templates.length,
        post_tutorial_d14: postTutorialD14Templates.length,
        institutional_skipped: institutionalSkipped,
        institutional_domains_loaded: institutionalDomains.length,
      }
    }, traceId, corsHeaders);
  } catch (error) {
    console.error('Email check error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro', traceId, corsHeaders);
  }
});
