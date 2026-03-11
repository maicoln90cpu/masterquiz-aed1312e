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

function mapProductToPlanType(produto: string): 'free' | 'paid' | 'partner' | 'premium' {
  const p = produto.toLowerCase();
  if (p.includes('premium')) return 'premium';
  if (p.includes('partner') || p.includes('parceiro')) return 'partner';
  if (p.includes('pro') || p.includes('profissional') || p.includes('paid')) return 'paid';
  return 'paid';
}

function isActivationEvent(e: string): boolean {
  return ['order_paid','subscription_created','subscription_renewed','approved','paid'].some(a => e.toLowerCase().includes(a));
}

function isCancellationEvent(e: string): boolean {
  return ['subscription_cancelled','refund_requested','chargeback','cancelled','canceled','refund'].some(a => e.toLowerCase().includes(a));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    let rawBody;
    try { rawBody = await req.json(); } catch { 
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = rawBody;
    const evento = body.event || body.order_status || body.subscription_status || 'unknown';
    const customer = body.Customer || body.customer || body.data?.customer || {};
    const buyerEmail = (customer.email || body.email || body.data?.buyer?.email)?.toLowerCase();
    const product = body.Product || body.product || body.data?.product || {};
    const produto = product.name || product.product_name || body.product_name || 'unknown';

    console.log(`[KIWIFY] Event: ${evento}, email: ${buyerEmail ? '***' : 'none'}, product: ${produto}`);

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
    else if (isActivationEvent(evento)) { newPlanType = mapProductToPlanType(produto); newStatus = 'active'; actionTaken = 'activate_subscription'; }
    else {
      await supabaseAdmin.from('webhook_logs').insert({ email: buyerEmail, evento, produto, status: 'ignored', error_message: `Unhandled: ${evento}`, provider: 'kiwify' });
      return new Response(JSON.stringify({ received: true, action: 'logged' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: planData } = await supabaseAdmin.from('subscription_plans').select('quiz_limit, response_limit').eq('plan_type', newPlanType).eq('is_active', true).maybeSingle();
    const quizLimit = planData?.quiz_limit || (newPlanType === 'free' ? 3 : 10);
    const responseLimit = planData?.response_limit || (newPlanType === 'free' ? 100 : 1000);

    // ✅ ETAPA 3: Setar payment_confirmed=true em ativações
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

    return new Response(JSON.stringify({ received: true, action: actionTaken, plan: newPlanType, status: newStatus }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[KIWIFY] Error:', error);
    try { await supabaseAdmin.from('webhook_logs').insert({ email: 'error', evento: 'exception', produto: 'unknown', status: 'error', error_message: error instanceof Error ? error.message : String(error), provider: 'kiwify' }); } catch {}
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
