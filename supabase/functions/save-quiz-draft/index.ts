import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { quizId, title, description, template, questions, timestamp } = payload;

    if (!quizId) {
      return new Response(JSON.stringify({ error: 'quizId is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { error: quizError } = await supabase.from('quizzes').update({
      title, description, template, updated_at: timestamp || new Date().toISOString(),
    }).eq('id', quizId);

    if (quizError) {
      return new Response(JSON.stringify({ error: quizError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (questions && Array.isArray(questions) && questions.length > 0) {
      await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
      const questionsToInsert = questions.map((q: any, index: number) => ({
        quiz_id: quizId,
        question_text: q.question_text || q.blocks?.find((b: any) => b.type === 'question')?.content || 'Pergunta',
        answer_format: q.answer_format || 'single_choice',
        options: q.options || [], blocks: q.blocks || [], order_number: index,
      }));
      const { error: qError } = await supabase.from('quiz_questions').insert(questionsToInsert);
      if (qError) console.error('Error inserting questions:', qError);
    }

    return new Response(JSON.stringify({ success: true, quizId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('save-quiz-draft error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
