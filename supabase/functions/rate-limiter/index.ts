import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

interface RateLimit { action: string; maxAttempts: number; windowMinutes: number; }

const RATE_LIMITS: Record<string, RateLimit> = {
  'auth:login': { action: 'auth:login', maxAttempts: 5, windowMinutes: 5 },
  'auth:register': { action: 'auth:register', maxAttempts: 3, windowMinutes: 60 },
  'quiz:create': { action: 'quiz:create', maxAttempts: 10, windowMinutes: 60 },
  'quiz:submit': { action: 'quiz:submit', maxAttempts: 20, windowMinutes: 60 },
  'api:general': { action: 'api:general', maxAttempts: 100, windowMinutes: 60 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { identifier, action, userId } = await req.json();
    if (!identifier || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const actualIdentifier = userId || identifier;
    const limit = RATE_LIMITS[action] || RATE_LIMITS['api:general'];
    const windowStart = new Date(Date.now() - limit.windowMinutes * 60 * 1000);

    const { data: existing } = await supabaseAdmin.from('rate_limit_tracker').select('*')
      .eq('identifier', actualIdentifier).eq('action', action).gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false }).limit(1).maybeSingle();

    const record = existing as { id: string; attempt_count: number; window_start: string } | null;

    if (!record || new Date(record.window_start) < windowStart) {
      await supabaseAdmin.from('rate_limit_tracker').insert({ identifier: actualIdentifier, action, attempt_count: 1, window_start: new Date().toISOString() });
      return new Response(JSON.stringify({ allowed: true, remainingAttempts: limit.maxAttempts - 1 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const newCount = record.attempt_count + 1;
    const allowed = newCount <= limit.maxAttempts;
    const resetAt = new Date(new Date(record.window_start).getTime() + limit.windowMinutes * 60 * 1000);

    if (allowed) {
      await supabaseAdmin.from('rate_limit_tracker').update({ attempt_count: newCount, updated_at: new Date().toISOString() }).eq('id', record.id);
    }

    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded', resetAt: resetAt.toISOString() }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ allowed: true, remainingAttempts: limit.maxAttempts - newCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[RATE-LIMITER] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
