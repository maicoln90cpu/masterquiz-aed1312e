import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { requireAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

const BodySchema = z.object({
  fileName: z.string().min(1).max(500),
  fileSize: z.number().int().positive(),
  fileType: z.string().optional(),
  quizId: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  const storageZoneName = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
  const storageZonePassword = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');
  const cdnHostname = Deno.env.get('BUNNY_CDN_HOSTNAME');
  if (!storageZoneName || !storageZonePassword || !cdnHostname) {
    return errorResponse('INTERNAL_ERROR', 'Bunny CDN not configured', traceId, corsHeaders);
  }
  if (cdnHostname.includes('storage.bunnycdn')) {
    return errorResponse('INTERNAL_ERROR', 'Bunny CDN misconfigured', traceId, corsHeaders);
  }

  const auth = await requireAuth(req, traceId, corsHeaders);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, BodySchema, traceId);
  if (parsed instanceof Response) return parsed;
  const { fileName, fileSize, quizId } = parsed.data;

  try {
    const { supabase, user } = auth;
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (fileSize > maxSize) {
      return errorResponse('VALIDATION_FAILED', 'Arquivo muito grande. Máximo: 2GB', traceId, corsHeaders);
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions').select('plan_type').eq('user_id', user.id).maybeSingle();
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('video_storage_limit_mb, allow_video_upload')
      .eq('plan_type', subscription?.plan_type || 'free').maybeSingle();
    if (!plan?.allow_video_upload) {
      return errorResponse('FORBIDDEN', 'Video upload not allowed in your plan', traceId, corsHeaders);
    }

    const { data: usage } = await supabase
      .from('video_usage').select('bunny_size_mb').eq('user_id', user.id).maybeSingle();
    const currentUsageMb = usage?.bunny_size_mb || 0;
    const fileSizeMb = fileSize / (1024 * 1024);
    const limitMb = plan.video_storage_limit_mb || 100;
    if (currentUsageMb + fileSizeMb > limitMb) {
      return errorResponse(
        'FORBIDDEN',
        `Storage limit exceeded (${currentUsageMb.toFixed(1)}/${limitMb} MB, requires ${fileSizeMb.toFixed(1)} MB)`,
        traceId, corsHeaders,
      );
    }

    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop() || 'mp4';
    const uniqueFileName = `${user.id}/${timestamp}.${fileExt}`;
    const bunnyVideoId = `${user.id}_${timestamp}`;
    const cdnUrl = `https://${cdnHostname}/${uniqueFileName}`;

    const { data: videoRecord, error: insertError } = await supabase
      .from('bunny_videos').insert({
        user_id: user.id, quiz_id: quizId || null, bunny_video_id: bunnyVideoId,
        file_name: uniqueFileName, original_name: fileName, size_mb: fileSizeMb,
        status: 'uploading', cdn_url: cdnUrl,
      }).select().maybeSingle();
    if (insertError || !videoRecord) {
      return errorResponse('INTERNAL_ERROR', 'Failed to create video record', traceId, corsHeaders);
    }

    return okResponse({
      videoId: videoRecord.id, bunnyVideoId, cdnUrl,
      tusUploadUrl: `https://storage.bunnycdn.com/${storageZoneName}/${uniqueFileName}`,
      tusHeaders: { AccessKey: storageZonePassword },
      fileName: uniqueFileName,
    }, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[bunny-tus-create]', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});
