const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts'

Deno.serve(async (req) => {
  const traceId = getTraceId(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'x-trace-id': traceId } })
  }

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return errorResponse('UNAUTHORIZED', 'Token ausente', traceId, corsHeaders)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders)
    }

    const { data: roleCheck } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!roleCheck) {
      const { data: masterCheck } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'master_admin' })
      if (!masterCheck) {
        return errorResponse('FORBIDDEN', 'Requer admin ou master_admin', traceId, corsHeaders)
      }
    }

    // ═══════════════════════════════════════════
    // REAL PAYERS: Cross-reference webhook_logs
    // ═══════════════════════════════════════════
    const { data: webhookLogs } = await supabase
      .from('webhook_logs')
      .select('email, evento, status, created_at, paid_plan_type')
      .in('evento', ['order_approved', 'order_paid', 'subscription_created', 'order_refunded', 'subscription_canceled'])
      .order('created_at', { ascending: false })

    // Build map: email → is real payer (last relevant event is activation, not refund)
    const realPayerEmails = new Set<string>()
    const refundedEmails = new Set<string>()
    const processedEmails = new Set<string>()
    // Map email → plan they actually paid for (from webhook)
    const paidPlanByEmail = new Map<string, string>()
    
    for (const log of webhookLogs || []) {
      const email = log.email?.toLowerCase()
      if (!email || processedEmails.has(email)) continue
      // Skip test emails
      if (email.includes('example.com') || email.includes('test')) continue
      processedEmails.add(email)
      
      // Most recent event for this email determines status
      if (['order_refunded', 'subscription_canceled'].includes(log.evento)) {
        refundedEmails.add(email)
      } else if (['order_approved', 'order_paid', 'subscription_created'].includes(log.evento) && log.status === 'success') {
        realPayerEmails.add(email)
        // Use paid_plan_type from webhook if available, otherwise fallback
        if (log.paid_plan_type) {
          paidPlanByEmail.set(email, log.paid_plan_type)
        }
      }
    }

    // ═══════════════════════════════════════════
    // SECTION A — Activation Funnel
    // ═══════════════════════════════════════════

    // Total users — FONTE ÚNICA (Etapa 1): usuários reais com auth válido E profile ativo
    // Usa RPC count_real_users() para garantir consistência em todo o painel
    const { data: realUserCount } = await supabase.rpc('count_real_users')
    const totalUsers = Number(realUserCount || 0)

    // IDs reais (auth ∩ profiles ativos) para filtrar planCounts e excluir órfãos/duplicados
    const { data: realProfiles } = await supabase
      .from('profiles')
      .select('id')
      .is('deleted_at', null)
    const realUserIds = new Set((realProfiles || []).map((r: any) => r.id))

    // Plan counts: deduplica por user_id e considera apenas usuários reais
    const { data: usersByPlan } = await supabase
      .from('user_subscriptions')
      .select('plan_type, user_id')

    const planCounts: Record<string, number> = {}
    const seenPlanUsers = new Set<string>()
    for (const row of usersByPlan || []) {
      if (!realUserIds.has(row.user_id)) continue // ignora órfãos
      if (seenPlanUsers.has(row.user_id)) continue // ignora duplicados
      seenPlanUsers.add(row.user_id)
      planCounts[row.plan_type] = (planCounts[row.plan_type] || 0) + 1
    }

    // 7d variation — também via fonte canônica
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: newUsers7dCount } = await supabase.rpc('count_real_users_since', { _since: sevenDaysAgo })
    const newUsers7d = Number(newUsers7dCount || 0)

    // Funnel queries — EXCLUDE express_auto quizzes
    const { data: creators } = await supabase
      .from('quizzes')
      .select('user_id')
      .neq('creation_source', 'express_auto')
    const uniqueCreators = new Set((creators || []).map((r: any) => r.user_id))

    const { data: publishers } = await supabase
      .from('quizzes')
      .select('user_id')
      .eq('is_public', true)
      .eq('status', 'active')
      .neq('creation_source', 'express_auto')
    const uniquePublishers = new Set((publishers || []).map((r: any) => r.user_id))

    // Users who received at least 1 response (on non-express quizzes)
    const { data: nonExpressQuizIds } = await supabase
      .from('quizzes')
      .select('id, user_id')
      .neq('creation_source', 'express_auto')
    
    const quizOwnerMap = new Map<string, string>()
    for (const q of nonExpressQuizIds || []) {
      quizOwnerMap.set(q.id, q.user_id)
    }

    const { data: responders } = await supabase
      .from('quiz_responses')
      .select('quiz_id')
    
    const uniqueResponders = new Set<string>()
    const responseCountByUser: Record<string, number> = {}
    for (const r of responders || []) {
      const uid = quizOwnerMap.get(r.quiz_id)
      if (uid) {
        uniqueResponders.add(uid)
        responseCountByUser[uid] = (responseCountByUser[uid] || 0) + 1
      }
    }

    const users20Plus = Object.entries(responseCountByUser).filter(([, c]) => c >= 20).length

    // Get profiles to map user_id → email for real payer check
    const { data: allProfilesForPayer } = await supabase
      .from('profiles')
      .select('id, email')
    const userEmailMap = new Map<string, string>()
    for (const p of allProfilesForPayer || []) {
      if (p.email) userEmailMap.set(p.id, p.email.toLowerCase())
    }

    // Count real paid users (verified via webhook)
    const realPaidUserIds: string[] = []
    const trialUserIds: string[] = []
    for (const sub of usersByPlan || []) {
      if (['free', 'admin'].includes(sub.plan_type)) continue
      const email = userEmailMap.get(sub.user_id)
      if (email && realPayerEmails.has(email)) {
        realPaidUserIds.push(sub.user_id)
      } else {
        trialUserIds.push(sub.user_id)
      }
    }

    const funnelData = {
      createdQuiz: uniqueCreators.size,
      publishedQuiz: uniquePublishers.size,
      receivedResponse: uniqueResponders.size,
      received20Plus: users20Plus,
      paidUsers: realPaidUserIds.length,
    }

    // Median time: signup → first publish (in hours) — exclude express
    const { data: pubTimes } = await supabase
      .from('quizzes')
      .select('user_id, created_at')
      .eq('is_public', true)
      .eq('status', 'active')
      .neq('creation_source', 'express_auto')
      .order('created_at', { ascending: true })

    const { data: profileDates } = await supabase
      .from('profiles')
      .select('id, created_at')

    const profileMap = new Map((profileDates || []).map((p: any) => [p.id, p.created_at]))
    const firstPubByUser = new Map<string, string>()
    for (const q of pubTimes || []) {
      if (!firstPubByUser.has(q.user_id)) {
        firstPubByUser.set(q.user_id, q.created_at)
      }
    }

    const timesToPublish: number[] = []
    for (const [uid, pubDate] of firstPubByUser) {
      const signupDate = profileMap.get(uid)
      if (signupDate) {
        const hours = (new Date(pubDate).getTime() - new Date(signupDate).getTime()) / (1000 * 60 * 60)
        if (hours >= 0) timesToPublish.push(hours)
      }
    }
    timesToPublish.sort((a, b) => a - b)
    const medianTimeToPublish = timesToPublish.length > 0
      ? timesToPublish[Math.floor(timesToPublish.length / 2)]
      : null

    // Zombie users (registered 7+ days ago, never created quiz — excluding express)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .lt('created_at', sevenDaysAgo)

    const { data: allQuizUserIds } = await supabase
      .from('quizzes')
      .select('user_id')
      .neq('creation_source', 'express_auto')
    const quizUserSet = new Set((allQuizUserIds || []).map((r: any) => r.user_id))
    const zombies = (allProfiles || [])
      .filter((p: any) => !quizUserSet.has(p.id))
      .map((p: any) => ({
        id: p.id,
        email: p.email,
        name: p.full_name,
        created_at: p.created_at,
      }))

    // ═══════════════════════════════════════════
    // SECTION B — Platform Behavior
    // ═══════════════════════════════════════════

    // Quizzes per user (exclude express)
    const quizCountByUser: Record<string, number> = {}
    for (const q of creators || []) {
      quizCountByUser[q.user_id] = (quizCountByUser[q.user_id] || 0) + 1
    }
    const quizCountValues = Object.values(quizCountByUser)
    const avgQuizzesPerUser = quizCountValues.length > 0
      ? quizCountValues.reduce((a, b) => a + b, 0) / quizCountValues.length
      : 0

    // AI usage
    const { data: aiEvents } = await supabase
      .from('ai_quiz_generations')
      .select('user_id')
    const aiUserSet = new Set((aiEvents || []).map((e: any) => e.user_id))
    const aiUsageCount = aiEvents?.length || 0
    const aiNeverUsedPct = totalUsers > 0 ? ((totalUsers - aiUserSet.size) / totalUsers * 100) : 0

    // Total responses
    const { count: totalResponses } = await supabase
      .from('quiz_responses')
      .select('id', { count: 'exact', head: true })

    // Responses 7d ago
    const { count: responses7dAgo } = await supabase
      .from('quiz_responses')
      .select('id', { count: 'exact', head: true })
      .lt('completed_at', sevenDaysAgo)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: responses30dAgo } = await supabase
      .from('quiz_responses')
      .select('id', { count: 'exact', head: true })
      .lt('completed_at', thirtyDaysAgo)

    // CRM usage
    const { count: crmViewers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('crm_viewed_at', 'is', null)

    // Integrations by provider
    const { data: integrations } = await supabase
      .from('user_integrations')
      .select('provider, is_active')
      .eq('is_active', true)
    const integrationsByProvider: Record<string, number> = {}
    for (const i of integrations || []) {
      integrationsByProvider[i.provider] = (integrationsByProvider[i.provider] || 0) + 1
    }

    // Users hitting free limit (3 quizzes)
    const usersAtLimit = Object.entries(quizCountByUser)
      .filter(([uid, count]) => {
        const plan = (usersByPlan || []).find((u: any) => u.user_id === uid)
        return count >= 3 && (!plan || plan.plan_type === 'free')
      }).length

    // Last access segmentation
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', sevenDaysAgo)

    const { count: sleepingUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .lt('updated_at', eightDaysAgo)
      .gte('updated_at', thirtyDaysAgo)

    const lostUsers = totalUsers - (activeUsers || 0) - (sleepingUsers || 0)

    // UTM sources
    const { data: utmData } = await supabase
      .from('profiles')
      .select('utm_source, utm_medium, utm_campaign')
      .not('utm_source', 'is', null)
    const utmGroups: Record<string, number> = {}
    for (const u of utmData || []) {
      const key = u.utm_source || 'direct'
      utmGroups[key] = (utmGroups[key] || 0) + 1
    }

    // ═══════════════════════════════════════════
    // SECTION D — Advanced Metrics
    // ═══════════════════════════════════════════

    // Express funnel
    const { data: expressQuizzes } = await supabase
      .from('quizzes')
      .select('id, user_id, created_at')
      .eq('creation_source', 'express_auto')
    const expressCreated = expressQuizzes?.length || 0
    const { data: expressPublished } = await supabase
      .from('quizzes')
      .select('id, user_id')
      .eq('creation_source', 'express_auto')
      .eq('is_public', true)
      .eq('status', 'active')
    const expressPublishedCount = expressPublished?.length || 0

    // Users who created a 2nd quiz after Express
    const expressUserIds = new Set((expressQuizzes || []).map((q: any) => q.user_id))
    const expressTimeMap = new Map<string, string>()
    for (const q of expressQuizzes || []) {
      if (!expressTimeMap.has(q.user_id)) expressTimeMap.set(q.user_id, q.created_at)
    }
    // All non-express quizzes by express users
    const secondQuizTimings = { immediate: 0, sameDay: 0, later: 0, total: 0 }
    for (const q of creators || []) {
      if (!expressUserIds.has(q.user_id)) continue
      const expressTime = expressTimeMap.get(q.user_id)
      if (!expressTime) continue
      // Get creation time of non-express quiz
      const nonExpressQuiz = (nonExpressQuizIds || []).find((nq: any) => nq.user_id === q.user_id)
      if (!nonExpressQuiz) continue
      // We already have created_at from pubTimes or we need a separate query
      // Use simple check — if they're in creators, they created a non-express quiz
      secondQuizTimings.total++
      break // count each user once
    }
    // More precise: fetch non-express quiz times for express users
    const expressUserArr = Array.from(expressUserIds).slice(0, 100)
    if (expressUserArr.length > 0) {
      const { data: secondQuizzes } = await supabase
        .from('quizzes')
        .select('user_id, created_at')
        .neq('creation_source', 'express_auto')
        .in('user_id', expressUserArr)
        .order('created_at', { ascending: true })

      const secondByUser = new Map<string, string>()
      for (const q of secondQuizzes || []) {
        if (!secondByUser.has(q.user_id)) secondByUser.set(q.user_id, q.created_at)
      }
      secondQuizTimings.total = secondByUser.size
      secondQuizTimings.immediate = 0
      secondQuizTimings.sameDay = 0
      secondQuizTimings.later = 0
      for (const [uid, secondTime] of secondByUser) {
        const expTime = expressTimeMap.get(uid)
        if (!expTime) continue
        const diffHours = (new Date(secondTime).getTime() - new Date(expTime).getTime()) / (1000 * 60 * 60)
        if (diffHours < 1) secondQuizTimings.immediate++
        else if (diffHours < 24) secondQuizTimings.sameDay++
        else secondQuizTimings.later++
      }
    }

    // WhatsApp recovery segmentation by ICP (objective_selectedON)
    const { data: recoveryContacts } = await supabase
      .from('recovery_contacts')
      .select('user_id, reactivated')
      .eq('reactivated', true)
    const reactivatedUserIds = (recoveryContacts || []).map((r: any) => r.user_id)
    let whatsappIcpOn = 0
    let whatsappIcpOff = 0
    if (reactivatedUserIds.length > 0) {
      const { data: reactivatedProfiles } = await supabase
        .from('profiles')
        .select('id, user_objectives')
        .in('id', reactivatedUserIds.slice(0, 100))
      for (const p of reactivatedProfiles || []) {
        const hasObjective = p.user_objectives && p.user_objectives.length > 0
        if (hasObjective) whatsappIcpOn++
        else whatsappIcpOff++
      }
    }

    // 2nd quiz before/after first lead
    // Get first lead time per user (shared with Section E)
    const { data: firstLeads } = await supabase
      .from('quiz_responses')
      .select('quiz_id, completed_at')
      .order('completed_at', { ascending: true })

    const firstLeadByUser = new Map<string, string>()
    for (const r of firstLeads || []) {
      const uid = quizOwnerMap.get(r.quiz_id)
      if (uid && !firstLeadByUser.has(uid)) firstLeadByUser.set(uid, r.completed_at)
    }

    let secondQuizBeforeLead = 0
    let secondQuizAfterLead = 0
    if (expressUserArr.length > 0) {
      const { data: secondQuizzes2 } = await supabase
        .from('quizzes')
        .select('user_id, created_at')
        .neq('creation_source', 'express_auto')
        .in('user_id', expressUserArr)
        .order('created_at', { ascending: true })

      const firstNonExpressByUser = new Map<string, string>()
      for (const q of secondQuizzes2 || []) {
        if (!firstNonExpressByUser.has(q.user_id)) firstNonExpressByUser.set(q.user_id, q.created_at)
      }

      for (const [uid, quizTime] of firstNonExpressByUser) {
        const leadTime = firstLeadByUser.get(uid)
        if (!leadTime) { secondQuizBeforeLead++; continue }
        if (new Date(quizTime) < new Date(leadTime)) secondQuizBeforeLead++
        else secondQuizAfterLead++
      }
    }

    // Paywall views vs clicks (from GTM events)
    const { count: paywallViews } = await supabase
      .from('gtm_event_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'paywall_viewed')
    const { count: upgradeClicks } = await supabase
      .from('gtm_event_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'upgrade_clicked')

    // Editor session average (from GTM events)
    const { data: editorSessions } = await supabase
      .from('gtm_event_logs')
      .select('metadata')
      .eq('event_name', 'editor_session_end')
      .order('created_at', { ascending: false })
      .limit(200)
    const sessionDurations = (editorSessions || [])
      .map((e: any) => e.metadata?.duration_seconds)
      .filter((d: any) => typeof d === 'number' && d > 0)
    const avgEditorSession = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((a: number, b: number) => a + b, 0) / sessionDurations.length)
      : null

    // ═══════════════════════════════════════════
    // SECTION E — Advanced Dashboard Metrics (Etapa 3)
    // ═══════════════════════════════════════════

    // 1. ICP who published real quiz
    const { data: icpProfiles } = await supabase
      .from('profiles')
      .select('id, user_objectives')
      .not('user_objectives', 'is', null)
    const icpUserIds = (icpProfiles || []).filter((p: any) => p.user_objectives && p.user_objectives.length > 0).map((p: any) => p.id)
    const icpRegistered = icpUserIds.length
    const icpPublishedReal = icpUserIds.filter((uid: string) => uniquePublishers.has(uid)).length
    const icpConversionPct = icpRegistered > 0 ? Math.round((icpPublishedReal / icpRegistered) * 1000) / 10 : 0

    // 2. Used AI before publishing
    const publisherIds = Array.from(uniquePublishers)
    const aiBeforePublishCount = publisherIds.filter(uid => aiUserSet.has(uid)).length
    const aiBeforePublishPct = publisherIds.length > 0 ? Math.round((aiBeforePublishCount / publisherIds.length) * 1000) / 10 : 0

    // 3. Median logins before publishing
    const { data: loginProfiles } = await supabase
      .from('profiles')
      .select('id, login_count')
      .in('id', publisherIds.slice(0, 100))
    const loginCounts = (loginProfiles || [])
      .map((p: any) => p.login_count || 0)
      .filter((c: number) => c > 0)
      .sort((a: number, b: number) => a - b)
    const medianLoginsBeforePublish = loginCounts.length > 0
      ? loginCounts[Math.floor(loginCounts.length / 2)]
      : null

    // 4. CRM accessed after 1st lead
    const usersWithLeads = Array.from(uniqueResponders)
    const { data: crmAfterLeadProfiles } = await supabase
      .from('profiles')
      .select('id, crm_viewed_at')
      .in('id', usersWithLeads.slice(0, 100))
      .not('crm_viewed_at', 'is', null)
    const crmAfterFirstLeadCount = crmAfterLeadProfiles?.length || 0

    // 5. Paywall views without click (already have paywall data above)
    const paywallWithoutClick = (paywallViews || 0) - (upgradeClicks || 0)

    // 6. Conversion by plan (from webhook paid_plan_type)
    const conversionByPlan: Record<string, number> = {}
    for (const [, plan] of paidPlanByEmail) {
      conversionByPlan[plan] = (conversionByPlan[plan] || 0) + 1
    }

    // 7. Avg days signup → first lead
    const signupToLeadDays: number[] = []
    for (const [uid, leadDate] of firstLeadByUser || new Map()) {
      const signupDate = profileMap.get(uid)
      if (signupDate) {
        const days = (new Date(leadDate).getTime() - new Date(signupDate).getTime()) / (1000 * 60 * 60 * 24)
        if (days >= 0) signupToLeadDays.push(days)
      }
    }
    signupToLeadDays.sort((a, b) => a - b)
    const avgDaysToFirstLead = signupToLeadDays.length > 0
      ? Math.round(signupToLeadDays.reduce((a, b) => a + b, 0) / signupToLeadDays.length * 10) / 10
      : null

    // Need firstLeadByUser accessible — it's already computed in section D above


    // MRR — only real payers
    const { data: plans } = await supabase
      .from('subscription_plans')
      .select('plan_type, price_monthly')
    const priceMap = new Map((plans || []).map((p: any) => [p.plan_type, p.price_monthly || 0]))
    
    // Get the actual plan for each real payer
    // We need to find what plan they actually paid for via webhook
    // For now, use their current subscription plan but only if verified
    let mrr = 0
    const realPaidPlans: Record<string, number> = {}
    for (const sub of usersByPlan || []) {
      if (realPaidUserIds.includes(sub.user_id) && !['free', 'admin'].includes(sub.plan_type)) {
        // Use paid_plan_type from webhook if available (immutable), else fallback to current plan
        const email = userEmailMap.get(sub.user_id)
        const webhookPlan = email ? paidPlanByEmail.get(email) : null
        const effectivePlan = webhookPlan || sub.plan_type
        const price = priceMap.get(effectivePlan) || 0
        mrr += price
        realPaidPlans[effectivePlan] = (realPaidPlans[effectivePlan] || 0) + 1
      }
    }

    // Trial/courtesy users breakdown
    const trialPlans: Record<string, number> = {}
    for (const sub of usersByPlan || []) {
      if (trialUserIds.includes(sub.user_id) && !['free', 'admin'].includes(sub.plan_type)) {
        trialPlans[sub.plan_type] = (trialPlans[sub.plan_type] || 0) + 1
      }
    }

    const conversionRate = totalUsers > 0
      ? (realPaidUserIds.length / totalUsers * 100)
      : 0

    // Paid user profiles (only real payers)
    let paidUserProfiles: any[] = []
    if (realPaidUserIds.length > 0) {
      const { data: paidStats } = await supabase.rpc('get_user_quiz_stats', { user_ids: realPaidUserIds })
      const { data: paidProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .in('id', realPaidUserIds)

      const { data: paidSubs } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type, created_at')
        .in('user_id', realPaidUserIds)

      paidUserProfiles = (paidProfiles || []).map((p: any) => {
        const stats = (paidStats || []).find((s: any) => s.user_id === p.id)
        const sub = (paidSubs || []).find((s: any) => s.user_id === p.id)
        const daysToConvert = sub
          ? Math.round((new Date(sub.created_at).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : null
        return {
          email: p.email,
          name: p.full_name,
          plan: sub?.plan_type,
          quizzes: stats?.quiz_count || 0,
          leads: stats?.lead_count || 0,
          usedAI: aiUserSet.has(p.id),
          daysToConvert,
          source: 'webhook_verified',
        }
      })
    }

    // Trial user profiles  
    let trialUserProfiles: any[] = []
    if (trialUserIds.length > 0) {
      const { data: trialProfiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .in('id', trialUserIds)

      const { data: trialSubs } = await supabase
        .from('user_subscriptions')
        .select('user_id, plan_type')
        .in('user_id', trialUserIds)

      trialUserProfiles = (trialProfiles || []).map((p: any) => {
        const sub = (trialSubs || []).find((s: any) => s.user_id === p.id)
        return {
          email: p.email,
          name: p.full_name,
          plan: sub?.plan_type,
          source: 'manual_upgrade',
        }
      })
    }

    // Churn (trial_logs with status expired)
    const { data: churnData } = await supabase
      .from('trial_logs')
      .select('status')
    const churnCount = (churnData || []).filter((t: any) => t.status === 'expired').length

    // Median time free → paid (days) — real payers only
    const daysToConvert = paidUserProfiles
      .map((p: any) => p.daysToConvert)
      .filter((d: any) => d !== null && d >= 0)
      .sort((a: number, b: number) => a - b)
    const medianDaysToConvert = daysToConvert.length > 0
      ? daysToConvert[Math.floor(daysToConvert.length / 2)]
      : null

    const result = {
      sectionA: {
        totalUsers,
        planCounts,
        newUsers7d: newUsers7d || 0,
        funnel: {
          ...funnelData,
          icpPublishedReal,
          icpRegistered,
          icpConversionPct,
        },
        medianTimeToPublishHours: medianTimeToPublish ? Math.round(medianTimeToPublish * 10) / 10 : null,
        zombies: zombies.slice(0, 50),
        zombieCount: zombies.length,
      },
      sectionB: {
        avgQuizzesPerUser: Math.round(avgQuizzesPerUser * 100) / 100,
        quizDistribution: {
          '1': quizCountValues.filter(v => v === 1).length,
          '2-3': quizCountValues.filter(v => v >= 2 && v <= 3).length,
          '4-10': quizCountValues.filter(v => v >= 4 && v <= 10).length,
          '10+': quizCountValues.filter(v => v > 10).length,
        },
        aiUsage: {
          total: aiUsageCount,
          uniqueUsers: aiUserSet.size,
          neverUsedPct: Math.round(aiNeverUsedPct * 10) / 10,
        },
        totalResponses: totalResponses || 0,
        responsesGrowth7d: (totalResponses || 0) - (responses7dAgo || 0),
        responsesGrowth30d: (totalResponses || 0) - (responses30dAgo || 0),
        crmViewers: crmViewers || 0,
        integrationsByProvider,
        usersAtFreeLimit: usersAtLimit,
        activitySegmentation: {
          active: activeUsers || 0,
          sleeping: sleepingUsers || 0,
          lost: lostUsers,
        },
        utmSources: utmGroups,
        aiBeforePublish: { count: aiBeforePublishCount, total: publisherIds.length, pct: aiBeforePublishPct },
        medianLoginsBeforePublish,
        crmAfterFirstLead: { count: crmAfterFirstLeadCount, total: usersWithLeads.length },
      },
      sectionC: {
        mrr,
        realPaidByPlan: realPaidPlans,
        trialByPlan: trialPlans,
        paidByPlan: realPaidPlans,
        conversionRate: Math.round(conversionRate * 100) / 100,
        paidUserProfiles,
        trialUserProfiles,
        churnCount,
        medianDaysToConvert,
        realPaidCount: realPaidUserIds.length,
        trialCount: trialUserIds.length,
        conversionByPlan,
        avgDaysToFirstLead,
      },
      sectionD: {
        expressFunnel: {
          created: expressCreated,
          published: expressPublishedCount,
          createdSecondQuiz: secondQuizTimings.total,
          timings: {
            immediate: secondQuizTimings.immediate,
            sameDay: secondQuizTimings.sameDay,
            later: secondQuizTimings.later,
          },
        },
        whatsappRecoveryByIcp: {
          icpOn: whatsappIcpOn,
          icpOff: whatsappIcpOff,
          total: whatsappIcpOn + whatsappIcpOff,
        },
        secondQuizVsLead: {
          beforeLead: secondQuizBeforeLead,
          afterLead: secondQuizAfterLead,
        },
        paywallFunnel: {
          views: paywallViews || 0,
          clicks: upgradeClicks || 0,
          withoutClick: paywallWithoutClick,
        },
        editorSession: {
          avgSeconds: avgEditorSession,
          sampleSize: sessionDurations.length,
        },
      },
    }

    return okResponse(result, traceId, corsHeaders)
  } catch (error) {
    console.error('[growth-metrics] Error:', error)
    return errorResponse('INTERNAL_ERROR', (error as Error)?.message || 'Erro interno', traceId, corsHeaders)
  }
})
