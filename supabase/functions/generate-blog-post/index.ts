import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PREFIX = "GENERATE-BLOG-POST";

// Cost per 1M tokens (USD)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
};

// Gemini image cost estimate per request
const IMAGE_COST_USD = 0.002; // Nano Banana approximate cost

const DEFAULT_TOPICS = [
  "Como quizzes interativos aumentam a conversão de leads em 300%",
  "Funil de vendas com quiz: o segredo dos infoprodutores de sucesso",
  "Quiz de qualificação vs formulário tradicional: qual converte mais?",
  "7 tipos de quiz para cada etapa do funil de vendas",
  "Como usar copywriting persuasivo em quizzes interativos",
  "VSL + Quiz: a combinação que triplica o checkout",
  "Segmentação de leads com quiz: personalize sua oferta",
  "Quiz para e-commerce: aumente o ticket médio com recomendações",
  "Marketing digital em 2025: por que quizzes são tendência",
  "Como criar um quiz de diagnóstico que vende no automático",
  "Gestão de tráfego pago com quiz: reduza o CPA em 40%",
  "Lead scoring com quiz: identifique clientes prontos para comprar",
  "Quiz gamificado: como engajar e converter ao mesmo tempo",
  "Estratégias de remarketing usando dados de quiz",
  "Como quizzes melhoram a intenção de checkout do lead",
  "Landing page com quiz integrado: melhores práticas",
  "Quiz para nicho de saúde e bem-estar: exemplos práticos",
  "Automação de marketing com quizzes: do lead ao cliente",
  "ROI de quizzes interativos: dados e cases reais",
  "Como o MasterQuiz transforma visitantes em compradores qualificados",
];

const DEFAULT_SYSTEM_PROMPT = `Você é um redator sênior especializado em marketing digital, funis de vendas e quizzes interativos.

Sua missão é criar artigos de blog otimizados para SEO que posicionem o MasterQuiz como a melhor ferramenta de quiz interativo para qualificação de leads e aumento de conversões.

REGRAS OBRIGATÓRIAS:
1. Estrutura SEO: Use H1 único (título), hierarquia H2/H3, listas, parágrafos curtos (max 3 linhas)
2. Tom: Profissional mas acessível, com dados e exemplos práticos
3. Extensão: Mínimo 1500 palavras, ideal 2000+
4. Internal linking: Inclua pelo menos 3 links internos naturais:
   - [MasterQuiz](https://masterquiz.lovable.app) - página principal
   - [Preços](https://masterquiz.lovable.app/precos) - página de planos
   - [FAQ](https://masterquiz.lovable.app/faq) - perguntas frequentes
   - [Blog](https://masterquiz.lovable.app/blog) - outros artigos
5. CTA: Inclua CTAs naturais ao longo do texto incentivando o leitor a criar seu quiz grátis
6. Sempre mencione o MasterQuiz como solução quando relevante
7. Use dados, estatísticas e exemplos para dar autoridade
8. Inclua uma seção FAQ com 3-5 perguntas frequentes ao final

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título do artigo (max 60 chars para SEO)",
  "meta_title": "Meta title otimizado (max 60 chars)",
  "meta_description": "Meta description persuasiva (max 155 chars)",
  "excerpt": "Resumo do artigo (max 160 chars)",
  "content": "Conteúdo completo em HTML com tags h2, h3, p, ul, li, a, strong, em",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "categories": ["Marketing Digital", "Funil de Vendas"],
  "tags": ["quiz", "leads", "conversão"],
  "faq": [
    {"question": "Pergunta?", "answer": "Resposta completa."},
    {"question": "Outra pergunta?", "answer": "Outra resposta."}
  ],
  "reading_time_min": 8
}`;

