import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThumbnailRequest {
  videoId: string;
}

function generateThumbnailUrl(cdnUrl: string, cdnHostname: string): string {
  const urlParts = cdnUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  return `https://${cdnHostname}/${urlParts[urlParts.length - 2]}/${fileNameWithoutExt}_thumb.jpg`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cdnHostname = Deno.env.get('BUNNY_CDN_HOSTNAME');

    if (!cdnHostname) {
      return new Response(
        JSON.stringify({ error: 'Bunny CDN not configured' }),
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
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { videoId }: ThumbnailRequest = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'videoId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: video, error: fetchError } = await supabase
      .from('bunny_videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !video) {
      return new Response(
        JSON.stringify({ error: 'Video not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!video.cdn_url) {
      return new Response(
        JSON.stringify({ error: 'Video has no CDN URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const thumbnailUrl = generateThumbnailUrl(video.cdn_url, cdnHostname);

    const { error: updateError } = await supabase
      .from('bunny_videos')
      .update({ 
        thumbnail_url: thumbnailUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Failed to update thumbnail URL:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update thumbnail URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Thumbnail URL set for video ${videoId}: ${thumbnailUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        thumbnailUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate thumbnail error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
