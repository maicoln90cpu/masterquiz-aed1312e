import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(sessionId);
  if (!record || now > record.resetTime) { rateLimitMap.set(sessionId, { count: 1, resetTime: now + 60000 }); return true; }
  if (record.count >= 100) return false;
  record.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json();
    const { quiz_id, video_id, video_url, session_id, event_type, event_data, watch_time_seconds, percentage_watched, user_id } = body;

    if (!session_id || !event_type) return new Response(JSON.stringify({ error: 'Missing session_id, event_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const validTypes = ['play','pause','seek','ended','progress_25','progress_50','progress_75','quality_change','speed_change','error'];
    if (!validTypes.includes(event_type)) return new Response(JSON.stringify({ error: 'Invalid event_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (!checkRateLimit(session_id)) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let ownerUserId = user_id;
    if (quiz_id && !ownerUserId) {
      const { data: quiz } = await supabase.from('quizzes').select('user_id').eq('id', quiz_id).single();
      if (quiz) ownerUserId = quiz.user_id;
    }

    const { error } = await supabase.from('video_analytics').insert({
      quiz_id, video_id, video_url, session_id, event_type, event_data: event_data || {},
      watch_time_seconds: watch_time_seconds || 0, percentage_watched: percentage_watched || 0, user_id: ownerUserId,
    });

    if (error) { console.error('Insert error:', error); return new Response(JSON.stringify({ error: 'Failed to track' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('track-video-analytics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
