import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Verify file exists on CDN with retries
async function verifyFileOnCDN(cdnUrl: string, maxRetries = 3, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(cdnUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`File verified on CDN (attempt ${i + 1}): ${cdnUrl}`);
        return true;
      }
      console.log(`CDN verification attempt ${i + 1} failed: ${response.status}`);
    } catch (error) {
      console.log(`CDN verification attempt ${i + 1} error:`, error);
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  return false;
}

// Helper: Upload with retry
async function uploadWithRetry(
  uploadUrl: string,
  storageZonePassword: string,
  fileBuffer: ArrayBuffer,
  contentType: string,
  maxRetries = 2
): Promise<{ ok: boolean; status: number; text: string }> {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': storageZonePassword,
          'Content-Type': contentType,
        },
        body: fileBuffer,
      });

      const text = await response.text();

      if (response.ok) {
        return { ok: true, status: response.status, text };
      }

      console.log(`Upload attempt ${i + 1} failed: ${response.status} - ${text}`);

      // Don't retry on auth errors
      if (response.status === 401 || response.status === 403) {
        return { ok: false, status: response.status, text };
      }
    } catch (error) {
      console.log(`Upload attempt ${i + 1} error:`, error);
    }

    if (i < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  return { ok: false, status: 0, text: 'Max retries exceeded' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const storageZoneName = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
    const storageZonePassword = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');
    const cdnHostname = Deno.env.get('BUNNY_CDN_HOSTNAME');

    if (!storageZoneName || !storageZonePassword || !cdnHostname) {
      console.error('Missing Bunny CDN configuration');
      return new Response(
        JSON.stringify({ error: 'Bunny CDN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (cdnHostname.includes('storage.bunnycdn')) {
      console.error('BUNNY_CDN_HOSTNAME incorrectly configured');
      return new Response(
        JSON.stringify({ error: 'Bunny CDN misconfigured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const quizId = formData.get('quizId') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name;
    const fileSize = file.size;
    const fileSizeMb = fileSize / (1024 * 1024);

    console.log(`Multipart upload: ${fileName}, size: ${fileSizeMb.toFixed(2)}MB, user: ${user.id}`);

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum: 500MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's video storage limit
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_type')
      .eq('user_id', user.id)
      .single();

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('video_storage_limit_mb, allow_video_upload')
      .eq('plan_type', subscription?.plan_type || 'free')
      .single();

    if (!plan?.allow_video_upload) {
      return new Response(
        JSON.stringify({ error: 'Video upload not allowed in your plan' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check current usage
    const { data: usage } = await supabase
      .from('video_usage')
      .select('bunny_size_mb')
      .eq('user_id', user.id)
      .single();

    const currentUsageMb = usage?.bunny_size_mb || 0;
    const limitMb = plan.video_storage_limit_mb || 100;

    if (currentUsageMb + fileSizeMb > limitMb) {
      return new Response(
        JSON.stringify({
          error: 'Storage limit exceeded',
          currentUsage: currentUsageMb,
          limit: limitMb,
          required: fileSizeMb
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop() || 'mp4';
    const uniqueFileName = `${user.id}/${timestamp}.${fileExt}`;
    const bunnyVideoId = `${user.id}_${timestamp}`;
    const cdnUrl = `https://${cdnHostname}/${uniqueFileName}`;

    // Create video record in database with status 'uploading'
    const { data: videoRecord, error: insertError } = await supabase
      .from('bunny_videos')
      .insert({
        user_id: user.id,
        quiz_id: quizId || null,
        bunny_video_id: bunnyVideoId,
        file_name: uniqueFileName,
        original_name: fileName,
        size_mb: fileSizeMb,
        status: 'uploading',
        cdn_url: cdnUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create video record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload file to Bunny Storage with retry
    const uploadUrl = `https://storage.bunnycdn.com/${storageZoneName}/${uniqueFileName}`;

    console.log(`Uploading to Bunny: ${uploadUrl}`);

    const fileBuffer = await file.arrayBuffer();

    const uploadResult = await uploadWithRetry(
      uploadUrl,
      storageZonePassword,
      fileBuffer,
      file.type || 'application/octet-stream'
    );

    if (!uploadResult.ok) {
      console.error('Bunny upload failed after retries:', uploadResult.status, uploadResult.text);

      await supabase
        .from('bunny_videos')
        .update({ status: 'failed' })
        .eq('id', videoRecord.id);

      return new Response(
        JSON.stringify({ error: 'Failed to upload to Bunny CDN', details: uploadResult.text }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Bunny upload successful, verifying on CDN...');

    // Verify file exists on CDN before marking as ready
    const isVerified = await verifyFileOnCDN(cdnUrl, 3, 1500);

    if (!isVerified) {
      console.warn('File uploaded but not yet verified on CDN. Marking as ready anyway.');
    } else {
      console.log('File verified on CDN successfully');
    }

    // Update video record to 'ready'
    await supabase
      .from('bunny_videos')
      .update({
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoRecord.id);

    // Update user's video usage
    const { data: existingUsage } = await supabase
      .from('video_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingUsage) {
      await supabase
        .from('video_usage')
        .update({
          bunny_size_mb: (existingUsage.bunny_size_mb || 0) + fileSizeMb,
          bunny_video_count: (existingUsage.bunny_video_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('video_usage')
        .insert({
          user_id: user.id,
          bunny_size_mb: fileSizeMb,
          bunny_video_count: 1,
          total_size_mb: fileSizeMb,
          video_count: 1
        });
    }

    // Generate thumbnail URL
    const thumbnailUrl = cdnUrl.replace(/\.[^/.]+$/, '_thumb.jpg');

    await supabase
      .from('bunny_videos')
      .update({
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoRecord.id);

    console.log(`Video upload complete: ${videoRecord.id}, verified: ${isVerified}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId: videoRecord.id,
        bunnyVideoId,
        cdnUrl,
        fileName: uniqueFileName,
        verified: isVerified
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Bunny multipart upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
