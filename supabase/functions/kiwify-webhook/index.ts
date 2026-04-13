import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-token',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function mapProductToPlanType(produto: string, planName?: string): 'free' | 'paid' | 'partner' | 'premium' {
  // Priority: check subscription plan name first, then product name
  const sources = [planName, produto].filter(Boolean).map(s => s!.toLowerCase());
  
  for (const p of sources) {
    if (p.includes('premium')) return 'premium';
    if (p.includes('partner') || p.includes('parceiro')) return 'partner';
    if (p.includes('pro') || p.includes('profissional') || p.includes('paid')) return 'paid';
  }
  return 'paid'; // default for any paid event
}

function isActivationEvent(e: string): boolean {
  return ['order_paid','order_approved','subscription_created','subscription_renewed','approved','paid'].some(a => e.toLowerCase().includes(a));
}

function isCancellationEvent(e: string): boolean {
  return ['subscription_cancelled','refund_requested','chargeback','cancelled','canceled','refund'].some(a => e.toLowerCase().includes(a));
}

/**
 * Extract data from Kiwify webhook payload.
 * Real payments nest everything under body.order; test webhooks use flat structure.
 */
function extractPayloadData(body: any) {
  const order = body.order || body;
  
  // Event: prioritize webhook_event_type > order_status > fallbacks
  const evento = order.webhook_event_type || order.order_status || body.event || body.order_status || body.subscription_status || 'unknown';
  
  // Customer: nested under order.Customer or flat
  const customer = order.Customer || order.customer || body.Customer || body.customer || body.data?.customer || {};
  const buyerEmail = (customer.email || body.email || body.data?.buyer?.email)?.toLowerCase();
  
  // Product
  const product = order.Product || order.product || body.Product || body.product || body.data?.product || {};
  const produto = product.name || product.product_name || body.product_name || 'unknown';
  
  // Subscription plan name (e.g. "Partner")
  const subscription = order.Subscription || order.subscription || {};
  const planName = subscription.plan?.name || subscription.plan_name || undefined;
  
  return { evento, buyerEmail, produto, planName, customer };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let rawBody;
    try { rawBody = await req.json(); } catch { 
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { evento, buyerEmail, produto, planName } = extractPayloadData(rawBody);

    console.log(`[KIWIFY] Event: ${evento}, email: ${buyerEmail ? '***' : 'none'}, product: ${produto}, plan: ${planName || 'N/A'}`);

    if (!buyerEmail) {
      await supabaseAdmin.from('webhook_logs').insert({ email: 'test-no-email', evento, produto, status: 'test', error_message: 'No email', provider: 'kiwify' });
      return new Response(JSON.stringify({ received: true, message: 'Test webhook logged' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const user = authUsers?.users?.find(u => u.email?.toLowerCase() === buyerEmail);

    if (!user) {
      await supabaseAdmin.from('webhook_logs').insert({ email: buyerEmail, evento, produto, status: 'pending', error_message: 'User not found', provider: 'kiwify' });
      return new Response(JSON.stringify({ received: true, message: 'User not found, stored for later' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let newPlanType: 'free' | 'paid' | 'partner' | 'premium' = 'free';
    let newStatus: 'active' | 'inactive' = 'inactive';
    let actionTaken = 'none';

    if (isCancellationEvent(evento)) { newPlanType = 'free'; newStatus = 'inactive'; actionTaken = 'downgrade_to_free'; }
    else if (isActivationEvent(evento)) { newPlanType = mapProductToPlanType(produto, planName); newStatus = 'active'; actionTaken = 'activate_subscription'; }
    else {
      await supabaseAdmin.from('webhook_logs').insert({ email: buyerEmail, evento, produto, status: 'ignored', error_message: `Unhandled: ${evento}`, provider: 'kiwify' });
      return new Response(JSON.stringify({ received: true, action: 'logged' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: planData } = await supabaseAdmin.from('subscription_plans').select('quiz_limit, response_limit').eq('plan_type', newPlanType).eq('is_active', true).maybeSingle();
    const quizLimit = planData?.quiz_limit || (newPlanType === 'free' ? 3 : 10);
    const responseLimit = planData?.response_limit || (newPlanType === 'free' ? 100 : 1000);

    const updatePayload: Record<string, any> = {
      plan_type: newPlanType, status: newStatus, quiz_limit: quizLimit, response_limit: responseLimit, updated_at: new Date().toISOString()
    };
    if (isActivationEvent(evento)) {
      updatePayload.payment_confirmed = true;
    }

    const { error: updateError } = await supabaseAdmin.from('user_subscriptions').update(updatePayload).eq('user_id', user.id);

    if (updateError) {
      await supabaseAdmin.from('webhook_logs').insert({ email: buyerEmail, evento, produto, status: 'error', error_message: updateError.message, provider: 'kiwify' });
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await supabaseAdmin.from('webhook_logs').insert({ email: buyerEmail, evento, produto, status: 'success', error_message: null, provider: 'kiwify' });

    // Mark A/B test conversion if applicable
    if (isActivationEvent(evento)) {
      try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('email', buyerEmail).maybeSingle();
        if (profile) {
          await supabaseAdmin
            .from('landing_ab_sessions')
            .update({ 
              converted: true, 
              converted_at: new Date().toISOString(),
              conversion_type: 'subscription'
            })
            .eq('converted', false)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        }
      } catch (abError) {
        console.error('[KIWIFY] A/B conversion tracking error (non-fatal):', abError);
      }
    }

    return new Response(JSON.stringify({ received: true, action: actionTaken, plan: newPlanType, status: newStatus }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[KIWIFY] Error:', error);
    try { await supabaseAdmin.from('webhook_logs').insert({ email: 'error', evento: 'exception', produto: 'unknown', status: 'error', error_message: error instanceof Error ? error.message : String(error), provider: 'kiwify' }); } catch {}
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
