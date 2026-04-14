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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check admin role
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

    console.log(`[SYNC-PLAN-LIMITS] Admin ${callerId} triggered plan sync`);

    // Fetch all active plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('plan_type, quiz_limit, response_limit')
      .eq('is_active', true);

    if (plansError) {
      console.error('[SYNC-PLAN-LIMITS] Error fetching plans:', plansError);
      return new Response(JSON.stringify({ error: plansError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, { updated: number; quiz_limit: number; response_limit: number }> = {};

    for (const plan of plans || []) {
      // Skip admin plan type
      if (plan.plan_type === 'admin') continue;

      const { data: updated, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          quiz_limit: plan.quiz_limit,
          response_limit: plan.response_limit,
          updated_at: new Date().toISOString(),
        })
        .eq('plan_type', plan.plan_type)
        .select('id');

      if (updateError) {
        console.error(`[SYNC-PLAN-LIMITS] Error updating ${plan.plan_type}:`, updateError);
        results[plan.plan_type] = { updated: 0, quiz_limit: plan.quiz_limit, response_limit: plan.response_limit };
      } else {
        const count = updated?.length || 0;
        console.log(`[SYNC-PLAN-LIMITS] Updated ${count} users on plan ${plan.plan_type}`);
        results[plan.plan_type] = { updated: count, quiz_limit: plan.quiz_limit, response_limit: plan.response_limit };
      }
    }

    const totalUpdated = Object.values(results).reduce((sum, r) => sum + r.updated, 0);
    console.log(`[SYNC-PLAN-LIMITS] Total updated: ${totalUpdated}`);

    return new Response(JSON.stringify({ 
      success: true, 
      total_updated: totalUpdated,
      details: results 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SYNC-PLAN-LIMITS] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
