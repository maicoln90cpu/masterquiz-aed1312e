import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PREFIX = "BLOG-CRON-TRIGGER";

// Map schedule values to interval in hours
function getIntervalHours(schedule: string): number | null {
  const map: Record<string, number> = {
    every_12h: 12,
    every_24h: 24,
    every_36h: 36,
    every_48h: 48,
    every_72h: 72,
    daily: 24,
    weekly: 168,
    biweekly: 336,
    monthly: 720,
  };
  return map[schedule] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check if blog generation is active
    const { data: settings } = await supabase
      .from('blog_settings')
      .select('is_active, cron_schedule')
      .limit(1)
      .maybeSingle();

    if (!settings?.is_active) {
      console.log(`${PREFIX} Blog generation is disabled. Skipping.`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'inactive' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check interval: compare last AI post timestamp with cron_schedule
    const intervalHours = getIntervalHours(settings.cron_schedule || 'weekly');

    if (intervalHours) {
      const { data: lastPost } = await supabase
        .from('blog_posts')
        .select('created_at')
        .eq('is_ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastPost) {
        const lastTime = new Date(lastPost.created_at).getTime();
        const now = Date.now();
        const elapsedHours = (now - lastTime) / (1000 * 60 * 60);

        if (elapsedHours < intervalHours) {
          console.log(`${PREFIX} Interval not reached. Elapsed: ${elapsedHours.toFixed(1)}h / Required: ${intervalHours}h. Skipping.`);
          return new Response(JSON.stringify({ success: true, skipped: true, reason: 'interval_not_reached', elapsed_hours: +elapsedHours.toFixed(1), required_hours: intervalHours }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // 3. Check daily limit (max 5 posts per day)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .eq('is_ai_generated', true);

    if ((todayCount ?? 0) >= 5) {
      console.log(`${PREFIX} Daily limit reached (${todayCount} posts today). Skipping.`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: 'daily_limit' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Call generate-blog-post function
    console.log(`${PREFIX} Triggering blog post generation...`);

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

    const generateResponse = await fetch(
      `${supabaseUrl}/functions/v1/generate-blog-post`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({}),
      }
    );

    const result = await generateResponse.json();

    if (!generateResponse.ok) {
      console.error(`${PREFIX} Generation failed:`, result);
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`${PREFIX} ✅ Post generated: "${result.title}" (cost: $${result.cost?.total?.toFixed(4)})`);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`${PREFIX} ❌ Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
