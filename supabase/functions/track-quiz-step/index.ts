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
    const { quizId, sessionId, stepNumber, questionId } = await req.json();

    if (!quizId || !sessionId || typeof stepNumber !== 'number' || stepNumber < 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: quiz } = await supabase.from('quizzes').select('id').eq('id', quizId).maybeSingle();
    if (!quiz) return new Response(JSON.stringify({ error: 'Quiz not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const today = new Date().toISOString().split('T')[0];
    const { data: result, error } = await supabase.from('quiz_step_analytics').upsert(
      { quiz_id: quizId, session_id: sessionId, step_number: stepNumber, question_id: questionId || null, date: today },
      { onConflict: 'quiz_id,session_id,step_number', ignoreDuplicates: true }
    ).select().maybeSingle();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[track-quiz-step] Error:', error);
    return new Response(JSON.stringify({ error: 'Unable to track step' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
