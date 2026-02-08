import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmRequest {
  videoId: string;
  success: boolean;
  duration?: number;
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
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { videoId, success, duration }: ConfirmRequest = await req.json();

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

    if (success) {
      const { error: updateError } = await supabase
        .from('bunny_videos')
        .update({ 
          status: 'ready',
          duration_seconds: duration || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update video status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: usage } = await supabase
        .from('video_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usage) {
        await supabase
          .from('video_usage')
          .update({
            bunny_size_mb: (usage.bunny_size_mb || 0) + video.size_mb,
            bunny_video_count: (usage.bunny_video_count || 0) + 1,
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
            total_size_mb: 0,
            video_count: 0
          });
      }

      console.log(`Video ${videoId} confirmed as ready for user ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          cdnUrl: video.cdn_url,
          status: 'ready'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      await supabase
        .from('bunny_videos')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      return new Response(
        JSON.stringify({ success: false, status: 'failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Confirm upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