const DEFAULT_IMAGE_PROMPT = `Generate an image: A ultra-realistic, professional hero image for a blog article about "{{topic}}". 
Modern, clean, vibrant colors, professional business/marketing aesthetic. 
Editorial quality, 16:9 aspect ratio, suitable for a blog header. Visual elements related to digital marketing, data analytics, or interactive quizzes.
No text overlay. Ultra high resolution.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const logId = crypto.randomUUID();
  let postId: string | null = null;

  try {
    // Parse optional body
    let requestTopic: string | undefined;
    try {
      const body = await req.json();
      requestTopic = body?.topic;
    } catch { /* no body is fine */ }

    // 1. Load settings
    const { data: settings } = await supabase
      .from('blog_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const aiModel = settings?.ai_model || 'gpt-4o';
    const imageModel = settings?.image_model || 'google/gemini-2.5-flash-image';
    const defaultAuthor = settings?.default_author || 'MasterQuiz';
    const autoPublish = settings?.auto_publish ?? false;
    const categoriesList = (settings?.categories_list as string[]) || [];
    const topicsPool = (settings?.topics_pool as string[]) || [];
    const systemPrompt = settings?.system_prompt || DEFAULT_SYSTEM_PROMPT;
    const imagePromptTemplate = settings?.image_prompt_template || DEFAULT_IMAGE_PROMPT;

    // 2. Pick topic
    const allTopics = topicsPool.length > 0 ? topicsPool : DEFAULT_TOPICS;
    const topic = requestTopic || allTopics[Math.floor(Math.random() * allTopics.length)];

    console.log(`${PREFIX} Generating article about: "${topic}" using model: ${aiModel}`);

    // 3. Create initial log entry
    await supabase.from('blog_generation_logs').insert({
      id: logId,
      model_used: aiModel,
      status: 'generating',
      generation_type: 'text',
    });

    // 4. Generate article text via OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!openaiKey && !lovableKey) {
      throw new Error('Neither OPENAI_API_KEY nor LOVABLE_API_KEY is configured');
    }

    const finalPrompt = systemPrompt
      .replace(/\{\{topic\}\}/g, topic)
      .replace(/\{\{categories\}\}/g, categoriesList.join(', ') || 'Marketing Digital, Funil de Vendas')
      .replace(/\{\{author\}\}/g, defaultAuthor)
      .replace(/\{\{keywords\}\}/g, 'quiz, marketing digital, funil de vendas, leads, conversão')
      .replace(/\{\{base_url\}\}/g, 'https://masterquiz.lovable.app');

    let textResult: any;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    if (openaiKey) {
      // Use OpenAI directly
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: 'system', content: finalPrompt },
            { role: 'user', content: `Escreva um artigo completo e detalhado sobre: "${topic}". Responda APENAS com o JSON no formato especificado.` },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
      });

      if (!openaiResponse.ok) {
        const errText = await openaiResponse.text();
        console.error(`${PREFIX} OpenAI error: ${openaiResponse.status}`, errText);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      promptTokens = openaiData.usage?.prompt_tokens || 0;
      completionTokens = openaiData.usage?.completion_tokens || 0;
      totalTokens = openaiData.usage?.total_tokens || 0;

      const rawContent = openaiData.choices?.[0]?.message?.content || '';
      textResult = JSON.parse(rawContent);
    } else {
      // Fallback to Lovable AI Gateway
      console.log(`${PREFIX} Using Lovable AI Gateway as fallback`);
      const gatewayResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: finalPrompt },
            { role: 'user', content: `Escreva um artigo completo e detalhado sobre: "${topic}". Responda APENAS com o JSON no formato especificado.` },
          ],
          temperature: 0.7,
        }),
      });

      if (!gatewayResponse.ok) {
        const errText = await gatewayResponse.text();
        console.error(`${PREFIX} Lovable AI error: ${gatewayResponse.status}`, errText);
        throw new Error(`Lovable AI error: ${gatewayResponse.status}`);
      }

      const gatewayData = await gatewayResponse.json();
      promptTokens = gatewayData.usage?.prompt_tokens || 0;
      completionTokens = gatewayData.usage?.completion_tokens || 0;
      totalTokens = gatewayData.usage?.total_tokens || 0;

      const rawContent = gatewayData.choices?.[0]?.message?.content || '';
      // Clean markdown fences if present
      const cleanedContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      textResult = JSON.parse(cleanedContent);
    }

    console.log(`${PREFIX} Article generated: "${textResult.title}" (${totalTokens} tokens)`);

    // 5. Calculate text cost
    const modelCost = MODEL_COSTS[aiModel] || MODEL_COSTS['gpt-4o'];
    const textCostUsd = ((promptTokens * modelCost.input) + (completionTokens * modelCost.output)) / 1_000_000;

    // 6. Generate slug
    const slug = textResult.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    // Ensure unique slug
    const { data: existingSlug } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    // 7. Generate image via Gemini (Lovable AI Gateway)
    let featuredImageUrl: string | null = null;
    let imageCostUsd = 0;

    if (lovableKey) {
      try {
        console.log(`${PREFIX} Generating image via ${imageModel}...`);

        const imagePrompt = imagePromptTemplate
          .replace(/\{\{topic\}\}/g, topic)
          .replace(/\{topic\}/g, topic);
        console.log(`${PREFIX} Image prompt (first 200 chars): ${imagePrompt.substring(0, 200)}`);

        const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: imageModel,
            messages: [
              { role: 'user', content: imagePrompt },
            ],
            modalities: ['image', 'text'],
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const message = imageData.choices?.[0]?.message;
          
          let base64Data: string | null = null;
          let mimeType = 'image/webp';

          // Strategy 1: images array (Lovable gateway standard format)
          if (message?.images && Array.isArray(message.images)) {
            for (const img of message.images) {
              const imgUrl = img.image_url?.url || img.url;
              if (imgUrl && imgUrl.startsWith('data:image/')) {
                const dataUrlMatch = imgUrl.match(/data:image\/([^;]+);base64,(.+)/s);
                if (dataUrlMatch) {
                  mimeType = `image/${dataUrlMatch[1]}`;
                  base64Data = dataUrlMatch[2].replace(/\s/g, '');
                  break;
                }
              }
            }
          }

          // Strategy 2: Content as string with data URL
          if (!base64Data && typeof message?.content === 'string') {
            const dataUrlMatch = message.content.match(/data:image\/([^;]+);base64,([A-Za-z0-9+/=\s]+)/);
            if (dataUrlMatch) {
              mimeType = `image/${dataUrlMatch[1]}`;
              base64Data = dataUrlMatch[2].replace(/\s/g, '');
            }
          }

          // Strategy 3: Content array with image_url type
          if (!base64Data && Array.isArray(message?.content)) {
            for (const part of message.content) {
              if (part.type === 'image_url' && part.image_url?.url) {
                const urlMatch = part.image_url.url.match(/data:image\/([^;]+);base64,(.+)/s);
                if (urlMatch) {
                  mimeType = `image/${urlMatch[1]}`;
                  base64Data = urlMatch[2].replace(/\s/g, '');
                }
              }
            }
          }

          // Strategy 4: Parts array (Gemini native)
          if (!base64Data && message?.parts && Array.isArray(message.parts)) {
            for (const part of message.parts) {
              if (part.inline_data?.data) {
                base64Data = part.inline_data.data;
                mimeType = part.inline_data.mime_type || mimeType;
                break;
              }
            }
          }

          if (base64Data) {
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            console.log(`${PREFIX} Image decoded: ${imageBytes.length} bytes (${mimeType})`);

            const bunnyApiKey = Deno.env.get('BUNNY_STORAGE_ZONE_PASSWORD');
            const bunnyZone = Deno.env.get('BUNNY_STORAGE_ZONE_NAME');
            const bunnyCdnHost = Deno.env.get('BUNNY_CDN_HOSTNAME');

            if (bunnyApiKey && bunnyZone) {
              const ext = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'webp';
              const fileName = `blog/${finalSlug}.${ext}`;
              
              const uploadResponse = await fetch(
                `https://storage.bunnycdn.com/${bunnyZone}/${fileName}`,
                {
                  method: 'PUT',
                  headers: {
                    'AccessKey': bunnyApiKey,
                    'Content-Type': mimeType,
                  },
                  body: imageBytes,
                }
              );

              if (uploadResponse.ok) {
                const cdnHost = bunnyCdnHost || `${bunnyZone}.b-cdn.net`;
                featuredImageUrl = `https://${cdnHost}/${fileName}`;
                imageCostUsd = IMAGE_COST_USD;
                console.log(`${PREFIX} Image uploaded: ${featuredImageUrl}`);
              } else {
                const uploadErr = await uploadResponse.text();
                console.error(`${PREFIX} Bunny upload failed: ${uploadResponse.status}`, uploadErr);
              }
            }
          } else {
            const fullResponse = JSON.stringify(imageData.choices?.[0]?.message || {}).substring(0, 2000);
            console.warn(`${PREFIX} No image data found. Full message: ${fullResponse}`);
          }
        } else {
          const errBody = await imageResponse.text();
          console.error(`${PREFIX} Image generation failed: ${imageResponse.status}`, errBody);
        }
      } catch (imgErr) {
        console.error(`${PREFIX} Image generation error:`, imgErr);
      }
    }

    // 8. Build FAQ schema
    const faqSchema = textResult.faq?.length > 0 ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': textResult.faq.map((f: any) => ({
        '@type': 'Question',
        'name': f.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.answer,
        },
      })),
    } : null;

    // 9. Build internal links data
    const internalLinks = [
      { url: 'https://masterquiz.lovable.app', text: 'MasterQuiz' },
      { url: 'https://masterquiz.lovable.app/precos', text: 'Planos e Preços' },
      { url: 'https://masterquiz.lovable.app/faq', text: 'FAQ' },
      { url: 'https://masterquiz.lovable.app/blog', text: 'Blog' },
    ];

    // 10. Insert blog post
    const totalCost = textCostUsd + imageCostUsd;

    const postPayload = {
      title: textResult.title || topic,
      slug: finalSlug,
      content: textResult.content || '',
      excerpt: textResult.excerpt || null,
      meta_title: textResult.meta_title || textResult.title,
      meta_description: textResult.meta_description || textResult.excerpt || null,
      seo_keywords: textResult.seo_keywords || [],
      categories: textResult.categories || categoriesList,
      tags: textResult.tags || [],
      featured_image_url: featuredImageUrl,
      og_image_url: featuredImageUrl,
      author_name: defaultAuthor,
      reading_time_min: textResult.reading_time_min || 8,
      is_ai_generated: true,
      model_used: aiModel,
      generation_cost_usd: textCostUsd,
      image_generation_cost_usd: imageCostUsd,
      faq_schema: faqSchema,
      internal_links: internalLinks,
      status: autoPublish ? 'published' : 'draft',
      published_at: autoPublish ? new Date().toISOString() : null,
    };

    const { data: newPost, error: postError } = await supabase
      .from('blog_posts')
      .insert(postPayload)
      .select('id, title, slug, status')
      .single();

    if (postError) {
      console.error(`${PREFIX} Post insert error:`, postError);
      throw new Error(`Failed to save post: ${postError.message}`);
    }

    postId = newPost.id;

    // 11. Update generation log
    await supabase.from('blog_generation_logs').update({
      post_id: postId,
      status: 'success',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      text_cost_usd: textCostUsd,
      image_cost_usd: imageCostUsd,
      total_cost_usd: totalCost,
    }).eq('id', logId);

    console.log(`${PREFIX} ✅ Post created: "${newPost.title}" (${newPost.slug}) - $${totalCost.toFixed(4)}`);

    return new Response(JSON.stringify({
      success: true,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status,
      postId: newPost.id,
      cost: {
        text: textCostUsd,
        image: imageCostUsd,
        total: totalCost,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`${PREFIX} ❌ Error:`, error);

    // Log failure
    await supabase.from('blog_generation_logs').update({
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      post_id: postId,
    }).eq('id', logId).catch(() => {});

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
