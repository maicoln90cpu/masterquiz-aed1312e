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

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
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

    // List all auth users (paginated, up to 1000)
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      throw authError;
    }

    const authUsers = authData?.users || [];
    const userIds = authUsers.map((u) => u.id);

    // Fetch profiles, subscriptions, roles, and stats in parallel (direct queries instead of RPC)
    const [profilesRes, subsRes, rolesRes, quizCountRes, leadCountRes] = await Promise.all([
      adminClient.from("profiles").select("*").in("id", userIds),
      adminClient.from("user_subscriptions").select("*").in("user_id", userIds),
      adminClient.from("user_roles").select("*").in("user_id", userIds),
      adminClient.from("quizzes").select("user_id, id").in("user_id", userIds),
      adminClient.from("quiz_responses").select("quiz_id, id, quizzes!inner(user_id)").in("quizzes.user_id", userIds),
    ]);

    const profilesMap = new Map(
      (profilesRes.data || []).map((p) => [p.id, p])
    );
    const subsMap = new Map(
      (subsRes.data || []).map((s) => [s.user_id, s])
    );
    const rolesMap = new Map<string, string[]>();
    for (const r of rolesRes.data || []) {
      if (!rolesMap.has(r.user_id)) rolesMap.set(r.user_id, []);
      rolesMap.get(r.user_id)!.push(r.role);
    }

    // Build quiz count map
    const quizCountMap = new Map<string, number>();
    for (const q of quizCountRes.data || []) {
      quizCountMap.set(q.user_id, (quizCountMap.get(q.user_id) || 0) + 1);
    }

    // Build lead count map
    const leadCountMap = new Map<string, number>();
    for (const r of leadCountRes.data || []) {
      const ownerUserId = (r as any).quizzes?.user_id;
      if (ownerUserId) {
        leadCountMap.set(ownerUserId, (leadCountMap.get(ownerUserId) || 0) + 1);
      }
    }

    const users = authUsers.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      profile: profilesMap.get(u.id) || null,
      subscription: subsMap.get(u.id) || null,
      roles: rolesMap.get(u.id) || [],
      stats: {
        quiz_count: quizCountMap.get(u.id) || 0,
        lead_count: leadCountMap.get(u.id) || 0,
      },
    }));

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[list-all-users] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
