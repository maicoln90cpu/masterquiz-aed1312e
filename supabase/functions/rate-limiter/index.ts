import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

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

const BodySchema = z.object({
  identifier: z.string().min(1).max(255),
  action: z.string().min(1).max(64),
  userId: z.string().uuid().optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { identifier, action, userId } = parsed.data;

    const actualIdentifier = userId || identifier;
    const limit = RATE_LIMITS[action] || RATE_LIMITS['api:general'];
    const windowStart = new Date(Date.now() - limit.windowMinutes * 60 * 1000);

    const { data: existing } = await supabaseAdmin.from('rate_limit_tracker').select('*')
      .eq('identifier', actualIdentifier).eq('action', action).gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false }).limit(1).maybeSingle();

    const record = existing as { id: string; attempt_count: number; window_start: string } | null;

    if (!record || new Date(record.window_start) < windowStart) {
      await supabaseAdmin.from('rate_limit_tracker').insert({ identifier: actualIdentifier, action, attempt_count: 1, window_start: new Date().toISOString() });
      return okResponse({ allowed: true, remainingAttempts: limit.maxAttempts - 1 }, traceId, corsHeaders);
    }

    const newCount = record.attempt_count + 1;
    const allowed = newCount <= limit.maxAttempts;
    const resetAt = new Date(new Date(record.window_start).getTime() + limit.windowMinutes * 60 * 1000);

    if (allowed) {
      await supabaseAdmin.from('rate_limit_tracker').update({ attempt_count: newCount, updated_at: new Date().toISOString() }).eq('id', record.id);
    }

    if (!allowed) {
      return errorResponse('RATE_LIMITED', `Rate limit exceeded; reset at ${resetAt.toISOString()}`, traceId, corsHeaders);
    }

    return okResponse({ allowed: true, remainingAttempts: limit.maxAttempts - newCount }, traceId, corsHeaders);
  } catch (error) {
    console.error('[RATE-LIMITER] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', traceId, corsHeaders);
  }
});
