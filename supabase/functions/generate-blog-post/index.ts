import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';

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
const IMAGE_COST_USD = 0.002;

const DEFAULT_TOPICS = [
  // === Quizzes Interativos (10) ===
  "Como quizzes interativos aumentam a conversão de leads em 300%",
  "Quiz de qualificação vs formulário tradicional: qual converte mais?",
  "7 tipos de quiz para cada etapa do funil de vendas",
  "Como criar um quiz de diagnóstico que vende no automático",
  "Quiz gamificado: como engajar e converter ao mesmo tempo",
  "Landing page com quiz integrado: melhores práticas",
  "Lead scoring com quiz: identifique clientes prontos para comprar",
  "Quiz para e-commerce: aumente o ticket médio com recomendações",
  "Automação de marketing com quizzes: do lead ao cliente",
  "Como o MasterQuiz transforma visitantes em compradores qualificados",

  // === Funil de Vendas e Métricas (10) ===
  "O que é CAC (Custo de Aquisição de Cliente) e como reduzir o seu",
  "LTV vs CAC: a métrica que define se seu negócio digital é sustentável",
  "Como calcular o ROI das suas campanhas de marketing digital",
  "CPL ideal: quanto você deveria pagar por lead no seu nicho",
  "MQL vs SQL: entenda a diferença e qualifique seus leads corretamente",
  "Taxa de conversão: benchmarks por nicho e como melhorar a sua",
  "Funil de vendas completo: do topo ao fundo com estratégias práticas",
  "CTR baixo? 12 técnicas para aumentar sua taxa de cliques",
  "Como montar um funil perpétuo que vende todos os dias",
  "Métricas de vaidade vs métricas de resultado: o que realmente importa",

  // === Infoprodutos e Lançamentos (10) ===
  "Como criar e vender seu primeiro infoproduto do zero",
  "Os 7 tipos de infoprodutos mais lucrativos em 2026",
  "Estratégia de lançamento semente: valide sua ideia antes de investir",
  "Lançamento interno vs lançamento externo: qual escolher",
  "Como precificar seu curso online ou mentoria corretamente",
  "Plataformas para vender infoprodutos: Kiwify, Hotmart ou Eduzz?",
  "Upsell e downsell: como aumentar o ticket médio do seu funil",
  "Como criar uma oferta irresistível para seu produto digital",
  "Programa de afiliados: como escalar vendas sem aumentar investimento",
  "Membership e recorrência: como gerar receita previsível com infoprodutos",

  // === Tráfego Pago e Mídia (8) ===
  "Meta Ads para infoprodutores: guia completo de campanhas",
  "Google Ads vs Meta Ads: onde investir primeiro",
  "Como criar públicos lookalike que realmente convertem",
  "Remarketing inteligente: recupere leads que não compraram",
  "Quanto investir em tráfego pago quando se está começando",
  "Estrutura de campanha no Meta Ads: CBO vs ABO em 2026",
  "Como reduzir o CPA das suas campanhas em 40%",
  "Tráfego orgânico vs pago: quando e como usar cada um",

  // === Copywriting e Persuasão (6) ===
  "Gatilhos mentais: os 12 mais poderosos para vendas online",
  "Como escrever headlines que dobram sua taxa de conversão",
  "Storytelling no marketing digital: como contar histórias que vendem",
  "Copy para VSL: estrutura que converte em vídeos de vendas",
  "E-mail marketing: sequências de nutrição que convertem leads em clientes",
  "Como usar copywriting persuasivo em quizzes interativos",

  // === Marketing Digital e Estratégia (6) ===
  "Marketing de conteúdo para infoprodutores: guia prático",
  "SEO para blogs de marketing digital: como ranquear no Google",
  "Automação de marketing: ferramentas e fluxos essenciais",
  "Inteligência artificial no marketing digital: tendências para 2026",
  "Segmentação de audiência: como personalizar sua comunicação",
  "Growth hacking para negócios digitais: 10 estratégias testadas",
];

