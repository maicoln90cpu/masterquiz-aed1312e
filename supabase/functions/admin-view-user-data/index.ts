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

    // Validate caller via getUser (correct for supabase-js v2)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;

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

    const body = await req.json();
    const { target_user_id, data_type, quiz_id, message, ticket_id } = body;

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

    // ── OVERVIEW ──
    if (data_type === "overview" || !data_type) {
      const [profileRes, subRes, quizzesRes, rolesRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", target_user_id).maybeSingle(),
        supabaseAdmin.from("user_subscriptions").select("*").eq("user_id", target_user_id).maybeSingle(),
        supabaseAdmin.from("quizzes")
          .select("id, title, slug, status, is_public, question_count, created_at, updated_at, creation_source")
          .eq("user_id", target_user_id).order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("role").eq("user_id", target_user_id),
      ]);

      const quizzes = quizzesRes.data || [];
      const responseCounts: Record<string, number> = {};
      for (const q of quizzes) {
        const { count } = await supabaseAdmin
          .from("quiz_responses").select("*", { count: "exact", head: true }).eq("quiz_id", q.id);
        responseCounts[q.id] = count || 0;
      }

      result = {
        profile: profileRes.data,
        subscription: subRes.data,
        roles: (rolesRes.data || []).map((r: any) => r.role),
        quizzes: quizzes.map((q: any) => ({ ...q, response_count: responseCounts[q.id] || 0 })),
      };

    // ── DIAGNOSTICS ──
    } else if (data_type === "diagnostics") {
      const { data: quizzes } = await supabaseAdmin
        .from("quizzes").select("id, title, slug, status").eq("user_id", target_user_id);

      const diagnostics: any[] = [];
      for (const quiz of quizzes || []) {
        const issues: string[] = [];
        const { data: questions } = await supabaseAdmin
          .from("quiz_questions").select("id, question_text, blocks, order_number")
          .eq("quiz_id", quiz.id).order("order_number");

        const questionCount = questions?.length || 0;
        const orderNums = questions?.map((q: any) => q.order_number) || [];
        if (new Set(orderNums).size !== orderNums.length) {
          issues.push("Perguntas com order_number duplicado");
        }

        const noBlocks = questions?.filter((q: any) => !q.blocks || (Array.isArray(q.blocks) && q.blocks.length === 0));
        if (noBlocks && noBlocks.length > 0) {
          issues.push(`${noBlocks.length} pergunta(s) sem blocos configurados`);
        }

        const { data: results } = await supabaseAdmin
          .from("quiz_results").select("id, result_text, min_score, max_score").eq("quiz_id", quiz.id);
        const resultCount = results?.length || 0;
        if (resultCount === 0 && quiz.status === "active") {
          issues.push("Quiz publicado sem resultados configurados");
        }

        const { data: formConfig } = await supabaseAdmin
          .from("quiz_form_config").select("*").eq("quiz_id", quiz.id).maybeSingle();

        if (!quiz.slug) {
          issues.push("Quiz sem slug definido");
        } else {
          const { count: slugCount } = await supabaseAdmin
            .from("quizzes").select("*", { count: "exact", head: true }).eq("slug", quiz.slug);
          if ((slugCount || 0) > 1) issues.push("Slug duplicado com outro quiz");
        }

        const { count: responseCount } = await supabaseAdmin
          .from("quiz_responses").select("*", { count: "exact", head: true }).eq("quiz_id", quiz.id);

        diagnostics.push({
          quiz_id: quiz.id, title: quiz.title, slug: quiz.slug, status: quiz.status,
          question_count: questionCount, result_count: resultCount,
          response_count: responseCount || 0, has_form_config: !!formConfig,
          issues, health: issues.length === 0 ? "healthy" : "warning",
        });
      }
      result = { diagnostics };

    // ── QUIZ DETAIL ──
    } else if (data_type === "quiz_detail") {
      if (!quiz_id) {
        return new Response(JSON.stringify({ error: "quiz_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const [quizRes, questionsRes, resultsRes, formConfigRes] = await Promise.all([
        supabaseAdmin.from("quizzes").select("*").eq("id", quiz_id).maybeSingle(),
        supabaseAdmin.from("quiz_questions").select("*").eq("quiz_id", quiz_id).order("order_number"),
        supabaseAdmin.from("quiz_results").select("*").eq("quiz_id", quiz_id).order("order_number"),
        supabaseAdmin.from("quiz_form_config").select("*").eq("quiz_id", quiz_id).maybeSingle(),
      ]);
      result = {
        quiz: quizRes.data,
        questions: questionsRes.data || [],
        results: resultsRes.data || [],
        formConfig: formConfigRes.data,
      };

    // ── FIX DUPLICATE ORDER NUMBERS ──
    } else if (data_type === "fix_duplicates") {
      if (!quiz_id) {
        return new Response(JSON.stringify({ error: "quiz_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: questions } = await supabaseAdmin
        .from("quiz_questions").select("id, order_number").eq("quiz_id", quiz_id).order("order_number");

      if (questions && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          if (questions[i].order_number !== i) {
            await supabaseAdmin.from("quiz_questions").update({ order_number: i }).eq("id", questions[i].id);
          }
        }
      }

      // Update question_count
      await supabaseAdmin.from("quizzes").update({ question_count: questions?.length || 0 }).eq("id", quiz_id);

      // Log action
      await supabaseAdmin.from("audit_logs").insert({
        user_id: callerId, action: "admin:settings_updated",
        resource_type: "support_fix_duplicates", resource_id: quiz_id,
        metadata: { target_user_id, questions_reordered: questions?.length || 0 },
      });

      result = { success: true, questions_reordered: questions?.length || 0 };

    // ── REPUBLISH QUIZ ──
    } else if (data_type === "republish") {
      if (!quiz_id) {
        return new Response(JSON.stringify({ error: "quiz_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: updateError } = await supabaseAdmin
        .from("quizzes").update({ status: "active", is_public: true }).eq("id", quiz_id);

      if (updateError) throw updateError;

      await supabaseAdmin.from("audit_logs").insert({
        user_id: callerId, action: "admin:settings_updated",
        resource_type: "support_republish", resource_id: quiz_id,
        metadata: { target_user_id },
      });

      result = { success: true };

    // ── TICKETS ──
    } else if (data_type === "tickets") {
      const { data: tickets } = await supabaseAdmin
        .from("support_tickets").select("*").eq("user_id", target_user_id)
        .order("created_at", { ascending: false });

      const ticketIds = (tickets || []).map((t: any) => t.id);
      let messages: any[] = [];
      if (ticketIds.length > 0) {
        const { data: msgs } = await supabaseAdmin
          .from("ticket_messages").select("*").in("ticket_id", ticketIds)
          .order("created_at", { ascending: true });
        messages = msgs || [];
      }

      result = { tickets: tickets || [], messages };

    // ── SEND TICKET MESSAGE ──
    } else if (data_type === "send_message") {
      if (!ticket_id || !message) {
        return new Response(JSON.stringify({ error: "ticket_id and message required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: msg, error: msgError } = await supabaseAdmin
        .from("ticket_messages").insert({
          ticket_id, sender_id: callerId, message, is_internal_note: false,
        }).select().single();

      if (msgError) throw msgError;

      // Mark ticket as having unread admin messages
      await supabaseAdmin.from("support_tickets")
        .update({ has_unread_admin: false, updated_at: new Date().toISOString() })
        .eq("id", ticket_id);

      await supabaseAdmin.from("audit_logs").insert({
        user_id: callerId, action: "admin:settings_updated",
        resource_type: "support_send_message", resource_id: ticket_id,
        metadata: { target_user_id },
      });

      result = { success: true, message: msg };

    // ── SESSION HISTORY ──
    } else if (data_type === "session_history") {
      // Fetch support:enter and support:exit pairs from audit_logs for this admin
      const { data: enterLogs } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .eq("action", "support:enter")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: exitLogs } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .eq("action", "support:exit")
        .order("created_at", { ascending: false })
        .limit(50);

      const sessions: any[] = [];
      for (const entry of enterLogs || []) {
        const meta = entry.metadata as any;
        const targetEmail = meta?.target_email || 'desconhecido';
        const targetName = meta?.target_name || targetEmail;

        // Find matching exit log (same user_id, resource_id, created after enter)
        const exitLog = (exitLogs || []).find((ex: any) => {
          return ex.user_id === entry.user_id &&
                 ex.resource_id === entry.resource_id &&
                 ex.created_at > entry.created_at;
        });

        const exitMeta = exitLog?.metadata as any;
        const durationSeconds = exitMeta?.duration_seconds || null;
        const actionsCount = exitMeta?.actions_count || 0;
        const actionsSummary = exitMeta?.actions_summary || [];

        sessions.push({
          id: entry.id,
          admin_id: entry.user_id,
          target_user_id: entry.resource_id,
          target_email: targetEmail,
          target_name: targetName,
          started_at: entry.created_at,
          ended_at: exitLog?.created_at || null,
          duration_seconds: durationSeconds,
          actions_count: actionsCount,
          actions_summary: actionsSummary,
        });
      }

      result = { sessions };

    } else {
      return new Response(JSON.stringify({ error: `Unknown data_type: ${data_type}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
