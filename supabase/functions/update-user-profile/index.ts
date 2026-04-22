import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email().max(255).optional(),
  whatsapp: z.string().max(32).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = getTraceId(req);
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse('UNAUTHORIZED', 'Authorization header ausente', traceId, corsHeaders);
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
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "master_admin"]);

    if (!roleData || roleData.length === 0) {
      return errorResponse('FORBIDDEN', 'Requer permissão de admin', traceId, corsHeaders);
    }

    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { user_id, email, whatsapp } = parsed.data;

    // Update profile
    const profileUpdates: Record<string, string> = {};
    if (email !== undefined) profileUpdates.email = email;
    if (whatsapp !== undefined) profileUpdates.whatsapp = whatsapp;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update(profileUpdates)
        .eq("id", user_id);

      if (profileError) {
        console.error("[update-user-profile] Profile error:", profileError);
        return errorResponse('INTERNAL_ERROR', profileError.message, traceId, corsHeaders);
      }
    }

    // Update auth email if changed
    if (email !== undefined) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, {
        email,
      });
      if (authError) {
        console.error("[update-user-profile] Auth email error:", authError);
        // Don't throw - profile was already updated
      }
    }

    return okResponse({ updated: true }, traceId, corsHeaders);
  } catch (error) {
    console.error("[update-user-profile] Error:", error);
    return errorResponse('INTERNAL_ERROR', (error as Error).message || 'Erro interno', traceId, corsHeaders);
  }
});
