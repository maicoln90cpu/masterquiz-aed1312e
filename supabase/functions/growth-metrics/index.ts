const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify caller is admin
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: roleCheck } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    if (!roleCheck) {
      const { data: masterCheck } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'master_admin' })
      if (!masterCheck) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    // Total users by plan
    const { data: usersByPlan } = await supabase
      .from('user_subscriptions')
      .select('plan_type, user_id')

    const planCounts: Record<string, number> = {}
    let totalUsers = 0
    for (const row of usersByPlan || []) {
      planCounts[row.plan_type] = (planCounts[row.plan_type] || 0) + 1
      totalUsers++
    }

    // 7d variation
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: newUsers7d } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

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
    // SECTION C — Revenue & Conversion (REAL PAYERS ONLY)
    // ═══════════════════════════════════════════

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
        funnel: funnelData,
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
      },
      sectionC: {
        mrr,
        realPaidByPlan: realPaidPlans,
        trialByPlan: trialPlans,
        paidByPlan: realPaidPlans, // backwards compat — now only real payers
        conversionRate: Math.round(conversionRate * 100) / 100,
        paidUserProfiles,
        trialUserProfiles,
        churnCount,
        medianDaysToConvert,
        realPaidCount: realPaidUserIds.length,
        trialCount: trialUserIds.length,
      },
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[growth-metrics] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
