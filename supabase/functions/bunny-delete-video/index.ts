import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteRequest {
  videoId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const bunnyApiKey = Deno.env.get('BUNNY_API_KEY');
    const storageZoneName = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
    const storageZonePassword = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');

    if (!bunnyApiKey || !storageZoneName || !storageZonePassword) {
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

    const { videoId }: DeleteRequest = await req.json();

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

    const deleteUrl = `https://storage.bunnycdn.com/${storageZoneName}/${video.file_name}`;
    
    try {
      const bunnyResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': storageZonePassword
        }
      });

      if (!bunnyResponse.ok && bunnyResponse.status !== 404) {
        console.error('Bunny delete failed:', await bunnyResponse.text());
      }

      console.log(`Deleted from Bunny: ${video.file_name}`);
    } catch (bunnyError) {
      console.error('Bunny API error:', bunnyError);
    }

    const { error: updateError } = await supabase
      .from('bunny_videos')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    const { data: usage } = await supabase
      .from('video_usage')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (usage && video.status === 'ready') {
      await supabase
        .from('video_usage')
        .update({
          bunny_size_mb: Math.max(0, (usage.bunny_size_mb || 0) - video.size_mb),
          bunny_video_count: Math.max(0, (usage.bunny_video_count || 0) - 1),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    console.log(`Video ${videoId} deleted for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete video error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
