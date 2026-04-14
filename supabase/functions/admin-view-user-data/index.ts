import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate caller is master_admin
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } =
      await supabaseUser.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    // Check master_admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "master_admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: master_admin required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { target_user_id, data_type } = await req.json();

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: "target_user_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: any = {};

    if (data_type === "overview" || !data_type) {
      // Fetch everything for the support dashboard
      const [profileRes, subRes, quizzesRes, rolesRes] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", target_user_id)
          .maybeSingle(),
        supabaseAdmin
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", target_user_id)
          .maybeSingle(),
        supabaseAdmin
          .from("quizzes")
          .select(
            "id, title, slug, status, is_public, question_count, created_at, updated_at, creation_source"
          )
          .eq("user_id", target_user_id)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", target_user_id),
      ]);

      // For each quiz, get response count
      const quizzes = quizzesRes.data || [];
      const quizIds = quizzes.map((q: any) => q.id);

      let responseCounts: Record<string, number> = {};
      if (quizIds.length > 0) {
        // Batch in groups of 50
        for (let i = 0; i < quizIds.length; i += 50) {
          const batch = quizIds.slice(i, i + 50);
          const { data: responses } = await supabaseAdmin
            .from("quiz_responses")
            .select("quiz_id", { count: "exact" })
            .in("quiz_id", batch);

          if (responses) {
            responses.forEach((r: any) => {
              responseCounts[r.quiz_id] =
                (responseCounts[r.quiz_id] || 0) + 1;
            });
          }
        }

        // More accurate: count per quiz
        for (const qid of quizIds) {
          const { count } = await supabaseAdmin
            .from("quiz_responses")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", qid);
          responseCounts[qid] = count || 0;
        }
      }

      result = {
        profile: profileRes.data,
        subscription: subRes.data,
        roles: (rolesRes.data || []).map((r: any) => r.role),
        quizzes: quizzes.map((q: any) => ({
          ...q,
          response_count: responseCounts[q.id] || 0,
        })),
      };
    } else if (data_type === "quiz_detail") {
      const { quiz_id } = await req.json().catch(() => ({}));
      if (!quiz_id) {
        return new Response(
          JSON.stringify({ error: "quiz_id required for quiz_detail" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const [quizRes, questionsRes, resultsRes, formConfigRes] =
        await Promise.all([
          supabaseAdmin
            .from("quizzes")
            .select("*")
            .eq("id", quiz_id)
            .maybeSingle(),
          supabaseAdmin
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("order_number"),
          supabaseAdmin
            .from("quiz_results")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("order_number"),
          supabaseAdmin
            .from("quiz_form_config")
            .select("*")
            .eq("quiz_id", quiz_id)
            .maybeSingle(),
        ]);

      result = {
        quiz: quizRes.data,
        questions: questionsRes.data || [],
        results: resultsRes.data || [],
        formConfig: formConfigRes.data,
      };
    } else if (data_type === "diagnostics") {
      // Run diagnostics on all quizzes
      const { data: quizzes } = await supabaseAdmin
        .from("quizzes")
        .select("id, title, slug, status")
        .eq("user_id", target_user_id);

      const diagnostics: any[] = [];

      for (const quiz of quizzes || []) {
        const issues: string[] = [];

        // Check questions
        const { data: questions } = await supabaseAdmin
          .from("quiz_questions")
          .select("id, question_text, blocks, order_number")
          .eq("quiz_id", quiz.id)
          .order("order_number");

        const questionCount = questions?.length || 0;

        // Check for duplicate order numbers
        const orderNums = questions?.map((q: any) => q.order_number) || [];
        const uniqueOrders = new Set(orderNums);
        if (uniqueOrders.size !== orderNums.length) {
          issues.push("Perguntas com order_number duplicado");
        }

        // Check for questions without blocks
        const noBlocks = questions?.filter(
          (q: any) => !q.blocks || (Array.isArray(q.blocks) && q.blocks.length === 0)
        );
        if (noBlocks && noBlocks.length > 0) {
          issues.push(`${noBlocks.length} pergunta(s) sem blocos configurados`);
        }

        // Check for duplicate question IDs
        const qIds = questions?.map((q: any) => q.id) || [];
        const uniqueQIds = new Set(qIds);
        if (uniqueQIds.size !== qIds.length) {
          issues.push("IDs de perguntas duplicados");
        }

        // Check results
        const { data: results } = await supabaseAdmin
          .from("quiz_results")
          .select("id, result_text, min_score, max_score")
          .eq("quiz_id", quiz.id);

        const resultCount = results?.length || 0;
        if (resultCount === 0 && quiz.status === "active") {
          issues.push("Quiz publicado sem resultados configurados");
        }

        // Check form config
        const { data: formConfig } = await supabaseAdmin
          .from("quiz_form_config")
          .select("*")
          .eq("quiz_id", quiz.id)
          .maybeSingle();

        // Check slug
        if (!quiz.slug) {
          issues.push("Quiz sem slug definido");
        } else {
          const { count: slugCount } = await supabaseAdmin
            .from("quizzes")
            .select("*", { count: "exact", head: true })
            .eq("slug", quiz.slug);
          if ((slugCount || 0) > 1) {
            issues.push("Slug duplicado com outro quiz");
          }
        }

        // Response count
        const { count: responseCount } = await supabaseAdmin
          .from("quiz_responses")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", quiz.id);

        diagnostics.push({
          quiz_id: quiz.id,
          title: quiz.title,
          slug: quiz.slug,
          status: quiz.status,
          question_count: questionCount,
          result_count: resultCount,
          response_count: responseCount || 0,
          has_form_config: !!formConfig,
          issues,
          health: issues.length === 0 ? "healthy" : "warning",
        });
      }

      result = { diagnostics };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("admin-view-user-data error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
