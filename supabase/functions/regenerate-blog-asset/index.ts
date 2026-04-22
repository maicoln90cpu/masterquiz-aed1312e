import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PREFIX = 'REGENERATE-BLOG-ASSET';
const IMAGE_COST_USD = 0.002;

const BodySchema = z.object({
  postId: z.string().uuid(),
  type: z.enum(['image', 'content']),
});

const DEFAULT_IMAGE_PROMPT = `Generate an image: A cinematic, photorealistic hero image for a blog article about "{{topic}}".
CAMERA SIMULATION: Shot on Canon EOS R5, 35mm f/1.4L lens, shallow depth of field, bokeh background.
LIGHTING: Golden hour natural light streaming from left side, complemented by subtle teal LED accent lighting from screens and monitors.
COLOR GRADING: Cinematic teal and orange color grading, rich shadows, warm highlights, professional post-processing.
COMPOSITION: Rule of thirds, leading lines, diagonal composition.
SCENE: A high-end modern workspace or creative studio environment.
ATMOSPHERE: Professional, inspiring, premium feel.
STYLE: Editorial photography quality. Ultra high resolution, 16:9 aspect ratio.
ABSOLUTE RULES: NO text, NO watermarks, NO logos, NO cartoons, ONLY photorealistic, NO people faces.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const traceId = getTraceId(req);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('UNAUTHORIZED', 'Authorization required', traceId, corsHeaders);

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) return errorResponse('UNAUTHORIZED', 'Invalid token', traceId, corsHeaders);

    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { postId, type } = parsed.data;

    const { data: post } = await supabase.from('blog_posts').select('*').eq('id', postId).maybeSingle();
    if (!post) return errorResponse('NOT_FOUND', 'Post not found', traceId, corsHeaders);

    const { data: settings } = await supabase.from('blog_settings').select('*').limit(1).maybeSingle();
    const imageModel = settings?.image_model || 'google/gemini-2.5-flash-image';

    let imagePromptTemplate = settings?.image_prompt_template || DEFAULT_IMAGE_PROMPT;
    let selectedPromptId: string | null = null;
    try {
      const { data: imagePrompts } = await supabase
        .from('blog_image_prompts').select('*').eq('is_active', true)
        .order('last_used_at', { ascending: true, nullsFirst: true });
      if (imagePrompts && imagePrompts.length > 0) {
        let candidates = imagePrompts;
        if (imagePrompts.length > 1) {
          const sorted = [...imagePrompts].sort((a, b) => {
            if (!a.last_used_at) return -1;
            if (!b.last_used_at) return 1;
            return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime();
          });
          candidates = imagePrompts.filter((p) => p.id !== sorted[0].id);
        }
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        imagePromptTemplate = selected.prompt_template;
        selectedPromptId = selected.id;
      }
    } catch (e) {
      console.warn(`${PREFIX} prompt rotation fallback:`, e);
    }

    if (type === 'image') {
      return await regenerateImage(supabase, post, imagePromptTemplate, imageModel, selectedPromptId, traceId);
    }
    return await regenerateContent(supabase, post, settings, traceId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error(`${PREFIX} Error:`, message);
    return errorResponse('INTERNAL_ERROR', message, traceId, corsHeaders);
  }
});

async function regenerateImage(
  supabase: any, post: any, imagePromptTemplate: string,
  imageModel: string, selectedPromptId: string | null, traceId: string,
): Promise<Response> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableKey) return errorResponse('INTERNAL_ERROR', 'LOVABLE_API_KEY not configured', traceId, corsHeaders);

  const topic = post.title;
  const imagePrompt = imagePromptTemplate.replace(/\{\{topic\}\}/g, topic).replace(/\{topic\}/g, topic);

  const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: imageModel,
      messages: [{ role: 'user', content: imagePrompt }],
      modalities: ['image', 'text'],
    }),
  });

  if (!imageResponse.ok) {
    const errBody = await imageResponse.text();
    console.error(`${PREFIX} Image gen failed:`, errBody);
    return errorResponse('INTERNAL_ERROR', 'Image generation failed', traceId, corsHeaders);
  }

  const imageData = await imageResponse.json();
  const message = imageData.choices?.[0]?.message;
  let base64Data: string | null = null;
  let mimeType = 'image/webp';

  if (message?.images && Array.isArray(message.images)) {
    for (const img of message.images) {
      const imgUrl = img.image_url?.url || img.url;
      if (imgUrl?.startsWith('data:image/')) {
        const match = imgUrl.match(/data:image\/([^;]+);base64,(.+)/s);
        if (match) { mimeType = `image/${match[1]}`; base64Data = match[2].replace(/\s/g, ''); break; }
      }
    }
  }
  if (!base64Data && typeof message?.content === 'string') {
    const match = message.content.match(/data:image\/([^;]+);base64,([A-Za-z0-9+/=\s]+)/);
    if (match) { mimeType = `image/${match[1]}`; base64Data = match[2].replace(/\s/g, ''); }
  }
  if (!base64Data && Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const match = part.image_url.url.match(/data:image\/([^;]+);base64,(.+)/s);
        if (match) { mimeType = `image/${match[1]}`; base64Data = match[2].replace(/\s/g, ''); }
      }
    }
  }

  if (!base64Data) return errorResponse('INTERNAL_ERROR', 'No image data in AI response', traceId, corsHeaders);

  const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const bunnyApiKey = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');
  const bunnyZone = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
  const bunnyCdnHost = Deno.env.get('BUNNY_CDN_HOSTNAME');

  if (!bunnyApiKey || !bunnyZone) {
    return errorResponse('INTERNAL_ERROR', 'Bunny CDN not configured', traceId, corsHeaders);
  }

  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'webp';
  const fileName = `blog/${post.slug}-${Date.now()}.${ext}`;

  const uploadResponse = await fetch(`https://storage.bunnycdn.com/${bunnyZone}/${fileName}`, {
    method: 'PUT',
    headers: { AccessKey: bunnyApiKey, 'Content-Type': mimeType },
    body: imageBytes,
  });
  if (!uploadResponse.ok) return errorResponse('INTERNAL_ERROR', 'Bunny upload failed', traceId, corsHeaders);

  const cdnHost = bunnyCdnHost || `${bunnyZone}.b-cdn.net`;
  const featuredImageUrl = `https://${cdnHost}/${fileName}`;

  await supabase.from('blog_posts').update({
    featured_image_url: featuredImageUrl,
    og_image_url: featuredImageUrl,
    image_generation_cost_usd: IMAGE_COST_USD,
  }).eq('id', post.id);

  if (selectedPromptId) {
    const { data: promptData } = await supabase
      .from('blog_image_prompts').select('usage_count').eq('id', selectedPromptId).maybeSingle();
    await supabase.from('blog_image_prompts').update({
      last_used_at: new Date().toISOString(),
      usage_count: (promptData?.usage_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedPromptId);
  }

  return okResponse({ featured_image_url: featuredImageUrl }, traceId, corsHeaders);
}

async function regenerateContent(
  supabase: any, post: any, settings: any, traceId: string,
): Promise<Response> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!openaiKey && !lovableKey) {
    return errorResponse('INTERNAL_ERROR', 'No AI key configured', traceId, corsHeaders);
  }

  const aiModel = settings?.ai_model || 'gpt-4o';
  const systemPrompt = settings?.system_prompt || 'Você é um redator sênior especializado em marketing digital.';
  const topic = post.title;

  const userPrompt = `Escreva um artigo completo e otimizado para SEO sobre: "${topic}"

Responda SOMENTE em JSON válido:
{
  "title": "${topic}",
  "meta_title": "Meta title (max 60 chars)",
  "meta_description": "Meta description (max 155 chars)",
  "excerpt": "Resumo (max 160 chars)",
  "content": "HTML com h2, h3, p, ul, li, a, strong, em",
  "seo_keywords": ["k1","k2","k3","k4","k5"],
  "categories": ["Marketing Digital"],
  "tags": ["quiz","leads"],
  "faq": [{"question":"?","answer":"."}],
  "reading_time_min": 8
}`;

  let response: Response;
  if (openaiKey) {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });
  } else {
    response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`${PREFIX} Content gen failed:`, errText);
    return errorResponse('INTERNAL_ERROR', 'Content generation failed', traceId, corsHeaders);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  let textResult: any;
  try {
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
    textResult = JSON.parse(jsonMatch[1].trim());
  } catch {
    return errorResponse('INTERNAL_ERROR', 'Failed to parse AI response', traceId, corsHeaders);
  }

  const faqSchema = textResult.faq?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: textResult.faq.map((f: any) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  const updatePayload: any = {
    content: textResult.content || post.content,
    excerpt: textResult.excerpt || post.excerpt,
    meta_description: textResult.meta_description || post.meta_description,
    meta_title: textResult.meta_title || post.meta_title,
    seo_keywords: textResult.seo_keywords || post.seo_keywords,
    tags: textResult.tags || post.tags,
    categories: textResult.categories || post.categories,
    reading_time_min: textResult.reading_time_min || post.reading_time_min,
  };
  if (faqSchema) updatePayload.faq_schema = faqSchema;

  await supabase.from('blog_posts').update(updatePayload).eq('id', post.id);

  return okResponse({ updated: true, post_id: post.id }, traceId, corsHeaders);
}
