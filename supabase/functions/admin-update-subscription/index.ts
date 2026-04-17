import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { user_id, plan_type, quiz_limit, response_limit, status, payment_confirmed,
            // Trial fields
            trial_days, trial_plan_type, original_plan_type, cancel_trial } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === CANCEL TRIAL ===
    if (cancel_trial) {
      console.log(`[ADMIN-UPDATE-SUB] Cancelling trial for user ${user_id}`);
      
      // Get current subscription to find original plan
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('original_plan_type')
        .eq('user_id', user_id)
        .single();

      if (!currentSub?.original_plan_type) {
        return new Response(JSON.stringify({ error: 'No active trial found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get limits of the original plan
      const { data: originalPlan } = await supabase
        .from('subscription_plans')
        .select('quiz_limit, response_limit')
        .eq('plan_type', currentSub.original_plan_type)
        .eq('is_active', true)
        .single();

      if (!originalPlan) {
        return new Response(JSON.stringify({ error: `Original plan "${currentSub.original_plan_type}" not configured` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log trial cancellation
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user_id).single();
      await supabase.from('trial_logs').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user_id).eq('status', 'active');

      console.log(`[ADMIN-UPDATE-SUB] Trial cancelled, reverted to ${currentSub.original_plan_type}`);
      return new Response(JSON.stringify({ success: true, data, trial_cancelled: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === ACTIVATE TRIAL ===
    if (trial_days && trial_plan_type) {
      console.log(`[ADMIN-UPDATE-SUB] Activating trial: ${trial_plan_type} for ${trial_days} days, user ${user_id}`);

      // Get current plan type to save as original
      const { data: currentSub } = await supabase
        .from('user_subscriptions')
        .select('plan_type, original_plan_type')
        .eq('user_id', user_id)
        .single();

      // Use the real original plan (if already in trial, keep the original original)
      const realOriginalPlan = original_plan_type || currentSub?.original_plan_type || currentSub?.plan_type || 'free';

      // Get limits of the trial plan
      const { data: trialPlan } = await supabase
        .from('subscription_plans')
        .select('quiz_limit, response_limit')
        .eq('plan_type', trial_plan_type)
        .eq('is_active', true)
        .single();

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trial_days);

      if (!trialPlan) {
        return new Response(JSON.stringify({ error: `Trial plan "${trial_plan_type}" not configured` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log trial activation
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user_id).single();
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
      return new Response(JSON.stringify({ success: true, data, trial_activated: true, trial_end_date: trialEndDate.toISOString() }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === REGULAR PLAN UPDATE ===
    if (!plan_type) {
      return new Response(JSON.stringify({ error: 'plan_type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      .single();

    if (error) {
      console.error('[ADMIN-UPDATE-SUB] Update error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ADMIN-UPDATE-SUB] Successfully updated subscription for ${user_id}`);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ADMIN-UPDATE-SUB] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
