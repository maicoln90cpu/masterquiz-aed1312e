import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  user_id: z.string().uuid(),
  plan_type: z.string().min(1).optional(),
  quiz_limit: z.number().int().nullable().optional(),
  response_limit: z.number().int().nullable().optional(),
  status: z.string().optional(),
  payment_confirmed: z.boolean().optional(),
  trial_days: z.number().int().positive().optional(),
  trial_plan_type: z.string().optional(),
  original_plan_type: z.string().optional(),
  cancel_trial: z.boolean().optional(),
});

Deno.serve(async (req) => {
  const traceId = getTraceId(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, 'x-trace-id': traceId } });
  }

  try {
    // Validate caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('UNAUTHORIZED', 'Token ausente', traceId, corsHeaders);
    }

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (claimsError || !claimsData?.claims) {
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    const callerId = claimsData.claims.sub;

    // Use service_role to check admin role and perform update
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId);

    const isAdmin = roles?.some((r: any) =>
      r.role === 'admin' || r.role === 'master_admin'
    );

    if (!isAdmin) {
      return errorResponse('FORBIDDEN', 'Requer papel de admin', traceId, corsHeaders);
    }

    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { user_id, plan_type, quiz_limit, response_limit, status, payment_confirmed,
            trial_days, trial_plan_type, original_plan_type, cancel_trial } = parsed.data;

    // === CANCEL TRIAL ===
    if (cancel_trial) {
      console.log(`[ADMIN-UPDATE-SUB] Cancelling trial for user ${user_id}`);
      
      // Get current subscription to find original plan
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('original_plan_type')
        .eq('user_id', user_id)
        .maybeSingle();

      if (!currentSub?.original_plan_type) {
        return errorResponse('VALIDATION_FAILED', 'Nenhum trial ativo encontrado', traceId, corsHeaders);
      }

      // Get limits of the original plan
      const { data: originalPlan } = await supabase
        .from('subscription_plans')
        .select('quiz_limit, response_limit')
        .eq('plan_type', currentSub.original_plan_type)
        .eq('is_active', true)
        .maybeSingle();

      if (!originalPlan) {
        return errorResponse('INTERNAL_ERROR', `Plano original "${currentSub.original_plan_type}" não configurado`, traceId, corsHeaders);
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: currentSub.original_plan_type,
          quiz_limit: originalPlan.quiz_limit,
          response_limit: originalPlan.response_limit,
          original_plan_type: null,
          trial_end_date: null,
          trial_started_at: null,
          trial_started_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .select()
        .maybeSingle();

      if (error) {
        return errorResponse('INTERNAL_ERROR', error.message, traceId, corsHeaders);
      }

      // Log trial cancellation
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user_id).maybeSingle();
      await supabase.from('trial_logs').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user_id).eq('status', 'active');

      console.log(`[ADMIN-UPDATE-SUB] Trial cancelled, reverted to ${currentSub.original_plan_type}`);
      return okResponse({ success: true, data, trial_cancelled: true }, traceId, corsHeaders);
    }

    // === ACTIVATE TRIAL ===
    if (trial_days && trial_plan_type) {
      console.log(`[ADMIN-UPDATE-SUB] Activating trial: ${trial_plan_type} for ${trial_days} days, user ${user_id}`);

      // Get current plan type to save as original
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('plan_type, original_plan_type')
        .eq('user_id', user_id)
        .maybeSingle();

      // Use the real original plan (if already in trial, keep the original original)
      const realOriginalPlan = original_plan_type || currentSub?.original_plan_type || currentSub?.plan_type || 'free';

      // Get limits of the trial plan
      const { data: trialPlan } = await supabase
        .from('subscription_plans')
        .select('quiz_limit, response_limit')
        .eq('plan_type', trial_plan_type)
        .eq('is_active', true)
        .maybeSingle();

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trial_days);

      if (!trialPlan) {
        return errorResponse('INTERNAL_ERROR', `Plano de trial "${trial_plan_type}" não configurado`, traceId, corsHeaders);
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: trial_plan_type,
          quiz_limit: trialPlan.quiz_limit,
          response_limit: trialPlan.response_limit,
          original_plan_type: realOriginalPlan,
          trial_end_date: trialEndDate.toISOString(),
          trial_started_at: new Date().toISOString(),
          trial_started_by: callerId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .select()
        .maybeSingle();

      if (error) {
        return errorResponse('INTERNAL_ERROR', error.message, traceId, corsHeaders);
      }

      // Log trial activation
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user_id).maybeSingle();
      await supabase.from('trial_logs').insert({
        user_id,
        user_email: profile?.email || null,
        trial_plan_type,
        original_plan_type: realOriginalPlan,
        trial_days,
        trial_end_date: trialEndDate.toISOString(),
        started_by: callerId,
        status: 'active',
      });

      console.log(`[ADMIN-UPDATE-SUB] Trial activated until ${trialEndDate.toISOString()}`);
      return okResponse({ success: true, data, trial_activated: true, trial_end_date: trialEndDate.toISOString() }, traceId, corsHeaders);
    }

    // === REGULAR PLAN UPDATE ===
    if (!plan_type) {
      return errorResponse('VALIDATION_FAILED', 'plan_type obrigatório', traceId, corsHeaders);
    }

    console.log(`[ADMIN-UPDATE-SUB] Admin ${callerId} updating user ${user_id} to plan ${plan_type}`);

    const updateData: Record<string, any> = {
      plan_type,
      updated_at: new Date().toISOString(),
      // Clear trial fields on regular update
      original_plan_type: null,
      trial_end_date: null,
      trial_started_at: null,
      trial_started_by: null,
    };

    if (quiz_limit !== undefined) updateData.quiz_limit = quiz_limit;
    if (response_limit !== undefined) updateData.response_limit = response_limit;
    if (status !== undefined) updateData.status = status;
    if (payment_confirmed !== undefined) updateData.payment_confirmed = payment_confirmed;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[ADMIN-UPDATE-SUB] Update error:', error);
      return errorResponse('INTERNAL_ERROR', error.message, traceId, corsHeaders);
    }

    console.log(`[ADMIN-UPDATE-SUB] Successfully updated subscription for ${user_id}`);

    return okResponse({ success: true, data }, traceId, corsHeaders);

  } catch (error) {
    console.error('[ADMIN-UPDATE-SUB] Error:', error);
    return errorResponse('INTERNAL_ERROR', (error as Error)?.message || String(error), traceId, corsHeaders);
  }
});
