import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { quizId, event } = body;

    if (!quizId || !event || !['view', 'start', 'complete'].includes(event)) {
      return new Response(JSON.stringify({ error: 'Invalid quizId or event' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: quiz } = await supabase.from('quizzes').select('id').eq('id', quizId).maybeSingle();
    if (!quiz) return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('quiz_analytics').select('*').eq('quiz_id', quizId).eq('date', today).maybeSingle();

    const updates: Record<string, unknown> = {
      quiz_id: quizId, date: today,
      views: existing?.views || 0, starts: existing?.starts || 0, completions: existing?.completions || 0
    };
    if (event === 'view') updates.views = (existing?.views || 0) + 1;
    if (event === 'start') updates.starts = (existing?.starts || 0) + 1;
    if (event === 'complete') updates.completions = (existing?.completions || 0) + 1;

    const { data: result, error } = await supabase.from('quiz_analytics').upsert(updates, { onConflict: 'quiz_id,date' }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data: result }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[TRACK-ANALYTICS] Error:', error);
    return new Response(JSON.stringify({ error: 'Unable to track analytics' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
