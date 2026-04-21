import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);

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
      return errorResponse(
        'VALIDATION_FAILED',
        'quiz_id and session_id are required',
        traceId,
        corsHeaders
      );
    }

    // Validate quiz exists and get owner
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, user_id')
      .eq('id', quiz_id)
      .maybeSingle();

    if (!quiz) {
      return errorResponse('NOT_FOUND', 'Quiz not found', traceId, corsHeaders);
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
            // Dedup PERMANENTE via user_milestones (gtm_event_logs é apagado em 30d)
            const { data: alreadyFiredFirstLead } = await supabase
              .from('user_milestones')
              .select('id')
              .eq('user_id', quiz.user_id)
              .eq('milestone_name', 'first_lead_received')
              .maybeSingle();

            if (!alreadyFiredFirstLead) {
              const { error: eventError } = await supabase.from('gtm_event_logs').insert({
                event_name: 'first_lead_received',
                user_id: quiz.user_id,
                metadata: { quiz_id, response_id: responseId, email: !!respondent_email, whatsapp: !!respondent_whatsapp },
              });
              console.log(`🎯 [Milestone] first_lead_received for user ${quiz.user_id}, insertError=${eventError?.message || 'none'}`);

              // Marca permanente (idempotente via UNIQUE)
              await supabase.from('user_milestones').insert({
                user_id: quiz.user_id,
                milestone_name: 'first_lead_received',
                metadata: { quiz_id, response_id: responseId },
              });

              // 🎯 M01: marca first_lead_received_at no profile (idempotente via RPC)
              const { error: rpcError } = await supabase.rpc('mark_first_lead_received', { _owner_id: quiz.user_id });
              if (rpcError) {
                console.warn(`[M01] mark_first_lead_received failed: ${rpcError.message}`);
              } else {
                console.log(`🎯 [M01] first_lead_received_at marcado para ${quiz.user_id}`);
              }

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
              console.log(`[Milestone] Skipped first_lead: já registrado em user_milestones`);
            }
          }

          // ═══════════════════════════════════════════
          // 🎯 quiz_engaged_5_leads — usuário ON com 5+ respostas reais
          // ═══════════════════════════════════════════
          try {
            const { data: alreadyFiredEngaged } = await supabase
              .from('user_milestones')
              .select('id')
              .eq('user_id', quiz.user_id)
              .eq('milestone_name', 'quiz_engaged_5_leads')
              .maybeSingle();

            if (!alreadyFiredEngaged) {
              const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('user_objectives')
                .eq('id', quiz.user_id)
                .maybeSingle();

              const ON_OBJECTIVES = ['lead_capture_launch', 'vsl_conversion', 'offer_validation'];
              const objectives: string[] = Array.isArray(ownerProfile?.user_objectives)
                ? (ownerProfile!.user_objectives as string[])
                : [];
              const isON = objectives.some((o) => ON_OBJECTIVES.includes(o));

              console.log(`[quiz_engaged_5_leads] objectives=${JSON.stringify(objectives)}, isON=${isON}`);

              if (isON) {
                // Contar respostas reais (excluindo test leads).
                // Sintaxe PostgREST para JSONB: usar .not() encadeado garante o filtro correto.
                // Equivalente SQL: AND (answers->>'_is_test_lead' IS NULL OR answers->>'_is_test_lead' != 'true')
                const { count: realResponses, error: countErr } = await supabase
                  .from('quiz_responses')
                  .select('id', { count: 'exact', head: true })
                  .in('quiz_id', quizIds)
                  .not('answers->>_is_test_lead', 'eq', 'true');

                if (countErr) {
                  console.warn(`[quiz_engaged_5_leads] Count error: ${countErr.message}`);
                }

                console.log(`[quiz_engaged_5_leads] realResponses=${realResponses}`);

                if ((realResponses || 0) >= 5) {
                  await supabase.from('gtm_event_logs').insert({
                    event_name: 'quiz_engaged_5_leads',
                    user_id: quiz.user_id,
                    metadata: {
                      quiz_id,
                      total_responses: realResponses,
                      objectives,
                    },
                  });

                  await supabase.from('user_milestones').insert({
                    user_id: quiz.user_id,
                    milestone_name: 'quiz_engaged_5_leads',
                    metadata: { quiz_id, total_responses: realResponses, objectives },
                  });

                  console.log(`🎯 [Milestone] quiz_engaged_5_leads disparado para ${quiz.user_id} (${realResponses} respostas)`);
                }
              }
            }
          } catch (engagedErr) {
            console.warn('[quiz_engaged_5_leads] Falhou (não-bloqueante):', engagedErr);
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

    return okResponse(
      { action: existing ? 'updated' : 'inserted', id: responseId },
      traceId,
      corsHeaders
    );
  } catch (error) {
    console.error('[save-quiz-response] Error:', error);
    return errorResponse('INTERNAL_ERROR', 'Unable to save response', traceId, corsHeaders);
  }
});
