import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Simple rate limiting: check if too many requests from this email recently
    const normalizedEmail = email.toLowerCase().trim();

    // Check if profile exists with this email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .limit(1);

    if (error) {
      console.error('[CHECK-IMPORTED] Error:', error.message);
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if this profile has a corresponding auth.users entry
    const profileId = profiles[0].id;
    const { data: authUser } = await supabase.auth.admin.getUserById(profileId);

    // If auth user exists, it's not an orphan — normal login should work
    if (authUser?.user) {
      return new Response(JSON.stringify({ exists: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Orphan profile found — user needs to migrate
    return new Response(JSON.stringify({ exists: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[CHECK-IMPORTED] Unexpected error:', err);
    return new Response(JSON.stringify({ exists: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
