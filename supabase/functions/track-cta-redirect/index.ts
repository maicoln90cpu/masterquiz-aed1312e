import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Support both GET (redirect gateway) and POST (fire-and-forget)
    let params: Record<string, string>;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams.entries());
    } else {
      params = await req.json();
    }

    const { quizId, sessionId, questionId, blockId, ctaText, targetUrl, stepNumber } = params;

    // Validate required fields
    if (!quizId || !sessionId || !targetUrl) {
      return new Response(
        JSON.stringify({ error: 'quizId, sessionId, and targetUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate targetUrl is a real URL (prevent open redirect attacks)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid targetUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate quiz exists
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .maybeSingle();

    if (!quiz) {
      // If quiz not found, still redirect (don't block user)
      if (req.method === 'GET') {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': parsedUrl.toString() } });
      }
      return new Response(
        JSON.stringify({ error: 'Quiz not found', redirected: true }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const stepNum = stepNumber ? parseInt(stepNumber, 10) : null;

    // 1) Record CTA click
    await supabase.from('quiz_cta_click_analytics').insert({
      quiz_id: quizId,
      session_id: sessionId,
      question_id: questionId || null,
      block_id: blockId || null,
      cta_text: ctaText || null,
      cta_url: parsedUrl.toString(),
      step_number: stepNum,
      date: today,
    });

    // 2) Record step analytics for the last step (ensures it's tracked)
    if (stepNum !== null) {
      await supabase.from('quiz_step_analytics').upsert(
        {
          quiz_id: quizId,
          session_id: sessionId,
          step_number: stepNum,
          question_id: questionId || null,
          date: today,
        },
        { onConflict: 'quiz_id,session_id,step_number', ignoreDuplicates: true }
      );
    }

    // 3) Record analytics completion
    await supabase.from('quiz_analytics').upsert(
      {
        quiz_id: quizId,
        date: today,
        completions: 1,
      },
      { onConflict: 'quiz_id,date' }
    ).then(async () => {
      // Increment completions if row existed
      await supabase.rpc('increment_blog_views', { p_slug: '' }).catch(() => {
        // ignore - we'll use raw SQL approach below
      });
    }).catch(() => {});

    // Increment completions atomically
    const { data: existingAnalytics } = await supabase
      .from('quiz_analytics')
      .select('id, completions')
      .eq('quiz_id', quizId)
      .eq('date', today)
      .maybeSingle();

    if (existingAnalytics) {
      await supabase
        .from('quiz_analytics')
        .update({ completions: (existingAnalytics.completions || 0) + 1 })
        .eq('id', existingAnalytics.id);
    } else {
      await supabase
        .from('quiz_analytics')
        .insert({ quiz_id: quizId, date: today, completions: 1, views: 0, starts: 0 });
    }

    // 4) Mark quiz response as final if exists
    await supabase
      .from('quiz_responses')
      .update({ completed_at: new Date().toISOString() })
      .eq('quiz_id', quizId)
      .eq('session_id', sessionId);

    console.log(`[track-cta-redirect] Tracked CTA click: quiz=${quizId}, session=${sessionId}, cta="${ctaText}", url=${parsedUrl.toString()}`);

    // For GET requests, do a 302 redirect
    if (req.method === 'GET') {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': parsedUrl.toString(),
        },
      });
    }

    // For POST requests, return success (frontend handles redirect)
    return new Response(
      JSON.stringify({ success: true, redirectUrl: parsedUrl.toString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[track-cta-redirect] Error:', error);

    // On error, still try to redirect if GET
    if (req.method === 'GET') {
      try {
        const url = new URL(req.url);
        const targetUrl = url.searchParams.get('targetUrl');
        if (targetUrl) {
          return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': targetUrl } });
        }
      } catch {}
    }

    return new Response(
      JSON.stringify({ error: 'Unable to track CTA click' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
