import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'X-Content-Type-Options': 'nosniff',
};

const BodySchema = z.object({
  slug: z.string().min(1).max(255),
});

// Simple in-memory dedup (slug+ip within 30min window)
const recentViews = new Map<string, number>();
const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Known bot patterns
const BOT_PATTERNS = /bot|crawler|spider|slurp|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|semrush|ahrefs|mj12bot|dotbot|petalbot|bytespider/i;

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, ts] of recentViews) {
    if (now - ts > DEDUP_WINDOW_MS) recentViews.delete(key);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const traceId = getTraceId(req);

  if (req.method !== 'POST') {
    return errorResponse('VALIDATION_FAILED', 'Method not allowed', traceId, corsHeaders, 405);
  }

  try {
    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { slug } = parsed.data;

    // Bot detection
    const ua = req.headers.get('user-agent') || '';
    if (BOT_PATTERNS.test(ua)) {
      return okResponse({ tracked: false, reason: 'bot' }, traceId, corsHeaders);
    }

    // IP-based dedup
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('cf-connecting-ip') || 'unknown';
    const dedupKey = `${slug}:${ip}`;

    cleanupOldEntries();

    if (recentViews.has(dedupKey)) {
      return okResponse({ tracked: false, reason: 'duplicate' }, traceId, corsHeaders);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Increment views_count atomically
    const { error } = await supabase.rpc('increment_blog_views', { p_slug: slug });

    if (error) {
      // Fallback: direct update
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ views_count: supabase.rpc ? undefined : 1 })
        .eq('slug', slug);
      
      if (updateError) {
        console.error('[TRACK-BLOG-VIEW] Error:', updateError);
        return errorResponse('INTERNAL_ERROR', 'Failed to track', traceId, corsHeaders);
      }
    }

    recentViews.set(dedupKey, Date.now());

    return okResponse({ tracked: true }, traceId, corsHeaders);
  } catch (err) {
    console.error('[TRACK-BLOG-VIEW] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'Internal error', traceId, corsHeaders);
  }
});
