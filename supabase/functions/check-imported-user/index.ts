import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  email: z.string().email().max(255),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = getTraceId(req);
  try {
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { email } = parsed.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if profile exists with this email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .limit(1);

    if (error) {
      console.error('[CHECK-IMPORTED] Error:', error.message);
      return okResponse({ exists: false }, traceId, corsHeaders);
    }

    if (!profiles || profiles.length === 0) {
      return okResponse({ exists: false }, traceId, corsHeaders);
    }

    // Check if this profile has a corresponding auth.users entry
    const profileId = profiles[0].id;
    const { data: authUser } = await supabase.auth.admin.getUserById(profileId);

    // If auth user exists, it's not an orphan — normal login should work
    if (authUser?.user) {
      return okResponse({ exists: false }, traceId, corsHeaders);
    }

    // Orphan profile found — user needs to migrate
    return okResponse({ exists: true }, traceId, corsHeaders);

  } catch (err) {
    console.error('[CHECK-IMPORTED] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Erro interno', traceId, corsHeaders);
  }
});
