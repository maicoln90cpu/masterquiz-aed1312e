import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { requireAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

const BodySchema = z.object({ videoId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  const bunnyApiKey = Deno.env.get('BUNNY_API_KEY');
  const storageZoneName = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
  const storageZonePassword = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');
  if (!bunnyApiKey || !storageZoneName || !storageZonePassword) {
    return errorResponse('INTERNAL_ERROR', 'Bunny CDN not configured', traceId, corsHeaders);
  }

  const auth = await requireAuth(req, traceId, corsHeaders);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, BodySchema, traceId);
  if (parsed instanceof Response) return parsed;
  const { videoId } = parsed.data;

  try {
    const { supabase, user } = auth;
    const { data: video } = await supabase
      .from('bunny_videos').select('*')
      .eq('id', videoId).eq('user_id', user.id).maybeSingle();
    if (!video) return errorResponse('NOT_FOUND', 'Video not found', traceId, corsHeaders);

    const deleteUrl = `https://storage.bunnycdn.com/${storageZoneName}/${video.file_name}`;
    try {
      const bunnyResponse = await fetch(deleteUrl, {
        method: 'DELETE', headers: { AccessKey: storageZonePassword },
      });
      if (!bunnyResponse.ok && bunnyResponse.status !== 404) {
        console.error('[bunny-delete-video] Bunny API error:', await bunnyResponse.text());
      }
    } catch (bunnyError) {
      console.error('[bunny-delete-video] Bunny fetch error:', bunnyError);
    }

    await supabase.from('bunny_videos').update({
      status: 'deleted', updated_at: new Date().toISOString(),
    }).eq('id', videoId);

    const { data: usage } = await supabase
      .from('video_usage').select('*').eq('user_id', user.id).maybeSingle();
    if (usage && video.status === 'ready') {
      await supabase.from('video_usage').update({
        bunny_size_mb: Math.max(0, (usage.bunny_size_mb || 0) - video.size_mb),
        bunny_video_count: Math.max(0, (usage.bunny_video_count || 0) - 1),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    }

    return okResponse({ deleted: true }, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[bunny-delete-video]', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});
