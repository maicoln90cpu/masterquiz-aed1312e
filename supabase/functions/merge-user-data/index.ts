import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = getTraceId(req);
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('UNAUTHORIZED', 'Authorization header ausente', traceId, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return errorResponse('UNAUTHORIZED', 'Token inválido', traceId, corsHeaders);
    }

    const newUserId = user.id;
    const userEmail = user.email;

    if (!userEmail) {
      return okResponse({ merged: false, reason: 'no_email' }, traceId, corsHeaders);
    }

    // Service role client for admin operations
    const supabase = createClient(supabaseUrl, serviceKey);

    // Search for old profile (imported via CSV) with same email but different ID
    const { data: oldProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .neq('id', newUserId);

    if (searchError) {
      console.error('Error searching old profiles:', searchError);
      return errorResponse('INTERNAL_ERROR', searchError.message, traceId, corsHeaders);
    }

    if (!oldProfiles || oldProfiles.length === 0) {
      return okResponse({ merged: false, reason: 'no_old_profile' }, traceId, corsHeaders);
    }

    const oldProfile = oldProfiles[0];
    const oldUserId = oldProfile.id;
    const tablesUpdated: string[] = [];

    console.log(`[MERGE] Merging old user ${oldUserId} into new user ${newUserId} (email: ${userEmail})`);

    // Tables with user_id to update
    const tablesToUpdate = [
      'quizzes',
      'user_subscriptions',
      'quiz_tags',
      'user_webhooks',
      'user_integrations',
      'notification_preferences',
      'support_tickets',
      'ai_quiz_generations',
      'bunny_videos',
      'audit_logs',
      'validation_requests',
      'user_onboarding',
      'video_analytics',
      'video_usage',
      'scheduled_deletions',
      'integration_logs',
    ];

    for (const table of tablesToUpdate) {
      const { error } = await supabase
        .from(table)
        .update({ user_id: newUserId })
        .eq('user_id', oldUserId);

      if (error) {
        console.error(`[MERGE] Error updating ${table}:`, error.message);
      } else {
        tablesUpdated.push(table);
      }
    }

    // user_roles - handle duplicate conflicts
    const { data: oldRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', oldUserId);

    if (oldRoles && oldRoles.length > 0) {
      for (const roleRow of oldRoles) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: newUserId, role: roleRow.role });

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error(`[MERGE] Error inserting role ${roleRow.role}:`, insertError.message);
        }
      }
      await supabase.from('user_roles').delete().eq('user_id', oldUserId);
      tablesUpdated.push('user_roles');
    }

    // Check if new profile exists; if not, rename old profile
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', newUserId)
      .maybeSingle();

    if (!newProfile) {
      // No new profile exists — rename old profile to new user ID
      // We need raw SQL for this since we're updating the PK
      // Instead, delete old and insert new
      const { error: updateIdError } = await supabase.rpc('exec_sql', {
        sql: `UPDATE profiles SET id = '${newUserId}' WHERE id = '${oldUserId}'`
      });
      
      if (updateIdError) {
        // Fallback: insert new profile with old data, delete old
        console.log('[MERGE] Cannot update profile ID directly, using insert+delete');
        const profileData = { ...oldProfile, id: newUserId };
        delete profileData.created_at;
        delete profileData.updated_at;
        
        await supabase.from('profiles').insert(profileData);
        await supabase.from('profiles').delete().eq('id', oldUserId);
      }
      tablesUpdated.push('profiles (renamed)');
    } else {
      // Merge old profile fields into new profile (fill empty fields)
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

      // Delete orphan old profile
      await supabase.from('profiles').delete().eq('id', oldUserId);
      tablesUpdated.push('profiles (merged)');
    }

    console.log(`[MERGE] Complete. Tables updated: ${tablesUpdated.join(', ')}`);

    return okResponse({
      merged: true,
      old_user_id: oldUserId,
      new_user_id: newUserId,
      tables_updated: tablesUpdated,
    }, traceId, corsHeaders);

  } catch (err) {
    console.error('[MERGE] Unexpected error:', err);
    return errorResponse('INTERNAL_ERROR', 'Erro interno ao consolidar dados', traceId, corsHeaders);
  }
});
