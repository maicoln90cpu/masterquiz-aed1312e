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

    // Validate caller
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

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "master_admin"]);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all responses with quiz title (paginate to avoid 1000 limit)
    let allResponses: any[] = [];
    let offset = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await adminClient
        .from("quiz_responses")
        .select("respondent_name, respondent_email, respondent_whatsapp, completed_at, answers, quizzes(title, user_id)")
        .range(offset, offset + pageSize - 1)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allResponses = allResponses.concat(data);
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    // Aggregate by unique respondent
    const userMap = new Map<string, any>();
    
    for (const resp of allResponses) {
      const key = resp.respondent_email || resp.respondent_whatsapp || resp.respondent_name;
      if (!key) continue;

      const answers = resp.answers as Record<string, any> | null;
      const isTestLead = answers && typeof answers === "object" && answers._is_test_lead === true;
      const quizTitle = (resp.quizzes as any)?.title || "—";
      const ownerUserId = (resp.quizzes as any)?.user_id || null;

      if (!userMap.has(key)) {
        userMap.set(key, {
          name: resp.respondent_name,
          email: resp.respondent_email,
          whatsapp: resp.respondent_whatsapp,
          responseCount: 0,
          lastResponse: resp.completed_at,
          lastQuizTitle: quizTitle,
          ownerUserId,
          isTestLead: isTestLead || false,
        });
      }

      const u = userMap.get(key)!;
      u.responseCount++;
      if (new Date(resp.completed_at) > new Date(u.lastResponse)) {
        u.lastResponse = resp.completed_at;
        u.lastQuizTitle = quizTitle;
      }
      // If ANY response is a test lead, mark it
      if (isTestLead) u.isTestLead = true;
    }

    const respondents = Array.from(userMap.values());

    return new Response(JSON.stringify({ respondents }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[list-all-respondents] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
