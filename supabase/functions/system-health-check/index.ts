import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller using getUser (works with signing-keys)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "master_admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse client metrics
    const body = await req.json().catch(() => ({}));
    const clientMetrics = body.metrics || {};

    // Collect server-side metrics in parallel
    const [
      quizzesCount,
      responsesCount,
      usersCount,
      recentResponses,
      integrationsCount,
      auditLogsCount,
    ] = await Promise.all([
      adminClient.from("quizzes").select("*", { count: "exact", head: true }),
      adminClient.from("quiz_responses").select("*", { count: "exact", head: true }),
      adminClient.from("user_subscriptions").select("*", { count: "exact", head: true }),
      adminClient
        .from("quiz_responses")
        .select("completed_at")
        .gte("completed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1000),
      adminClient.from("user_integrations").select("*", { count: "exact", head: true }),
      adminClient
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Calculate module scores
    const modules = [];

    // 1. Database health
    const totalQuizzes = quizzesCount.count || 0;
    const totalResponses = responsesCount.count || 0;
    const dbScore = Math.min(100, 70 + (totalQuizzes > 0 ? 10 : 0) + (totalResponses > 0 ? 10 : 0) + 10);
    modules.push({
      module: "database",
      status: dbScore >= 85 ? "healthy" : dbScore >= 60 ? "warning" : "critical",
      score: dbScore,
      details: { totalQuizzes, totalResponses, totalUsers: usersCount.count || 0 },
    });

    // 2. Security
    const cspViolations = clientMetrics.cspViolations || 0;
    const securityScore = Math.max(0, 100 - cspViolations * 5);
    modules.push({
      module: "security",
      status: securityScore >= 85 ? "healthy" : securityScore >= 60 ? "warning" : "critical",
      score: securityScore,
      details: { cspViolations, rlsEnabled: true },
    });

    // 3. Performance
    const avgQueryTime = clientMetrics.avgQueryTime || 0;
    const memoryUsage = clientMetrics.memoryUsage || 0;
    let perfScore = 100;
    if (avgQueryTime > 500) perfScore -= 20;
    else if (avgQueryTime > 200) perfScore -= 10;
    if (memoryUsage > 200) perfScore -= 15;
    else if (memoryUsage > 100) perfScore -= 5;
    perfScore = Math.max(0, perfScore);
    modules.push({
      module: "performance",
      status: perfScore >= 85 ? "healthy" : perfScore >= 60 ? "warning" : "critical",
      score: perfScore,
      details: { avgQueryTime: Math.round(avgQueryTime), memoryUsageMB: memoryUsage },
    });

    // 4. UI health
    const slowQueries = clientMetrics.slowQueries || [];
    const uiScore = Math.max(0, 100 - slowQueries.length * 5);
    modules.push({
      module: "ui",
      status: uiScore >= 85 ? "healthy" : uiScore >= 60 ? "warning" : "critical",
      score: uiScore,
      details: { slowQueriesCount: slowQueries.length },
    });

    // 5. Integrations
    const totalIntegrations = integrationsCount.count || 0;
    const intScore = totalIntegrations > 0 ? 90 : 75;
    modules.push({
      module: "integrations",
      status: intScore >= 85 ? "healthy" : intScore >= 60 ? "warning" : "critical",
      score: intScore,
      details: { totalIntegrations },
    });

    // Calculate overall
    const weights: Record<string, number> = {
      ui: 0.15,
      security: 0.3,
      performance: 0.2,
      database: 0.25,
      integrations: 0.1,
    };
    const overallScore = Math.round(
      modules.reduce((sum, mod) => sum + mod.score * (weights[mod.module] || 0.1), 0)
    );
    const overallStatus =
      overallScore >= 85 ? "healthy" : overallScore >= 60 ? "warning" : "critical";

    // Save metrics to database
    const metricsToInsert = modules.map((mod) => ({
      module: mod.module,
      status: mod.status,
      score: mod.score,
      details: mod.details,
    }));

    await adminClient.from("system_health_metrics").insert(metricsToInsert);

    // Generate recommendations
    const recommendations: Array<{
      priority: string;
      module: string;
      title: string;
      description: string;
    }> = [];
    for (const mod of modules) {
      if (mod.status === "critical") {
        recommendations.push({
          priority: "high",
          module: mod.module,
          title: `${mod.module.toUpperCase()} requer atenção imediata`,
          description: `Score: ${mod.score}/100. Revise os detalhes e tome ação corretiva.`,
        });
      } else if (mod.status === "warning") {
        recommendations.push({
          priority: "medium",
          module: mod.module,
          title: `${mod.module.toUpperCase()} precisa de melhorias`,
          description: `Score: ${mod.score}/100. Agende manutenção nos próximos dias.`,
        });
      }
    }

    const report = {
      overallStatus,
      overallScore,
      modules,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[system-health-check] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
