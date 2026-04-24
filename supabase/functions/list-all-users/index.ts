import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-trace-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper: fetch rows in batches to avoid PostgREST URL length limits
async function fetchInBatches<T>(
  client: any,
  table: string,
  selectColumns: string,
  filterColumn: string,
  ids: string[],
  batchSize = 100
): Promise<T[]> {
  const allRows: T[] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { data, error } = await client
      .from(table)
      .select(selectColumns)
      .in(filterColumn, batch);
    if (error) {
      console.error(`[list-all-users] Error fetching ${table} batch ${i}:`, error.message);
      continue;
    }
    if (data) allRows.push(...data);
  }
  return allRows;
}

Deno.serve(async (req) => {
  const traceId = getTraceId(req);
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: { ...corsHeaders, 'x-trace-id': traceId } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse('UNAUTHORIZED', 'Authorization header ausente', traceId, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    const userId = user.id;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "master_admin"]);

    if (!roleData || roleData.length === 0) {
      return errorResponse('FORBIDDEN', 'Requer permissão de admin', traceId, corsHeaders);
    }

    // List all auth users
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (authError) {
      return errorResponse('INTERNAL_ERROR', authError.message, traceId, corsHeaders);
    }

    const authUsers = authData?.users || [];
    const userIds = authUsers.map((u) => u.id);

    // Fetch profiles, subscriptions, roles, quizzes, and audit logs in BATCHES
    const [profiles, subs, roles, quizzes, auditDeleted] = await Promise.all([
      fetchInBatches<any>(adminClient, "profiles", "*", "id", userIds),
      fetchInBatches<any>(adminClient, "user_subscriptions", "*", "user_id", userIds),
      fetchInBatches<any>(adminClient, "user_roles", "*", "user_id", userIds),
      fetchInBatches<any>(adminClient, "quizzes", "id, user_id, is_public, status, creation_source", "user_id", userIds),
      fetchInBatches<any>(adminClient, "audit_logs", "user_id, resource_id", "user_id", userIds),
    ]);

    // Filter audit_logs for quiz:deleted action separately (batched)
    const auditDeletedFiltered: any[] = [];
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const { data } = await adminClient
        .from("audit_logs")
        .select("user_id, resource_id")
        .eq("action", "quiz:deleted")
        .in("user_id", batch);
      if (data) auditDeletedFiltered.push(...data);
    }

    // 🔧 CORREÇÃO: "Último Login" baseado em login_events (cada login real é
    // gravado via RPC record_login_event no AuthContext). O campo
    // auth.users.last_sign_in_at só atualiza no primeiro signInWithPassword da
    // sessão — enquanto o refresh_token estiver válido, retornos do usuário NÃO
    // contam como novo sign-in, fazendo todo "último login" parecer próximo do
    // cadastro. login_events é a fonte correta para essa coluna.
    const lastLoginMap = new Map<string, string>();
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const { data: loginRows } = await adminClient
        .from("login_events")
        .select("user_id, logged_in_at")
        .in("user_id", batch)
        .order("logged_in_at", { ascending: false });
      for (const row of loginRows || []) {
        // Como vem ordenado desc, a primeira ocorrência por user_id já é o último
        if (!lastLoginMap.has(row.user_id)) {
          lastLoginMap.set(row.user_id, row.logged_in_at);
        }
      }
    }

    const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));
    const subsMap = new Map(subs.map((s: any) => [s.user_id, s]));
    const rolesMap = new Map<string, string[]>();
    for (const r of roles) {
      if (!rolesMap.has(r.user_id)) rolesMap.set(r.user_id, []);
      rolesMap.get(r.user_id)!.push(r.role);
    }

    // Build quiz maps
    const quizCountMap = new Map<string, number>();
    const publishedCountMap = new Map<string, number>();
    const expressQuizCountMap = new Map<string, number>();
    const manualQuizCountMap = new Map<string, number>();
    const quizIdToOwner = new Map<string, string>();
    const allQuizIds: string[] = [];

    for (const q of quizzes) {
      quizCountMap.set(q.user_id, (quizCountMap.get(q.user_id) || 0) + 1);
      if (q.is_public && q.status === "active") {
        publishedCountMap.set(q.user_id, (publishedCountMap.get(q.user_id) || 0) + 1);
      }
      if (q.creation_source === 'express_auto') {
        expressQuizCountMap.set(q.user_id, (expressQuizCountMap.get(q.user_id) || 0) + 1);
      } else {
        manualQuizCountMap.set(q.user_id, (manualQuizCountMap.get(q.user_id) || 0) + 1);
      }
      quizIdToOwner.set(q.id, q.user_id);
      allQuizIds.push(q.id);
    }

    // Fetch responses using quiz IDs in batches
    const leadCountMap = new Map<string, number>();
    const quizzesWithLeadsMap = new Map<string, Set<string>>();

    if (allQuizIds.length > 0) {
      const batchSize = 200;
      for (let i = 0; i < allQuizIds.length; i += batchSize) {
        const batch = allQuizIds.slice(i, i + batchSize);
        const { data: responses } = await adminClient
          .from("quiz_responses")
          .select("quiz_id, answers")
          .in("quiz_id", batch);

        for (const r of responses || []) {
          const ownerUserId = quizIdToOwner.get(r.quiz_id);
          if (!ownerUserId) continue;

          const answers = r.answers as any;
          const isTestLead = answers && typeof answers === 'object' && answers._is_test_lead === true;
          if (isTestLead) continue;

          leadCountMap.set(ownerUserId, (leadCountMap.get(ownerUserId) || 0) + 1);

          if (!quizzesWithLeadsMap.has(ownerUserId)) {
            quizzesWithLeadsMap.set(ownerUserId, new Set());
          }
          quizzesWithLeadsMap.get(ownerUserId)!.add(r.quiz_id);
        }
      }
    }

    // Build deleted quiz count map
    const deletedQuizCountMap = new Map<string, number>();
    for (const a of auditDeletedFiltered) {
      if (a.user_id) {
        deletedQuizCountMap.set(a.user_id, (deletedQuizCountMap.get(a.user_id) || 0) + 1);
      }
    }

    const users = authUsers.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      // Fallback para auth.last_sign_in_at quando não há registro em login_events
      // (usuários antigos que nunca passaram pelo record_login_event).
      last_sign_in_at: lastLoginMap.get(u.id) || u.last_sign_in_at,
      profile: profilesMap.get(u.id) || null,
      subscription: subsMap.get(u.id) || null,
      roles: rolesMap.get(u.id) || [],
      stats: {
        quiz_count: quizCountMap.get(u.id) || 0,
        quiz_count_historical: (quizCountMap.get(u.id) || 0) + (deletedQuizCountMap.get(u.id) || 0),
        published_count: publishedCountMap.get(u.id) || 0,
        quizzes_with_leads: quizzesWithLeadsMap.get(u.id)?.size || 0,
        lead_count: leadCountMap.get(u.id) || 0,
        express_quiz_count: expressQuizCountMap.get(u.id) || 0,
        manual_quiz_count: manualQuizCountMap.get(u.id) || 0,
      },
    }));

    return okResponse({ users }, traceId, corsHeaders);
  } catch (error) {
    console.error("[list-all-users] Error:", error);
    return errorResponse('INTERNAL_ERROR', (error as Error).message || 'Erro interno', traceId, corsHeaders);
  }
});
