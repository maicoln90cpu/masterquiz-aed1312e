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

    const { user_id, plan_type, quiz_limit, response_limit, status, payment_confirmed } = await req.json();

    if (!user_id || !plan_type) {
      return new Response(JSON.stringify({ error: 'user_id and plan_type required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ADMIN-UPDATE-SUB] Admin ${callerId} updating user ${user_id} to plan ${plan_type}`);

    const updateData: Record<string, any> = {
      plan_type,
      updated_at: new Date().toISOString(),
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
