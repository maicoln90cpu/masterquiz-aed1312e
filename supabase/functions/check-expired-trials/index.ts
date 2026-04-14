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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find all expired trials
    const { data: expiredTrials, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('user_id, original_plan_type, plan_type, trial_end_date')
      .not('original_plan_type', 'is', null)
      .not('trial_end_date', 'is', null)
      .lt('trial_end_date', new Date().toISOString());

    if (fetchError) {
      console.error('[CHECK-EXPIRED-TRIALS] Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      console.log('[CHECK-EXPIRED-TRIALS] No expired trials found');
      return new Response(JSON.stringify({ success: true, reverted: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[CHECK-EXPIRED-TRIALS] Found ${expiredTrials.length} expired trials`);

    let revertedCount = 0;
    const results: any[] = [];

    for (const trial of expiredTrials) {
      try {
        // Get limits for original plan
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('quiz_limit, response_limit')
          .eq('plan_type', trial.original_plan_type)
          .eq('is_active', true)
          .single();

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            plan_type: trial.original_plan_type,
            quiz_limit: plan?.quiz_limit || 3,
            response_limit: plan?.response_limit || 100,
            original_plan_type: null,
            trial_end_date: null,
            trial_started_at: null,
            trial_started_by: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', trial.user_id);

        if (updateError) {
          console.error(`[CHECK-EXPIRED-TRIALS] Error reverting ${trial.user_id}:`, updateError);
          results.push({ user_id: trial.user_id, status: 'error', error: updateError.message });
        } else {
          // Log trial expiration
          await supabase.from('trial_logs').update({
            status: 'expired',
            reverted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', trial.user_id).eq('status', 'active');

          revertedCount++;
          console.log(`[CHECK-EXPIRED-TRIALS] Reverted ${trial.user_id}: ${trial.plan_type} → ${trial.original_plan_type}`);
          results.push({ user_id: trial.user_id, status: 'reverted', from: trial.plan_type, to: trial.original_plan_type });
        }
      } catch (err) {
        console.error(`[CHECK-EXPIRED-TRIALS] Exception for ${trial.user_id}:`, err);
        results.push({ user_id: trial.user_id, status: 'error', error: String(err) });
      }
    }

    console.log(`[CHECK-EXPIRED-TRIALS] Done. Reverted ${revertedCount}/${expiredTrials.length}`);

    return new Response(JSON.stringify({ success: true, reverted: revertedCount, total: expiredTrials.length, results }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CHECK-EXPIRED-TRIALS] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
