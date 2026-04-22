import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { requireAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

const BodySchema = z.object({ videoId: z.string().uuid() });

function generateThumbnailUrl(cdnUrl: string, cdnHostname: string): string {
  const urlParts = cdnUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  return `https://${cdnHostname}/${urlParts[urlParts.length - 2]}/${fileNameWithoutExt}_thumb.jpg`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  const cdnHostname = Deno.env.get('BUNNY_CDN_HOSTNAME');
  if (!cdnHostname) {
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
    if (!video.cdn_url) return errorResponse('VALIDATION_FAILED', 'Video has no CDN URL', traceId, corsHeaders);

    const thumbnailUrl = generateThumbnailUrl(video.cdn_url, cdnHostname);

    const { error: updateError } = await supabase
      .from('bunny_videos').update({
        thumbnail_url: thumbnailUrl, updated_at: new Date().toISOString(),
      }).eq('id', videoId);
    if (updateError) return errorResponse('INTERNAL_ERROR', 'Failed to update thumbnail URL', traceId, corsHeaders);

    return okResponse({ videoId, thumbnailUrl }, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[bunny-generate-thumbnail]', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});
