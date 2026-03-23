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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      quiz_id,
      session_id,
      answers,
      respondent_name,
      respondent_email,
      respondent_whatsapp,
      custom_field_data,
      result_id,
      is_final,
    } = body;

    if (!quiz_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'quiz_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate quiz exists
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quiz_id)
      .maybeSingle();

    if (!quiz) {
      return new Response(
        JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if response already exists for this session (service_role bypasses RLS)
    const { data: existing } = await supabase
      .from('quiz_responses')
      .select('id, answers')
      .eq('quiz_id', quiz_id)
      .eq('session_id', session_id)
      .maybeSingle();

    // Merge answers: keep existing answers and overlay new ones
    const mergedAnswers = {
      ...(existing?.answers && typeof existing.answers === 'object' ? existing.answers : {}),
      ...(answers && typeof answers === 'object' ? answers : {}),
    };

    if (existing) {
      // UPDATE existing row
      const updatePayload: Record<string, unknown> = {
        answers: mergedAnswers,
      };
      if (respondent_name !== undefined) updatePayload.respondent_name = respondent_name || null;
      if (respondent_email !== undefined) updatePayload.respondent_email = respondent_email || null;
      if (respondent_whatsapp !== undefined) updatePayload.respondent_whatsapp = respondent_whatsapp || null;
      if (custom_field_data !== undefined) updatePayload.custom_field_data = custom_field_data;
      if (result_id !== undefined) updatePayload.result_id = result_id;
      if (is_final) updatePayload.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('quiz_responses')
        .update(updatePayload)
        .eq('id', existing.id);

      if (error) {
        console.error('[save-quiz-response] Update error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, action: 'updated', id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // INSERT new row
      const insertPayload: Record<string, unknown> = {
        quiz_id,
        session_id,
        answers: mergedAnswers,
        respondent_name: respondent_name || null,
        respondent_email: respondent_email || null,
        respondent_whatsapp: respondent_whatsapp || null,
        custom_field_data: custom_field_data || null,
        result_id: result_id || null,
      };

      const { data: inserted, error } = await supabase
        .from('quiz_responses')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) {
        console.error('[save-quiz-response] Insert error:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, action: 'inserted', id: inserted.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[save-quiz-response] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to save response' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
