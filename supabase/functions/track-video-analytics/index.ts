import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALID_EVENTS = ['play','pause','seek','ended','progress_25','progress_50','progress_75','quality_change','speed_change','error'] as const;

const BodySchema = z.object({
  quiz_id: z.string().uuid().optional().nullable(),
  video_id: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  session_id: z.string().min(1),
  event_type: z.enum(VALID_EVENTS),
  event_data: z.record(z.unknown()).optional(),
  watch_time_seconds: z.number().optional(),
  percentage_watched: z.number().optional(),
  user_id: z.string().uuid().optional().nullable(),
});

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId);
  if (!record || now > record.resetTime) { rateLimitMap.set(sessionId, { count: 1, resetTime: now + 60000 }); return true; }
  if (record.count >= 100) return false;
  record.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);

  if (req.method !== 'POST') return errorResponse('VALIDATION_FAILED', 'Method not allowed', traceId, corsHeaders, 405);

  try {
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { quiz_id, video_id, video_url, session_id, event_type, event_data, watch_time_seconds, percentage_watched, user_id } = parsed.data;

    if (!checkRateLimit(session_id)) return errorResponse('RATE_LIMITED', 'Rate limit exceeded', traceId, corsHeaders);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let ownerUserId: string | null | undefined = user_id;
    if (quiz_id && !ownerUserId) {
      const { data: quiz } = await supabase.from('quizzes').select('user_id').eq('id', quiz_id).maybeSingle();
      if (quiz) ownerUserId = quiz.user_id;
    }

    const { error } = await supabase.from('video_analytics').insert({
      quiz_id, video_id, video_url, session_id, event_type, event_data: event_data || {},
      watch_time_seconds: watch_time_seconds || 0, percentage_watched: percentage_watched || 0, user_id: ownerUserId,
    });

    if (error) { console.error('Insert error:', error); return errorResponse('INTERNAL_ERROR', 'Failed to track', traceId, corsHeaders); }

    return okResponse({ success: true }, traceId, corsHeaders);
  } catch (error) {
    console.error('track-video-analytics error:', error);
    return errorResponse('INTERNAL_ERROR', 'Internal server error', traceId, corsHeaders);
  }
});
