import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { requireAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

const BodySchema = z.object({
  videoId: z.string().uuid(),
  success: z.boolean(),
  duration: z.number().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  const auth = await requireAuth(req, traceId, corsHeaders);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, BodySchema, traceId);
  if (parsed instanceof Response) return parsed;
  const { videoId, success, duration } = parsed.data;

  try {
    const { supabase, user } = auth;
    const { data: video } = await supabase
      .from('bunny_videos').select('*')
      .eq('id', videoId).eq('user_id', user.id).maybeSingle();
    if (!video) return errorResponse('NOT_FOUND', 'Video not found', traceId, corsHeaders);

    if (!success) {
      await supabase.from('bunny_videos').update({
        status: 'failed', updated_at: new Date().toISOString(),
      }).eq('id', videoId);
      return okResponse({ status: 'failed' }, traceId, corsHeaders);
    }

    const { error: updateError } = await supabase
      .from('bunny_videos').update({
        status: 'ready', duration_seconds: duration || null,
        updated_at: new Date().toISOString(),
      }).eq('id', videoId);
    if (updateError) return errorResponse('INTERNAL_ERROR', 'Failed to update video status', traceId, corsHeaders);

    const { data: usage } = await supabase
      .from('video_usage').select('*').eq('user_id', user.id).maybeSingle();
    if (usage) {
      await supabase.from('video_usage').update({
        bunny_size_mb: (usage.bunny_size_mb || 0) + video.size_mb,
        bunny_video_count: (usage.bunny_video_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('video_usage').insert({
        user_id: user.id, bunny_size_mb: video.size_mb, bunny_video_count: 1,
        total_size_mb: 0, video_count: 0,
      });
    }

    return okResponse({ cdnUrl: video.cdn_url, status: 'ready' }, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[bunny-confirm-upload]', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});
