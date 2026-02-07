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
    const { email, password } = await req.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check orphan profile exists
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No imported account found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const oldProfileId = profiles[0].id;

    // 2. Check no auth user exists for this profile
    const { data: existingAuth } = await supabase.auth.admin.getUserById(oldProfileId);
    if (existingAuth?.user) {
      return new Response(JSON.stringify({ error: 'Account already exists, use normal login' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Also check if email is already registered in auth
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.find(u => u.email?.toLowerCase() === normalizedEmail);
    
    if (emailExists) {
      // User already has auth account - just confirm email if needed
      if (!emailExists.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(emailExists.id, {
          email_confirm: true,
        });
      }
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Account already exists and confirmed. Please login.',
        already_exists: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Create auth user with admin API (auto-confirmed)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
    });

    if (createError) {
      console.error('[MIGRATE] Error creating user:', createError.message);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = newUser.user.id;
    console.log(`[MIGRATE] Created auth user ${newUserId} for email ${normalizedEmail}`);

    // 5. Merge data from old profile to new user
    const tablesUpdated: string[] = [];
    const tablesToUpdate = [
      'quizzes', 'user_subscriptions', 'quiz_tags', 'user_webhooks',
      'user_integrations', 'notification_preferences', 'support_tickets',
      'ai_quiz_generations', 'bunny_videos', 'audit_logs', 'validation_requests',
      'user_onboarding', 'video_analytics', 'video_usage', 'scheduled_deletions',
      'integration_logs',
    ];

    for (const table of tablesToUpdate) {
      const { error } = await supabase
        .from(table)
        .update({ user_id: newUserId })
        .eq('user_id', oldProfileId);
      if (!error) tablesUpdated.push(table);
      else console.error(`[MIGRATE] Error updating ${table}:`, error.message);
    }

    // 6. Merge user_roles
    const { data: oldRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', oldProfileId);

    if (oldRoles && oldRoles.length > 0) {
      for (const roleRow of oldRoles) {
        await supabase.from('user_roles')
          .insert({ user_id: newUserId, role: roleRow.role })
          .then(({ error }) => {
            if (error && !error.message.includes('duplicate')) {
              console.error(`[MIGRATE] Role error:`, error.message);
            }
          });
      }
      await supabase.from('user_roles').delete().eq('user_id', oldProfileId);
      tablesUpdated.push('user_roles');
    }

    // 7. Handle profile: merge old into new (trigger creates new profile)
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUserId)
      .single();

    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', oldProfileId)
      .single();

    if (oldProfile) {
      if (newProfile) {
        // Merge fields from old to new
        const mergeFields: Record<string, unknown> = {};
        if (!newProfile.full_name && oldProfile.full_name) mergeFields.full_name = oldProfile.full_name;
        if (!newProfile.whatsapp && oldProfile.whatsapp) mergeFields.whatsapp = oldProfile.whatsapp;
        if (!newProfile.company_slug && oldProfile.company_slug) mergeFields.company_slug = oldProfile.company_slug;
        if (!newProfile.facebook_pixel_id && oldProfile.facebook_pixel_id) mergeFields.facebook_pixel_id = oldProfile.facebook_pixel_id;
        if (!newProfile.gtm_container_id && oldProfile.gtm_container_id) mergeFields.gtm_container_id = oldProfile.gtm_container_id;
        if (!newProfile.email && oldProfile.email) mergeFields.email = oldProfile.email;

        if (Object.keys(mergeFields).length > 0) {
          await supabase.from('profiles').update(mergeFields).eq('id', newUserId);
        }
        await supabase.from('profiles').delete().eq('id', oldProfileId);
        tablesUpdated.push('profiles (merged)');
      } else {
        // Rename old profile to new ID
        const profileData = { ...oldProfile, id: newUserId };
        delete (profileData as any).created_at;
        delete (profileData as any).updated_at;
        await supabase.from('profiles').insert(profileData);
        await supabase.from('profiles').delete().eq('id', oldProfileId);
        tablesUpdated.push('profiles (renamed)');
      }
    }

    console.log(`[MIGRATE] Complete. Tables: ${tablesUpdated.join(', ')}`);

    return new Response(JSON.stringify({
      success: true,
      user_id: newUserId,
      tables_updated: tablesUpdated,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[MIGRATE] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
