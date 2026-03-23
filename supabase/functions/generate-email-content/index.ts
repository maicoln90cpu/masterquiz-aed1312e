import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGO_URL = 'https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png';
const LOGIN_URL = 'https://masterquiz.lovable.app/login';
const BLOG_URL = 'https://masterquiz.lovable.app/blog';
const SUPABASE_URL = 'https://kmmdzwoidakmbekqvkmq.supabase.co';

// Cost per 1M tokens (Gemini Flash)
const COST_PER_1M_INPUT = 0.10;
const COST_PER_1M_OUTPUT = 0.40;

function unsubscribeUrl(email: string, userId?: string): string {
  const params = new URLSearchParams({ email });
  if (userId) params.set('uid', userId);
  return `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?${params.toString()}`;
}

function wrapInEmailLayout(bodyHtml: string, preheader: string = '', email: string = '', userId: string = ''): string {
  const unsub = unsubscribeUrl(email, userId);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MasterQuizz</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;">
<tr><td align="center" style="padding:20px 0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0f9b6e,#0d8b62);padding:30px;text-align:center;">
<img src="${LOGO_URL}" alt="MasterQuizz" width="180" style="max-width:180px;height:auto;">
</td></tr>

<!-- Body -->
<tr><td style="padding:30px 40px;">
${bodyHtml}
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e9ecef;">
<p style="margin:0;color:#6c757d;font-size:12px;">© ${new Date().getFullYear()} MasterQuizz — Todos os direitos reservados</p>
<p style="margin:8px 0 0;color:#999;font-size:11px;">Você recebeu este email porque é usuário da plataforma MasterQuizz.</p>
<p style="margin:8px 0 0;"><a href="${unsub}" style="color:#999;font-size:11px;text-decoration:underline;">Cancelar inscrição</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function makeButton(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:24px 0;">
<table role="presentation" cellpadding="0" cellspacing="0">
<tr><td align="center" style="background-color:#0f9b6e;border-radius:8px;text-align:center;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;background-color:#0f9b6e;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;font-family:Arial,sans-serif;mso-padding-alt:0;text-underline-color:#0f9b6e;">
<!--[if mso]><i style="mso-font-width:200%;mso-text-raise:30pt" hidden>&emsp;</i><span style="mso-text-raise:15pt;"><!--<![endif]-->
${text}
<!--[if mso]></span><i style="mso-font-width:200%;" hidden>&emsp;&#8203;</i><!--<![endif]-->
</a>
</td></tr>
</table>
</td></tr>
</table>`;
}

interface GenerateRequest {
  templateType: 'blog_digest' | 'weekly_tip' | 'success_story' | 'monthly_summary' | 'platform_news';
  context: Record<string, unknown>;
  recipientName?: string;
  recipientEmail?: string;
  recipientUserId?: string;
}

async function logAICost(supabaseAdmin: any, templateType: string, aiData: any) {
  try {
    const usage = aiData?.usage;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || promptTokens + completionTokens;
    const estimatedCost = (promptTokens * COST_PER_1M_INPUT / 1_000_000) + (completionTokens * COST_PER_1M_OUTPUT / 1_000_000);

    await supabaseAdmin.from('email_generation_logs').insert({
      template_type: templateType,
      model_used: aiData?.model || 'google/gemini-3-flash-preview',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCost,
    });
  } catch (e) {
    console.error('Failed to log email AI cost:', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { templateType, context, recipientName, recipientEmail, recipientUserId } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create Supabase admin client for logging
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const firstName = recipientName?.split(' ')[0] || 'Usuário';
    const email = recipientEmail || '';
    const userId = recipientUserId || '';
    let subject = '';
    let bodyHtml = '';
    let preheader = '';

    switch (templateType) {
      case 'blog_digest': {
        const posts = (context.posts || []) as Array<{ title: string; excerpt: string; slug: string; featured_image_url?: string }>;
        subject = `🔥 ${posts.length} artigos fresquinhos para turbinar seus quizzes`;
        preheader = posts.map(p => p.title).join(' | ');

        let cardsHtml = '';
        for (let i = 0; i < Math.min(posts.length, 5); i++) {
          const post = posts[i];
          const imgHtml = post.featured_image_url
            ? `<img src="${post.featured_image_url}" alt="${post.title}" width="520" style="width:100%;max-width:520px;height:auto;border-radius:8px 8px 0 0;">`
            : '';
          cardsHtml += `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e9ecef;border-radius:8px;overflow:hidden;">
<tr><td>
${imgHtml}
<div style="padding:20px;">
<h3 style="margin:0 0 10px;color:#1a1a2e;font-size:18px;line-height:1.4;">${post.title}</h3>
<p style="margin:0 0 14px;color:#666;font-size:14px;line-height:1.6;">${post.excerpt || ''}</p>
<a href="${BLOG_URL}/${post.slug}" style="color:#0f9b6e;font-weight:bold;text-decoration:none;font-size:14px;">Ler artigo completo →</a>
</div>
</td></tr>
</table>`;
        }

        bodyHtml = `
<h1 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;line-height:1.3;">Olá, ${firstName}! 👋</h1>
<p style="color:#444;font-size:16px;line-height:1.7;margin:0 0 24px;">${posts.length} artigos fresquinhos saíram do forno! 🔥 Cada um traz insights práticos que você pode aplicar <strong>hoje mesmo</strong> para turbinar seus resultados com quizzes.</p>
${cardsHtml}
${makeButton('Ver todos os artigos', BLOG_URL)}`;
        // blog_digest is static, no AI call
        break;
      }

      case 'weekly_tip': {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: `Você é um amigo especialista em marketing digital e quizzes interativos. Escreva como se estivesse conversando com um colega — tom leve, humano e empolgante. Use analogias do dia a dia, emojis naturais (sem exagero), e parágrafos curtos.

Formato obrigatório (JSON):
{
  "title": "título curto e chamativo (max 50 chars)",
  "intro": "1 parágrafo de abertura empolgante explicando POR QUE esse tema importa (80-120 palavras). Conecte com a dor real do leitor.",
  "steps": [
    {"title": "Título do passo 1", "description": "Explicação prática em 2-3 frases"},
    {"title": "Título do passo 2", "description": "Explicação prática em 2-3 frases"},
    {"title": "Título do passo 3", "description": "Explicação prática em 2-3 frases"}
  ],
  "closing": "1 frase motivacional final (max 30 palavras)",
  "emoji": "emoji principal do tema"
}` },
              { role: 'user', content: `Gere uma dica da semana sobre: ${(context as any).topic || 'quizzes e marketing digital'}. Evite repetir temas anteriores: ${JSON.stringify((context as any).previousTopics || [])}` },
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'generate_tip',
                description: 'Generate a structured weekly tip',
                parameters: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    intro: { type: 'string' },
                    steps: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title', 'description'] } },
                    closing: { type: 'string' },
                    emoji: { type: 'string' },
                  },
                  required: ['title', 'intro', 'steps', 'closing', 'emoji'],
                },
              },
            }],
            tool_choice: { type: 'function', function: { name: 'generate_tip' } },
          }),
        });

        if (!aiResponse.ok) throw new Error(`AI gateway error: ${aiResponse.status}`);

        const aiData = await aiResponse.json();
        // Log AI cost
        await logAICost(supabaseAdmin, 'weekly_tip', aiData);

        let tip = {
          title: 'Dica da Semana',
          intro: 'Use quizzes para qualificar seus leads de forma interativa e divertida.',
          steps: [
            { title: 'Defina o objetivo', description: 'Antes de criar, saiba o que você quer descobrir sobre seu lead.' },
            { title: 'Crie perguntas envolventes', description: 'Use linguagem simples e opções que façam o respondente pensar.' },
            { title: 'Otimize o resultado', description: 'Entregue valor real no resultado — isso aumenta compartilhamentos.' },
          ],
          closing: 'Bora colocar isso em prática? 💪',
          emoji: '💡',
        };
        try {
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) tip = JSON.parse(toolCall.function.arguments);
        } catch { /* use default */ }

        const stepsHtml = (tip.steps || []).map((step, i) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
<tr>
<td width="48" valign="top" style="padding-right:12px;">
<div style="width:40px;height:40px;border-radius:50%;background:#0f9b6e;color:#fff;font-size:18px;font-weight:bold;text-align:center;line-height:40px;">${i + 1}</div>
</td>
<td valign="top">
<p style="margin:0 0 4px;color:#1a1a2e;font-size:15px;font-weight:bold;line-height:1.4;">${step.title}</p>
<p style="margin:0;color:#555;font-size:14px;line-height:1.7;">${step.description}</p>
</td>
</tr>
</table>`).join('');

        subject = `${tip.emoji} Dica da Semana: ${tip.title}`;
        preheader = tip.title;
        bodyHtml = `
<h1 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;line-height:1.3;">Olá, ${firstName}! ${tip.emoji}</h1>
<h2 style="margin:0 0 20px;color:#0f9b6e;font-size:20px;line-height:1.4;">${tip.title}</h2>

<div style="background:#f8fffe;border-left:4px solid #0f9b6e;padding:20px 24px;border-radius:0 8px 8px 0;margin:0 0 28px;">
<p style="margin:0;color:#333;font-size:15px;line-height:1.8;">${tip.intro}</p>
</div>

<h3 style="margin:0 0 20px;color:#1a1a2e;font-size:17px;">Como aplicar em 3 passos:</h3>
${stepsHtml}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
<tr><td style="border-top:1px solid #e9ecef;padding-top:20px;">
<p style="margin:0;color:#555;font-size:15px;line-height:1.7;text-align:center;">${tip.closing}</p>
</td></tr>
</table>
${makeButton('Acessar meu painel', LOGIN_URL)}`;
        break;
      }

      case 'success_story': {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'Você cria cases de sucesso fictícios mas realistas para a plataforma MasterQuizz. Os cases devem ser sobre empresas/profissionais que usaram quizzes interativos para captar leads. Use métricas realistas. Responda em JSON com a estrutura: {"company":"Nome da Empresa","industry":"Setor","challenge":"Desafio em 1 frase","solution":"Como usou MasterQuizz em 2 frases","results":[{"metric":"Nome da métrica","value":"Valor","improvement":"% melhora"}],"quote":"Depoimento fictício em 1 frase"}' },
              { role: 'user', content: `Crie um case de sucesso. Métricas médias da plataforma: ${JSON.stringify(context.platformStats || { avg_leads: 85, avg_quizzes: 3 })}` },
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'generate_case',
                description: 'Generate a success story',
                parameters: {
                  type: 'object',
                  properties: {
                    company: { type: 'string' }, industry: { type: 'string' }, challenge: { type: 'string' },
                    solution: { type: 'string' },
                    results: { type: 'array', items: { type: 'object', properties: { metric: { type: 'string' }, value: { type: 'string' }, improvement: { type: 'string' } } } },
                    quote: { type: 'string' },
                  },
                  required: ['company', 'industry', 'challenge', 'solution', 'results', 'quote'],
                },
              },
            }],
            tool_choice: { type: 'function', function: { name: 'generate_case' } },
          }),
        });

        let caseData = { company: 'DigitalBoost', industry: 'Marketing', challenge: 'Baixa conversão de leads', solution: 'Criou quizzes de qualificação com MasterQuizz.', results: [{ metric: 'Leads', value: '340%', improvement: '+240%' }], quote: 'MasterQuizz transformou nossa captação.' };
        if (aiResponse.ok) {
          const aiResp = await aiResponse.json();
          // Log AI cost
          await logAICost(supabaseAdmin, 'success_story', aiResp);
          try {
            const toolCall = aiResp.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) caseData = JSON.parse(toolCall.function.arguments);
          } catch { /* use default */ }
        }

        subject = `🏆 Case de Sucesso: Como ${caseData.company} multiplicou resultados`;
        preheader = caseData.challenge;

        let metricsHtml = '';
        for (const r of (caseData.results || []).slice(0, 3)) {
          metricsHtml += `<td align="center" style="padding:16px;"><div style="font-size:36px;font-weight:bold;color:#0f9b6e;">${r.value}</div><div style="font-size:12px;color:#777;margin-top:6px;">${r.metric}</div></td>`;
        }

        bodyHtml = `
<h1 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;line-height:1.3;">Olá, ${firstName}! 🏆</h1>
<p style="color:#555;font-size:16px;line-height:1.7;">Veja como <strong>${caseData.company}</strong> do setor de <strong>${caseData.industry}</strong> alcançou resultados incríveis.</p>
<div style="background:#fff8e1;border-radius:8px;padding:20px 24px;margin:20px 0;">
<p style="margin:0;font-weight:bold;color:#f57c00;">⚡ Desafio:</p>
<p style="margin:8px 0 0;color:#555;line-height:1.7;">${caseData.challenge}</p>
</div>
<div style="background:#f0faf6;border-radius:8px;padding:20px 24px;margin:20px 0;">
<p style="margin:0;font-weight:bold;color:#0f9b6e;">✅ Solução com MasterQuizz:</p>
<p style="margin:8px 0 0;color:#555;line-height:1.7;">${caseData.solution}</p>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f8f9fa;border-radius:8px;">
<tr>${metricsHtml}</tr>
</table>
<div style="background:#f3e5f5;border-left:4px solid #9c27b0;padding:20px 24px;border-radius:0 8px 8px 0;margin:20px 0;">
<p style="margin:0;color:#555;font-style:italic;line-height:1.7;">"${caseData.quote}"</p>
<p style="margin:10px 0 0;color:#9c27b0;font-weight:bold;font-size:13px;">— ${caseData.company}</p>
</div>
${makeButton('Criar meu quiz agora', LOGIN_URL)}`;
        break;
      }

      case 'monthly_summary': {
        const stats = context.userStats as any || {};
        const quizzes = stats.quiz_count || 0;
        const leads = stats.lead_count || 0;
        const responses = stats.response_count || 0;
        const prevLeads = stats.prev_lead_count || 0;
        const growthPct = prevLeads > 0 ? Math.round(((leads - prevLeads) / prevLeads) * 100) : 0;
        const growthEmoji = growthPct > 0 ? '📈' : growthPct < 0 ? '📉' : '➡️';
        const monthName = context.monthName || 'mês anterior';

        subject = `📊 Seu resumo de ${monthName} — MasterQuizz`;
        preheader = `${leads} leads captados, ${quizzes} quizzes ativos`;

        let insight = 'Continue criando quizzes de qualidade para manter seus resultados!';
        try {
          const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                { role: 'system', content: 'Gere 1 insight personalizado (max 2 frases, português BR) sobre os resultados do usuário com quizzes interativos. Seja motivador e sugira uma ação concreta.' },
                { role: 'user', content: `Stats: ${quizzes} quizzes, ${leads} leads, ${responses} respostas, crescimento ${growthPct}% vs mês anterior.` },
              ],
            }),
          });
          if (aiResp.ok) {
            const data = await aiResp.json();
            // Log AI cost
            await logAICost(supabaseAdmin, 'monthly_summary', data);
            insight = data.choices?.[0]?.message?.content || insight;
          }
        } catch { /* use default */ }

        bodyHtml = `
<h1 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;line-height:1.3;">Olá, ${firstName}! 📊</h1>
<p style="color:#555;font-size:16px;line-height:1.7;">Aqui está seu resumo de <strong>${monthName}</strong>:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr>
<td align="center" style="padding:20px;background:#f0faf6;border-radius:8px;width:33%;"><div style="font-size:36px;font-weight:bold;color:#0f9b6e;">${quizzes}</div><div style="font-size:12px;color:#777;margin-top:6px;">Quizzes ativos</div></td>
<td width="12"></td>
<td align="center" style="padding:20px;background:#e8f5e9;border-radius:8px;width:33%;"><div style="font-size:36px;font-weight:bold;color:#2e7d32;">${leads}</div><div style="font-size:12px;color:#777;margin-top:6px;">Leads captados</div></td>
<td width="12"></td>
<td align="center" style="padding:20px;background:#e3f2fd;border-radius:8px;width:33%;"><div style="font-size:36px;font-weight:bold;color:#1565c0;">${responses}</div><div style="font-size:12px;color:#777;margin-top:6px;">Respostas</div></td>
</tr>
</table>
<div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
<span style="font-size:24px;">${growthEmoji}</span>
<span style="font-size:16px;font-weight:bold;color:${growthPct >= 0 ? '#0f9b6e' : '#e53935'};">${growthPct >= 0 ? '+' : ''}${growthPct}%</span>
<span style="color:#777;font-size:14px;"> vs mês anterior em leads</span>
</div>
<p style="color:#555;font-size:15px;line-height:1.7;text-align:center;margin:20px 0 8px;">Cada quiz que você cria é uma oportunidade de conexão com seu público. Continue assim! 🚀</p>
<div style="background:#f0faf6;border-left:4px solid #0f9b6e;padding:20px 24px;border-radius:0 8px 8px 0;margin:20px 0;">
<p style="margin:0;font-weight:bold;color:#0f9b6e;">💡 Insight personalizado:</p>
<p style="margin:10px 0 0;color:#333;font-size:15px;line-height:1.8;">${insight}</p>
</div>
${makeButton('Ver meu painel completo', LOGIN_URL)}`;
        break;
      }

      case 'platform_news': {
        const updates = (context.updates || []) as string[];
        const version = (context.version || '') as string;

        let formattedUpdates = updates.map(u => `<li style="margin-bottom:12px;color:#333;font-size:15px;line-height:1.7;">${u}</li>`).join('');

        try {
          const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                { role: 'system', content: 'Transforme os bullet points de novidades da plataforma em uma lista HTML com emojis e descrições claras em português BR. Retorne apenas os <li> elements. Max 1 frase por item. Use line-height:1.7 e margin-bottom:12px em cada li.' },
                { role: 'user', content: `Novidades: ${JSON.stringify(updates)}` },
              ],
            }),
          });
          if (aiResp.ok) {
            const data = await aiResp.json();
            // Log AI cost
            await logAICost(supabaseAdmin, 'platform_news', data);
            const content = data.choices?.[0]?.message?.content;
            if (content && content.includes('<li')) formattedUpdates = content;
          }
        } catch { /* use raw list */ }

        subject = `🚀 Novidades MasterQuizz${version ? ` — ${version}` : ''}`;
        preheader = `Confira o que há de novo na plataforma`;
        bodyHtml = `
<h1 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;line-height:1.3;">Olá, ${firstName}! 🚀</h1>
<p style="color:#555;font-size:16px;line-height:1.7;">Temos novidades incríveis para compartilhar com você:</p>
<div style="background:#f0faf6;border-radius:8px;padding:28px 28px;margin:20px 0;">
<ul style="margin:0;padding-left:20px;">
${formattedUpdates}
</ul>
</div>
<p style="color:#555;font-size:15px;line-height:1.7;margin-top:20px;">Acesse a plataforma para experimentar todas as novidades! 💪</p>
${makeButton('Explorar novidades', LOGIN_URL)}`;
        break;
      }

      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }

    const html = wrapInEmailLayout(bodyHtml, preheader, email, userId);

    return new Response(JSON.stringify({ subject, html, preheader }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-email-content error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
