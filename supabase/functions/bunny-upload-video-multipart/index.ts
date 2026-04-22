import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { requireAuth } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

async function verifyFileOnCDN(cdnUrl: string, maxRetries = 3, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(cdnUrl, { method: 'HEAD' });
      if (response.ok) return true;
    } catch { /* ignore */ }
    if (i < maxRetries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  return false;
}

async function uploadWithRetry(
  uploadUrl: string, storageZonePassword: string, fileBuffer: ArrayBuffer,
  contentType: string, maxRetries = 2,
): Promise<{ ok: boolean; status: number; text: string }> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { AccessKey: storageZonePassword, 'Content-Type': contentType },
        body: fileBuffer,
      });
      const text = await response.text();
      if (response.ok) return { ok: true, status: response.status, text };
      if (response.status === 401 || response.status === 403) return { ok: false, status: response.status, text };
    } catch (e) {
      console.log(`[multipart] attempt ${i + 1} error:`, e);
    }
    if (i < maxRetries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return { ok: false, status: 0, text: 'Max retries exceeded' };
}

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

  try {
    const { supabase, user } = auth;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const quizId = formData.get('quizId') as string | null;
    if (!file) return errorResponse('VALIDATION_FAILED', 'No file provided', traceId, corsHeaders);

    const fileName = file.name;
    const fileSize = file.size;
    const fileSizeMb = fileSize / (1024 * 1024);

    const maxSize = 500 * 1024 * 1024;
    if (fileSize > maxSize) {
      return errorResponse('VALIDATION_FAILED', 'File too large. Maximum: 500MB', traceId, corsHeaders);
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

    const uploadUrl = `https://storage.bunnycdn.com/${storageZoneName}/${uniqueFileName}`;
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await uploadWithRetry(
      uploadUrl, storageZonePassword, fileBuffer, file.type || 'application/octet-stream',
    );

    if (!uploadResult.ok) {
      await supabase.from('bunny_videos').update({ status: 'failed' }).eq('id', videoRecord.id);
      return errorResponse('INTERNAL_ERROR', `Bunny upload failed: ${uploadResult.text}`, traceId, corsHeaders);
    }

    const isVerified = await verifyFileOnCDN(cdnUrl, 3, 1500);

    await supabase.from('bunny_videos').update({
      status: 'ready', updated_at: new Date().toISOString(),
    }).eq('id', videoRecord.id);

    const { data: existingUsage } = await supabase
      .from('video_usage').select('*').eq('user_id', user.id).maybeSingle();
    if (existingUsage) {
      await supabase.from('video_usage').update({
        bunny_size_mb: (existingUsage.bunny_size_mb || 0) + fileSizeMb,
        bunny_video_count: (existingUsage.bunny_video_count || 0) + 1,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('video_usage').insert({
        user_id: user.id, bunny_size_mb: fileSizeMb, bunny_video_count: 1,
        total_size_mb: fileSizeMb, video_count: 1,
      });
    }

    const thumbnailUrl = cdnUrl.replace(/\.[^/.]+$/, '_thumb.jpg');
    await supabase.from('bunny_videos').update({
      thumbnail_url: thumbnailUrl, updated_at: new Date().toISOString(),
    }).eq('id', videoRecord.id);

    return okResponse({
      videoId: videoRecord.id, bunnyVideoId, cdnUrl,
      fileName: uniqueFileName, verified: isVerified,
    }, traceId, corsHeaders);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[bunny-upload-video-multipart]', message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});
