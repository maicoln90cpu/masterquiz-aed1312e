import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * NOTA P11: GET retorna 302 (gateway de redirect) — não envelopável.
 * Apenas o ramo POST usa envelope { ok, data, error, traceId }.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);
  const isGet = req.method === 'GET';

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let params: Record<string, string>;

    if (isGet) {
      const url = new URL(req.url);
      params = Object.fromEntries(url.searchParams.entries());
    } else {
      params = await req.json();
    }

    const { quizId, sessionId, questionId, blockId, ctaText, targetUrl, stepNumber } = params;

    if (!quizId || !sessionId || !targetUrl) {
      if (isGet) {
        return new Response(JSON.stringify({ error: 'quizId, sessionId, and targetUrl are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return errorResponse('VALIDATION_FAILED', 'quizId, sessionId, and targetUrl are required', traceId, corsHeaders);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      if (isGet) {
        return new Response(JSON.stringify({ error: 'Invalid targetUrl' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return errorResponse('VALIDATION_FAILED', 'Invalid targetUrl', traceId, corsHeaders);
    }

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .maybeSingle();

    if (!quiz) {
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': parsedUrl.toString() } });
      }
      return errorResponse('NOT_FOUND', 'Quiz not found', traceId, corsHeaders);
    }

    const today = new Date().toISOString().split('T')[0];
    const stepNum = stepNumber ? parseInt(stepNumber, 10) : null;

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

    await supabase
      .from('quiz_responses')
      .update({ completed_at: new Date().toISOString() })
      .eq('quiz_id', quizId)
      .eq('session_id', sessionId);

    console.log(`[track-cta-redirect] OK: quiz=${quizId}, session=${sessionId}, cta="${ctaText}", url=${parsedUrl.toString()}`);

    if (isGet) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': parsedUrl.toString(), 'x-trace-id': traceId },
      });
    }

    return okResponse({ redirectUrl: parsedUrl.toString() }, traceId, corsHeaders);
  } catch (error) {
    console.error('[track-cta-redirect] Error:', error);

    if (isGet) {
      try {
        const url = new URL(req.url);
        const targetUrl = url.searchParams.get('targetUrl');
        if (targetUrl) {
          return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': targetUrl } });
        }
      } catch { /* ignore */ }
    }

    return errorResponse('INTERNAL_ERROR', 'Unable to track CTA click', traceId, corsHeaders);
  }
});
