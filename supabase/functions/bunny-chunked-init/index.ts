import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InitRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
  quizId?: string;
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

    const { fileName, fileSize, fileType, quizId }: InitRequest = await req.json();

    if (!fileName || !fileSize) {
      return new Response(
        JSON.stringify({ error: 'fileName and fileSize required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Chunked init request: ${fileName}, size: ${fileSize}, user: ${user.id}`);

    const maxSize = 2 * 1024 * 1024 * 1024;
    if (fileSize > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande. Máximo: 2GB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const { data: usage } = await supabase
      .from('video_usage')
      .select('bunny_size_mb')
      .eq('user_id', user.id)
      .single();

    const currentUsageMb = usage?.bunny_size_mb || 0;
    const fileSizeMb = fileSize / (1024 * 1024);
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

    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop() || 'mp4';
    const uniqueFileName = `${user.id}/${timestamp}.${fileExt}`;
    const bunnyVideoId = `${user.id}_${timestamp}`;
    const cdnUrl = `https://${cdnHostname}/${uniqueFileName}`;

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

    const uploadPath = `${storageZoneName}/${uniqueFileName}`;

    console.log(`Chunked upload initialized: ${uploadPath}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId: videoRecord.id,
        bunnyVideoId,
        cdnUrl,
        uploadPath,
        accessKey: storageZonePassword,
        fileName: uniqueFileName
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Chunked init error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
