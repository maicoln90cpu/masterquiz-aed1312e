import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PREFIX = "REGENERATE-BLOG-ASSET";
const IMAGE_COST_USD = 0.002;

const DEFAULT_IMAGE_PROMPT = `Generate an image: A cinematic, photorealistic hero image for a blog article about "{{topic}}".

CAMERA SIMULATION: Shot on Canon EOS R5, 35mm f/1.4L lens, shallow depth of field, bokeh background.
LIGHTING: Golden hour natural light streaming from left side, complemented by subtle teal LED accent lighting from screens and monitors.
COLOR GRADING: Cinematic teal and orange color grading, rich shadows, warm highlights, professional post-processing.
COMPOSITION: Rule of thirds, leading lines, diagonal composition. Subject in focus with soft background blur.
SCENE: A high-end modern workspace or creative studio environment. Include subtle elements related to the topic: sleek monitors showing dashboard analytics, interactive UI elements, data visualizations, or marketing metrics. Clean desk with premium tech accessories.
ATMOSPHERE: Professional, inspiring, premium feel. Depth and dimension through layered elements in foreground and background.
STYLE: Editorial photography quality, magazine cover worthy. Ultra high resolution, 16:9 aspect ratio.

ABSOLUTE RULES:
- NO text, NO words, NO letters, NO watermarks, NO logos anywhere in the image
- NO cartoons, NO illustrations, NO flat design, NO clip art
- ONLY photorealistic, camera-quality imagery
- NO people faces (avoid AI face artifacts), use hands/silhouettes if needed
- Focus on environment, objects, screens, and atmosphere`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { postId, type } = await req.json();
    if (!postId || !type) {
      return new Response(JSON.stringify({ error: 'postId and type required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch post
    const { data: post, error: postError } = await supabase.from('blog_posts').select('*').eq('id', postId).single();
    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch settings
    const { data: settings } = await supabase.from('blog_settings').select('*').limit(1).maybeSingle();
    const imageModel = settings?.image_model || 'google/gemini-2.5-flash-image';

    // Fetch image prompt with rotation (exclude last used)
    let imagePromptTemplate = settings?.image_prompt_template || DEFAULT_IMAGE_PROMPT;
    let selectedPromptId: string | null = null;
    try {
      const { data: imagePrompts } = await supabase
        .from('blog_image_prompts')
        .select('*')
        .eq('is_active', true)
        .order('last_used_at', { ascending: true, nullsFirst: true });

      if (imagePrompts && imagePrompts.length > 0) {
        let candidates = imagePrompts;
        if (imagePrompts.length > 1) {
          const sorted = [...imagePrompts].sort((a, b) => {
            if (!a.last_used_at) return -1;
            if (!b.last_used_at) return 1;
            return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime();
          });
          candidates = imagePrompts.filter(p => p.id !== sorted[0].id);
        }
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        imagePromptTemplate = selected.prompt_template;
        selectedPromptId = selected.id;
        console.log(`${PREFIX} Using image prompt style: "${selected.name}"`);
      }
    } catch (e) {
      console.warn(`${PREFIX} Image prompt rotation fallback:`, e);
    }

    if (type === 'image') {
      return await regenerateImage(supabase, post, imagePromptTemplate, imageModel, selectedPromptId);
    } else if (type === 'content') {
      return await regenerateContent(supabase, post, settings);
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(`${PREFIX} Error:`, err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function regenerateImage(supabase: any, post: any, imagePromptTemplate: string, imageModel: string, selectedPromptId: string | null = null) {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableKey) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const topic = post.title;
  const imagePrompt = imagePromptTemplate.replace(/\{\{topic\}\}/g, topic).replace(/\{topic\}/g, topic);

  console.log(`${PREFIX} Generating image for post: ${post.id}`);

  const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: imageModel,
      messages: [{ role: 'user', content: imagePrompt }],
      modalities: ['image', 'text'],
    }),
  });

  if (!imageResponse.ok) {
    const errBody = await imageResponse.text();
    console.error(`${PREFIX} Image gen failed:`, errBody);
    return new Response(JSON.stringify({ error: 'Image generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const imageData = await imageResponse.json();
  const message = imageData.choices?.[0]?.message;

  let base64Data: string | null = null;
  let mimeType = 'image/webp';

  // Strategy 1: images array
  if (message?.images && Array.isArray(message.images)) {
    for (const img of message.images) {
      const imgUrl = img.image_url?.url || img.url;
      if (imgUrl?.startsWith('data:image/')) {
        const match = imgUrl.match(/data:image\/([^;]+);base64,(.+)/s);
        if (match) { mimeType = `image/${match[1]}`; base64Data = match[2].replace(/\s/g, ''); break; }
      }
    }
  }

  // Strategy 2: Content string
  if (!base64Data && typeof message?.content === 'string') {
    const match = message.content.match(/data:image\/([^;]+);base64,([A-Za-z0-9+/=\s]+)/);
    if (match) { mimeType = `image/${match[1]}`; base64Data = match[2].replace(/\s/g, ''); }
  }

  // Strategy 3: Content array
  if (!base64Data && Array.isArray(message?.content)) {
    for (const part of message.content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const match = part.image_url.url.match(/data:image\/([^;]+);base64,(.+)/s);
        if (match) { mimeType = `image/${match[1]}`; base64Data = match[2].replace(/\s/g, ''); }
      }
    }
  }

  if (!base64Data) {
    return new Response(JSON.stringify({ error: 'No image data in response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  const bunnyApiKey = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');
  const bunnyZone = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
  const bunnyCdnHost = Deno.env.get('BUNNY_CDN_HOSTNAME');

  if (!bunnyApiKey || !bunnyZone) {
    return new Response(JSON.stringify({ error: 'Bunny CDN not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'webp';
  const fileName = `blog/${post.slug}-${Date.now()}.${ext}`;

  const uploadResponse = await fetch(`https://storage.bunnycdn.com/${bunnyZone}/${fileName}`, {
    method: 'PUT',
    headers: { 'AccessKey': bunnyApiKey, 'Content-Type': mimeType },
    body: imageBytes,
  });

  if (!uploadResponse.ok) {
    return new Response(JSON.stringify({ error: 'Bunny upload failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const cdnHost = bunnyCdnHost || `${bunnyZone}.b-cdn.net`;
  const featuredImageUrl = `https://${cdnHost}/${fileName}`;

  await supabase.from('blog_posts').update({
    featured_image_url: featuredImageUrl,
    og_image_url: featuredImageUrl,
    image_generation_cost_usd: IMAGE_COST_USD,
  }).eq('id', post.id);

  console.log(`${PREFIX} Image regenerated: ${featuredImageUrl}`);

  return new Response(JSON.stringify({ success: true, featured_image_url: featuredImageUrl }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function regenerateContent(supabase: any, post: any, settings: any) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');

  if (!openaiKey && !lovableKey) {
    return new Response(JSON.stringify({ error: 'No AI key configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const aiModel = settings?.ai_model || 'gpt-4o';
  const systemPrompt = settings?.system_prompt || 'Você é um redator sênior especializado em marketing digital e quizzes interativos.';
  const topic = post.title;

  console.log(`${PREFIX} Regenerating content for: ${topic}`);

  const userPrompt = `Escreva um artigo completo e otimizado para SEO sobre: "${topic}"

Responda SOMENTE em JSON válido com esta estrutura:
{
  "title": "${topic}",
  "meta_title": "Meta title otimizado (max 60 chars)",
  "meta_description": "Meta description persuasiva (max 155 chars)",
  "excerpt": "Resumo do artigo (max 160 chars)",
  "content": "Conteúdo completo em HTML com tags h2, h3, p, ul, li, a, strong, em",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "categories": ["Marketing Digital"],
  "tags": ["quiz", "leads"],
  "faq": [{"question": "Pergunta?", "answer": "Resposta completa."}],
  "reading_time_min": 8
}`;

  let response;

  if (openaiKey) {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
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
      headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
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
    return new Response(JSON.stringify({ error: 'Content generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const data = await response.json();
  let rawContent = data.choices?.[0]?.message?.content || '';

  // Parse JSON
  let textResult: any;
  try {
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
    textResult = JSON.parse(jsonMatch[1].trim());
  } catch {
    console.error(`${PREFIX} Failed to parse JSON response`);
    return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Build FAQ schema
  const faqSchema = textResult.faq?.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': textResult.faq.map((f: any) => ({
      '@type': 'Question',
      'name': f.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': f.answer },
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

  console.log(`${PREFIX} Content regenerated for post: ${post.id}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
