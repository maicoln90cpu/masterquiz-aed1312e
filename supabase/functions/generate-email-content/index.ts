import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOGO_URL = 'https://kmmdzwoidakmbekqvkmq.supabase.co/storage/v1/object/public/quiz-media/brand/masterquizz-logo.png';
const LOGIN_URL = 'https://masterquiz.lovable.app/login';
const BLOG_URL = 'https://masterquiz.lovable.app/blog';

function wrapInEmailLayout(bodyHtml: string, preheader: string = ''): string {
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
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function makeButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
<tr><td align="center" style="border-radius:8px;background-color:#0f9b6e;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" fillcolor="#0f9b6e"><center style="color:#ffffff;font-family:Arial;font-size:16px;font-weight:bold;">${text}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;background-color:#0f9b6e;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">${text}</a><!--<![endif]-->
</td></tr>
</table>`;
}

interface GenerateRequest {
  templateType: 'blog_digest' | 'weekly_tip' | 'success_story' | 'monthly_summary' | 'platform_news';
  context: Record<string, unknown>;
  recipientName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { templateType, context, recipientName } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const firstName = recipientName?.split(' ')[0] || 'Usuário';
    let subject = '';
    let bodyHtml = '';
    let preheader = '';

    // For some types, we generate content via AI; for others, we build directly
    switch (templateType) {
      case 'blog_digest': {
        const posts = (context.posts || []) as Array<{ title: string; excerpt: string; slug: string; featured_image_url?: string }>;
        subject = `📚 ${posts.length} novos artigos no blog MasterQuizz`;
        preheader = posts.map(p => p.title).join(' | ');

        let cardsHtml = '';
        for (const post of posts.slice(0, 5)) {
          const imgHtml = post.featured_image_url
            ? `<img src="${post.featured_image_url}" alt="${post.title}" width="520" style="width:100%;max-width:520px;height:auto;border-radius:8px;margin-bottom:12px;">`
            : '';
          cardsHtml += `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #e9ecef;border-radius:8px;overflow:hidden;">
<tr><td style="padding:16px;">
${imgHtml}
<h3 style="margin:0 0 8px;color:#1a1a2e;font-size:18px;">${post.title}</h3>
<p style="margin:0 0 12px;color:#555;font-size:14px;line-height:1.5;">${post.excerpt || ''}</p>
<a href="${BLOG_URL}/${post.slug}" style="color:#0f9b6e;font-weight:bold;text-decoration:none;font-size:14px;">Ler artigo →</a>
</td></tr>
</table>`;
        }

        bodyHtml = `
<h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;">Olá, ${firstName}! 👋</h1>
<p style="color:#555;font-size:16px;line-height:1.6;">Publicamos novos conteúdos no blog para te ajudar a captar mais leads com quizzes.</p>
${cardsHtml}
${makeButton('Ver todos os artigos', BLOG_URL)}`;
        break;
      }

      case 'weekly_tip': {
        // Generate tip via AI
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'Você é um especialista em marketing digital e quizzes interativos. Gere uma dica prática e acionável em português brasileiro sobre como usar quizzes para captar leads, aumentar conversões ou engajar audiência. Formato: título curto (max 60 chars) + corpo explicativo (max 200 palavras). Responda em JSON: {"title":"...","body":"...","emoji":"..."}' },
              { role: 'user', content: `Gere uma dica da semana sobre: ${(context as any).topic || 'quizzes e marketing digital'}. Evite repetir temas anteriores: ${JSON.stringify((context as any).previousTopics || [])}` },
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'generate_tip',
                description: 'Generate a weekly tip',
                parameters: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    body: { type: 'string' },
                    emoji: { type: 'string' },
                  },
                  required: ['title', 'body', 'emoji'],
                },
              },
            }],
            tool_choice: { type: 'function', function: { name: 'generate_tip' } },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error('AI error:', aiResponse.status, errText);
          throw new Error(`AI gateway error: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        let tip = { title: 'Dica da Semana', body: 'Use quizzes para qualificar seus leads de forma interativa.', emoji: '💡' };
        try {
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) tip = JSON.parse(toolCall.function.arguments);
        } catch { /* use default */ }

        subject = `${tip.emoji} Dica da Semana: ${tip.title}`;
        preheader = tip.title;
        bodyHtml = `
<h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;">Olá, ${firstName}! ${tip.emoji}</h1>
<h2 style="margin:16px 0 12px;color:#0f9b6e;font-size:20px;">${tip.title}</h2>
<div style="background:#f0faf6;border-left:4px solid #0f9b6e;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
<p style="margin:0;color:#333;font-size:15px;line-height:1.7;">${tip.body}</p>
</div>
<p style="color:#555;font-size:14px;margin-top:20px;">Coloque essa dica em prática agora mesmo! 🚀</p>
${makeButton('Acessar meu painel', LOGIN_URL)}`;
        break;
      }

      case 'success_story': {
        // Generate case study via AI
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
                    company: { type: 'string' },
                    industry: { type: 'string' },
                    challenge: { type: 'string' },
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
          try {
            const toolCall = aiResp.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall) caseData = JSON.parse(toolCall.function.arguments);
          } catch { /* use default */ }
        }

        subject = `🏆 Case de Sucesso: Como ${caseData.company} multiplicou resultados`;
        preheader = caseData.challenge;

        let metricsHtml = '';
        for (const r of (caseData.results || []).slice(0, 3)) {
          metricsHtml += `<td align="center" style="padding:12px;"><div style="font-size:28px;font-weight:bold;color:#0f9b6e;">${r.value}</div><div style="font-size:12px;color:#777;margin-top:4px;">${r.metric}</div></td>`;
        }

        bodyHtml = `
<h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;">Olá, ${firstName}! 🏆</h1>
<p style="color:#555;font-size:16px;line-height:1.6;">Veja como <strong>${caseData.company}</strong> do setor de <strong>${caseData.industry}</strong> alcançou resultados incríveis.</p>

<div style="background:#fff8e1;border-radius:8px;padding:16px 20px;margin:16px 0;">
<p style="margin:0;font-weight:bold;color:#f57c00;">⚡ Desafio:</p>
<p style="margin:4px 0 0;color:#555;">${caseData.challenge}</p>
</div>

<div style="background:#f0faf6;border-radius:8px;padding:16px 20px;margin:16px 0;">
<p style="margin:0;font-weight:bold;color:#0f9b6e;">✅ Solução com MasterQuizz:</p>
<p style="margin:4px 0 0;color:#555;">${caseData.solution}</p>
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f8f9fa;border-radius:8px;">
<tr>${metricsHtml}</tr>
</table>

<div style="background:#f3e5f5;border-left:4px solid #9c27b0;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
<p style="margin:0;color:#555;font-style:italic;">"${caseData.quote}"</p>
<p style="margin:8px 0 0;color:#9c27b0;font-weight:bold;font-size:13px;">— ${caseData.company}</p>
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

        // Generate insight via AI
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
            insight = data.choices?.[0]?.message?.content || insight;
          }
        } catch { /* use default */ }

        bodyHtml = `
