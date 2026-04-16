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

    // Validate quiz exists and get owner
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, user_id')
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

    let responseId: string;

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

      responseId = existing.id;
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

      responseId = inserted.id;
    }

    // ═══════════════════════════════════════════
    // 🎯 Milestone events (fire-and-forget)
    // ═══════════════════════════════════════════
    try {
      if (quiz.user_id) {
        console.log(`[Milestone] Checking milestones for owner ${quiz.user_id}, quiz ${quiz_id}`);
        
        // Count total responses for this quiz owner
        const { data: ownerQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .eq('user_id', quiz.user_id);

        if (ownerQuizzes && ownerQuizzes.length > 0) {
          const quizIds = ownerQuizzes.map((q: { id: string }) => q.id);
          const { count: totalResponses } = await supabase
            .from('quiz_responses')
            .select('id', { count: 'exact', head: true })
            .in('quiz_id', quizIds);

          const total = totalResponses || 0;
          console.log(`[Milestone] Total responses for owner: ${total}`);

          // first_response_received — exactly 1 response total
          if (total === 1) {
            await supabase.from('gtm_event_logs').insert({
              event_name: 'first_response_received',
              user_id: quiz.user_id,
              metadata: { quiz_id, response_id: responseId },
            });
            console.log(`🎯 [Milestone] first_response_received for user ${quiz.user_id}`);
          }

          // 🎯 first_lead_received — first REAL lead (with email or whatsapp)
          const hasContactInfo = !!(respondent_email || respondent_whatsapp);
          const isTestLead = mergedAnswers && typeof mergedAnswers === 'object' && (mergedAnswers as Record<string, unknown>)._is_test_lead === true;
          
          console.log(`[Milestone] Lead check: hasContact=${hasContactInfo}, isExisting=${!!existing}, isTest=${isTestLead}, email=${!!respondent_email}, whatsapp=${!!respondent_whatsapp}`);
          
          if (hasContactInfo && !existing && !isTestLead) {
            // Count real leads (with contact info) for this owner, excluding test leads
            const { count: totalLeads } = await supabase
              .from('quiz_responses')
              .select('id', { count: 'exact', head: true })
              .in('quiz_id', quizIds)
              .or('respondent_email.not.is.null,respondent_whatsapp.not.is.null');

            console.log(`[Milestone] Total leads with contact info: ${totalLeads}`);

            if ((totalLeads || 0) === 1) {
              const { error: eventError } = await supabase.from('gtm_event_logs').insert({
                event_name: 'first_lead_received',
                user_id: quiz.user_id,
                metadata: { quiz_id, response_id: responseId, email: !!respondent_email, whatsapp: !!respondent_whatsapp },
              });
              console.log(`🎯 [Milestone] first_lead_received for user ${quiz.user_id}, insertError=${eventError?.message || 'none'}`);

              // 🔔 Create upgrade notification for quiz owner (first real lead)
              // Check if notification already exists to avoid duplicates
              const { data: existingNotif } = await supabase
                .from('admin_notifications')
                .select('id')
                .eq('user_id', quiz.user_id)
                .eq('type', 'first_lead_upgrade')
                .maybeSingle();

              console.log(`[Milestone] Existing notification check: ${existingNotif ? 'found' : 'none'}`);

              if (!existingNotif) {
                const { error: notifError } = await supabase.from('admin_notifications').insert({
                  user_id: quiz.user_id,
                  type: 'first_lead_upgrade',
                  title: '🎉 Seu primeiro lead chegou!',
                  message: 'Para receber mais leads sem limite, faça upgrade do seu plano.',
                  metadata: { quiz_id, response_id: responseId, link: '/precos' },
                  read: false,
                });
                console.log(`🔔 [Notification] first_lead_upgrade created for user ${quiz.user_id}, error=${notifError?.message || 'none'}`);
              }
            } else {
              console.log(`[Milestone] Skipped first_lead: totalLeads=${totalLeads} (not 1)`);
            }
          }

          // aha_threshold_reached — exactly 20 responses total
          if (total === 20) {
            await supabase.from('gtm_event_logs').insert({
              event_name: 'aha_threshold_reached',
              user_id: quiz.user_id,
              metadata: { quiz_id, total_responses: total },
            });
            console.log(`🎯 [Milestone] aha_threshold_reached for user ${quiz.user_id}`);
          }
        }
      }
    } catch (milestoneErr) {
      // Non-blocking — don't fail the response save
      console.warn('[save-quiz-response] Milestone check failed:', milestoneErr);
    }

    return new Response(
      JSON.stringify({ success: true, action: existing ? 'updated' : 'inserted', id: responseId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[save-quiz-response] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to save response' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
