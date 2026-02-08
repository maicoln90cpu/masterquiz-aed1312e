import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteRequest {
  videoId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const { videoId }: CompleteRequest = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'videoId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Completing chunked upload for video: ${videoId}, user: ${user.id}`);

    const { data: video, error: fetchError } = await supabase
      .from('bunny_videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !video) {
      console.error('Video not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Video not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await supabase
      .from('bunny_videos')
      .update({ 
        status: 'ready',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Failed to update video status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update video status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingUsage } = await supabase
      .from('video_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingUsage) {
      await supabase
        .from('video_usage')
        .update({
          bunny_size_mb: (existingUsage.bunny_size_mb || 0) + video.size_mb,
          bunny_video_count: (existingUsage.bunny_video_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('video_usage')
        .insert({
          user_id: user.id,
          bunny_size_mb: video.size_mb,
          bunny_video_count: 1,
          total_size_mb: video.size_mb,
          video_count: 1
        });
    }

    const thumbnailUrl = video.cdn_url?.replace(/\.[^/.]+$/, '_thumb.jpg') || null;
    
    if (thumbnailUrl) {
      await supabase
        .from('bunny_videos')
        .update({ 
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);
    }

    console.log(`Chunked upload completed for video: ${videoId}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        cdnUrl: video.cdn_url,
        status: 'ready'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Chunked complete error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