<h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;">Olá, ${firstName}! 📊</h1>
<p style="color:#555;font-size:16px;">Aqui está seu resumo de <strong>${monthName}</strong>:</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
<tr>
<td align="center" style="padding:16px;background:#f0faf6;border-radius:8px;width:33%;">
<div style="font-size:32px;font-weight:bold;color:#0f9b6e;">${quizzes}</div>
<div style="font-size:12px;color:#777;margin-top:4px;">Quizzes ativos</div>
</td>
<td width="12"></td>
<td align="center" style="padding:16px;background:#e8f5e9;border-radius:8px;width:33%;">
<div style="font-size:32px;font-weight:bold;color:#2e7d32;">${leads}</div>
<div style="font-size:12px;color:#777;margin-top:4px;">Leads captados</div>
</td>
<td width="12"></td>
<td align="center" style="padding:16px;background:#e3f2fd;border-radius:8px;width:33%;">
<div style="font-size:32px;font-weight:bold;color:#1565c0;">${responses}</div>
<div style="font-size:12px;color:#777;margin-top:4px;">Respostas</div>
</td>
</tr>
</table>

<div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;">
<span style="font-size:24px;">${growthEmoji}</span>
<span style="font-size:16px;font-weight:bold;color:${growthPct >= 0 ? '#0f9b6e' : '#e53935'};">${growthPct >= 0 ? '+' : ''}${growthPct}%</span>
<span style="color:#777;font-size:14px;"> vs mês anterior em leads</span>
</div>

<div style="background:#f0faf6;border-left:4px solid #0f9b6e;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;">
<p style="margin:0;font-weight:bold;color:#0f9b6e;">💡 Insight personalizado:</p>
<p style="margin:8px 0 0;color:#333;font-size:15px;line-height:1.6;">${insight}</p>
</div>

${makeButton('Ver meu painel completo', LOGIN_URL)}`;
        break;
      }

      case 'platform_news': {
        const updates = (context.updates || []) as string[];
        const version = (context.version || '') as string;

        // Use AI to format the updates nicely
        let formattedUpdates = updates.map(u => `<li style="margin-bottom:8px;color:#333;font-size:15px;line-height:1.5;">${u}</li>`).join('');

        try {
          const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages: [
                { role: 'system', content: 'Transforme os bullet points de novidades da plataforma em uma lista HTML com emojis e descrições claras em português BR. Retorne apenas os <li> elements. Max 1 frase por item.' },
                { role: 'user', content: `Novidades: ${JSON.stringify(updates)}` },
              ],
            }),
          });
          if (aiResp.ok) {
            const data = await aiResp.json();
            const content = data.choices?.[0]?.message?.content;
            if (content && content.includes('<li')) formattedUpdates = content;
          }
        } catch { /* use raw list */ }

        subject = `🚀 Novidades MasterQuizz${version ? ` — ${version}` : ''}`;
        preheader = `Confira o que há de novo na plataforma`;
        bodyHtml = `
<h1 style="margin:0 0 8px;color:#1a1a2e;font-size:24px;">Olá, ${firstName}! 🚀</h1>
<p style="color:#555;font-size:16px;line-height:1.6;">Temos novidades incríveis para compartilhar com você:</p>

<div style="background:#f0faf6;border-radius:8px;padding:20px 24px;margin:16px 0;">
<ul style="margin:0;padding-left:20px;">
${formattedUpdates}
</ul>
</div>

<p style="color:#555;font-size:14px;margin-top:16px;">Acesse a plataforma para experimentar todas as novidades! 💪</p>
${makeButton('Explorar novidades', LOGIN_URL)}`;
        break;
      }

      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }

    const html = wrapInEmailLayout(bodyHtml, preheader);

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