const DEFAULT_SYSTEM_PROMPT = `Você é um redator sênior especializado em marketing digital, funis de vendas, infoprodutos e quizzes interativos.

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
6. Sempre mencione o MasterQuiz como solução quando relevante (mas de forma natural, não forçada)
7. Use dados, estatísticas e exemplos para dar autoridade
8. Inclua uma seção FAQ com 3-5 perguntas frequentes ao final
9. VARIE as categorias: escreva sobre Infoprodutos, Marketing Digital, Funil de Vendas, Tráfego Pago, Copywriting, Métricas, Quizzes — não apenas sobre quizzes

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

// ── Helpers: normalize AI output ──

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeContentToHtml(content: unknown): string {
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('<') || trimmed.includes('<p>') || trimmed.includes('<h2>')) {
      return trimmed;
    }
    return trimmed.split('\n\n').filter(Boolean).map(p => `<p>${p.trim()}</p>`).join('\n');
  }

  if (content === null || content === undefined) return '';

  if (Array.isArray(content)) {
    return content.map(section => sectionToHtml(section)).join('\n');
  }

  if (typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (Array.isArray(obj.sections)) {
      return obj.sections.map(s => sectionToHtml(s)).join('\n');
    }
    const sectionKeys = Object.keys(obj).filter(k => k.startsWith('section'));
    if (sectionKeys.length > 0) {
      return sectionKeys
        .sort()
        .map(k => sectionToHtml(obj[k]))
        .join('\n');
    }
    return sectionToHtml(obj);
  }

  return String(content);
}

function sectionToHtml(section: unknown): string {
  if (!section || typeof section !== 'object') return '';
  const s = section as Record<string, unknown>;
  let html = '';

  if (s.heading) html += `<h2>${s.heading}</h2>\n`;

  if (Array.isArray(s.paragraphs)) {
    html += s.paragraphs.map((p: unknown) => `<p>${p}</p>`).join('\n');
  }
  if (typeof s.content === 'string') {
    html += `<p>${s.content}</p>\n`;
  }

  if (Array.isArray(s.subsections)) {
    for (const sub of s.subsections) {
      const ss = sub as Record<string, unknown>;
      if (ss.subheading) html += `<h3>${ss.subheading}</h3>\n`;
      if (Array.isArray(ss.paragraphs)) {
        html += ss.paragraphs.map((p: unknown) => `<p>${p}</p>`).join('\n');
      }
      if (typeof ss.content === 'string') {
        html += `<p>${ss.content}</p>\n`;
      }
    }
  }

  if (Array.isArray(s.items)) {
    html += '<ul>\n' + s.items.map((i: unknown) => `<li>${i}</li>`).join('\n') + '\n</ul>\n';
  }

  return html;
}

function ensureSeoFields(result: Record<string, unknown>, topic: string): void {
  result.content = normalizeContentToHtml(result.content);
  const contentText = stripHtmlTags(result.content as string);

  if (!result.excerpt || (typeof result.excerpt === 'string' && result.excerpt.trim() === '')) {
    result.excerpt = contentText.substring(0, 157).trim() + '...';
  }

  if (!result.meta_description || (typeof result.meta_description === 'string' && result.meta_description.trim() === '')) {
    result.meta_description = result.excerpt || contentText.substring(0, 152).trim() + '...';
  }

  if (!result.seo_keywords || !Array.isArray(result.seo_keywords) || result.seo_keywords.length === 0) {
    const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    result.seo_keywords = [...new Set(words)].slice(0, 5);
  }

  if (!result.tags || !Array.isArray(result.tags) || result.tags.length === 0) {
    result.tags = ['quiz', 'marketing digital', 'leads'];
  }

  if (!result.categories || !Array.isArray(result.categories) || result.categories.length === 0) {
    result.categories = ['Marketing Digital', 'Funil de Vendas'];
  }

  // Calculate reading_time_min from actual word count
  const wordCount = contentText.split(/\s+/).length;
  result.reading_time_min = Math.max(3, Math.ceil(wordCount / 200));
}

// ── Topic deduplication helper ──
function pickUniqueTopic(
  allTopics: string[],
  recentTitles: string[]
): string {
  // Normalize recent titles into keywords set for matching
  const recentKeywords = new Set<string>();
  for (const title of recentTitles) {
    title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4)
      .forEach(w => recentKeywords.add(w));
  }

  // Score each topic: how many of its keywords already appeared in recent titles
  const scored = allTopics.map(topic => {
    const words = topic.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    const overlap = words.filter(w => recentKeywords.has(w)).length;
    const overlapRatio = words.length > 0 ? overlap / words.length : 0;
    return { topic, overlapRatio };
  });

  // Sort by least overlap, then pick randomly from top 10 least-overlapping
  scored.sort((a, b) => a.overlapRatio - b.overlapRatio);
  const candidates = scored.slice(0, Math.min(10, scored.length));
  return candidates[Math.floor(Math.random() * candidates.length)].topic;
}

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
    const autoPublish = settings?.auto_publish ?? true; // Default TRUE — auto-publish
    const categoriesList = (settings?.categories_list as string[]) || [];
    const topicsPool = (settings?.topics_pool as string[]) || [];
    const systemPrompt = settings?.system_prompt || DEFAULT_SYSTEM_PROMPT;
    const imagePromptTemplateFallback = settings?.image_prompt_template || DEFAULT_IMAGE_PROMPT;

    // 2a. Fetch image prompts for rotation
    let imagePromptTemplate = imagePromptTemplateFallback;
    let selectedPromptId: string | null = null;
    try {
      const { data: imagePrompts } = await supabase
        .from('blog_image_prompts')
        .select('*')
        .eq('is_active', true)
        .order('last_used_at', { ascending: true, nullsFirst: true });

      if (imagePrompts && imagePrompts.length > 0) {
        // Pick randomly but exclude the most recently used one (if more than 1)
        let candidates = imagePrompts;
        if (imagePrompts.length > 1) {
          // Find the most recently used
          const sorted = [...imagePrompts].sort((a, b) => {
            if (!a.last_used_at) return -1;
            if (!b.last_used_at) return 1;
            return new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime();
          });
          const lastUsedId = sorted[0].id;
          candidates = imagePrompts.filter(p => p.id !== lastUsedId);
        }
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        imagePromptTemplate = selected.prompt_template;
        selectedPromptId = selected.id;
        console.log(`${PREFIX} Using image prompt style: "${selected.name}" (${selected.id})`);
      }
    } catch (promptErr) {
      console.warn(`${PREFIX} Failed to load image prompts, using fallback:`, promptErr);
    }

    // 2. Fetch recent posts for deduplication context
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('title, categories')
      .order('created_at', { ascending: false })
      .limit(20);

    const recentTitles = (recentPosts || []).map(p => p.title);

    // 3. Pick topic (deduplicated)
    const allTopics = topicsPool.length > 0 ? topicsPool : DEFAULT_TOPICS;
    const topic = requestTopic || pickUniqueTopic(allTopics, recentTitles);

    console.log(`${PREFIX} Generating article about: "${topic}" using model: ${aiModel}`);

    // 4. Create initial log entry (status will be updated at the end)
    // NOTE: status must be 'success'|'failed'|'partial' and generation_type must be 'article'|'image'|'both' (DB CHECK constraints)
    const { error: logInsertError } = await supabase.from('blog_generation_logs').insert({
      id: logId,
      model_used: aiModel,
      status: 'partial', // updated to 'success' on completion or 'failed' on error
      generation_type: 'both', // text + image
    });
    if (logInsertError) {
      console.error(`${PREFIX} ⚠️ Failed to create initial log entry:`, logInsertError);
    }

    // 5. Generate article text via OpenAI
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

    // Build deduplication context for the AI prompt
    const recentTitlesContext = recentTitles.length > 0
      ? `\n\nARTIGOS JÁ PUBLICADOS (NÃO repita estes temas, crie algo DIFERENTE e ÚNICO):\n${recentTitles.map(t => `- ${t}`).join('\n')}\n\nEscolha um ângulo NOVO e DIFERENTE. Varie entre categorias: Infoprodutos, Marketing Digital, Funil de Vendas, Tráfego Pago, Copywriting, Métricas, Quizzes Interativos.`
      : '';

    let textResult: any;
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    const userMessage = `Escreva um artigo completo e detalhado sobre: "${topic}". Responda APENAS com o JSON no formato especificado. IMPORTANTE: O campo "content" DEVE ser uma STRING HTML válida usando tags <h2>, <h3>, <p>, <ul>, <li>, <a>, <strong>, <em>. NÃO retorne um objeto JSON no campo content.${recentTitlesContext}`;

    if (openaiKey) {
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
            { role: 'user', content: userMessage },
          ],
          temperature: 0.8, // Slightly higher for more variety
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
      ensureSeoFields(textResult, topic);
    } else {
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
            { role: 'user', content: userMessage },
          ],
          temperature: 0.8,
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
      const cleanedContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      textResult = JSON.parse(cleanedContent);
      ensureSeoFields(textResult, topic);
    }

    console.log(`${PREFIX} Article generated: "${textResult.title}" (${totalTokens} tokens)`);

    // 6. Calculate text cost
    const modelCost = MODEL_COSTS[aiModel] || MODEL_COSTS['gpt-4o'];
    const textCostUsd = ((promptTokens * modelCost.input) + (completionTokens * modelCost.output)) / 1_000_000;

    // 7. Generate slug
    const slug = textResult.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    const { data: existingSlug } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug;

    // 8. Generate image via Gemini (Lovable AI Gateway)
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

          // Strategy 1: images array
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

                // Update prompt usage tracking
                if (selectedPromptId) {
                  const { data: promptData } = await supabase.from('blog_image_prompts').select('usage_count').eq('id', selectedPromptId).single();
                  await supabase.from('blog_image_prompts').update({
                    last_used_at: new Date().toISOString(),
                    usage_count: (promptData?.usage_count || 0) + 1,
                    updated_at: new Date().toISOString(),
                  }).eq('id', selectedPromptId);
                }
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

    // 8b. Fallback: placeholder image
    if (!featuredImageUrl) {
      const encodedTitle = encodeURIComponent(textResult.title || 'MasterQuiz Blog');
      featuredImageUrl = `https://placehold.co/1200x630/10B981/FFFFFF?text=${encodedTitle.substring(0, 40)}`;
      console.log(`${PREFIX} Using placeholder image: ${featuredImageUrl}`);
    }

    // 9. Build FAQ schema
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

    // 10. Build internal links data
    const internalLinks = [
      { url: 'https://masterquiz.lovable.app', text: 'MasterQuiz' },
      { url: 'https://masterquiz.lovable.app/precos', text: 'Planos e Preços' },
      { url: 'https://masterquiz.lovable.app/faq', text: 'FAQ' },
      { url: 'https://masterquiz.lovable.app/blog', text: 'Blog' },
    ];

    // 11. Auto internal linking: inject links to other published posts (bigram matching)
    let enrichedContent = textResult.content || '';

    try {
      const { data: otherPosts } = await supabase
        .from('blog_posts')
        .select('title, slug')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(30);

      if (otherPosts && otherPosts.length > 0) {
        let linksInjected = 0;
        const maxAutoLinks = 8; // Increased from 5

        for (const op of otherPosts) {
          if (linksInjected >= maxAutoLinks) break;

          // Extract bigrams (2-word phrases) for more natural matching
          const words = op.title
            .split(/\s+/)
            .filter((w: string) => w.length > 3)
            .map((w: string) => w.toLowerCase().replace(/[^a-záàâãéèêíïóôõúç]/gi, ''));

          // Try bigrams first (more natural links)
          let matched = false;
          for (let i = 0; i < words.length - 1 && !matched; i++) {
            const bigram = `${words[i]}\\s+${words[i + 1]}`;
            if (words[i].length < 4 || words[i + 1].length < 4) continue;
            const regex = new RegExp(`(?<![<\\/a-zA-Z"=])\\b(${bigram})\\b(?![^<]*>|[^<]*<\\/a>)`, 'i');
            if (regex.test(enrichedContent)) {
              enrichedContent = enrichedContent.replace(
                regex,
                `<a href="https://masterquiz.lovable.app/blog/${op.slug}" title="${op.title}">$1</a>`
              );
              linksInjected++;
              matched = true;
            }
          }

          // Fallback to single keyword
          if (!matched) {
            for (const kw of words) {
              if (kw.length < 5) continue;
              const regex = new RegExp(`(?<![<\\/a-zA-Z"=])\\b(${kw})\\b(?![^<]*>|[^<]*<\\/a>)`, 'i');
              if (regex.test(enrichedContent)) {
                enrichedContent = enrichedContent.replace(
                  regex,
                  `<a href="https://masterquiz.lovable.app/blog/${op.slug}" title="${op.title}">$1</a>`
                );
                linksInjected++;
                break;
              }
            }
          }
        }
        console.log(`${PREFIX} Auto-linked ${linksInjected} internal references`);
      }
    } catch (linkErr) {
      console.warn(`${PREFIX} Auto-linking skipped:`, linkErr);
    }

    // 12. Insert blog post
    const totalCost = textCostUsd + imageCostUsd;

    const postPayload = {
      title: textResult.title || topic,
      slug: finalSlug,
      content: enrichedContent,
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

    // 13. Update generation log
    const { error: logUpdateError } = await supabase.from('blog_generation_logs').update({
      post_id: postId,
      status: 'success',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      text_cost_usd: textCostUsd,
      image_cost_usd: imageCostUsd,
      total_cost_usd: totalCost,
    }).eq('id', logId);
    if (logUpdateError) {
      console.error(`${PREFIX} ⚠️ Failed to update generation log:`, logUpdateError);
    }

    console.log(`${PREFIX} ✅ Post created: "${newPost.title}" (${newPost.slug}) - $${totalCost.toFixed(4)}`);

    return okResponse({
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status,
      postId: newPost.id,
      cost: { text: textCostUsd, image: imageCostUsd, total: totalCost },
    }, traceId, corsHeaders);

  } catch (error) {
    console.error(`${PREFIX} ❌ Error:`, error);

    await supabase.from('blog_generation_logs').update({
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      post_id: postId,
    }).eq('id', logId);

    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', traceId, corsHeaders);
  }
});
