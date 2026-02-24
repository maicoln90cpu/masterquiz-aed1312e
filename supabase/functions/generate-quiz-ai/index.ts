import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
};

const PREFIX = "GENERATE-QUIZ-AI";

interface QuizGenerationRequest {
  productName?: string;
  problemSolved?: string;
  targetAudience?: string;
  desiredAction?: string;
  numberOfQuestions: number;
  mode?: 'form' | 'pdf' | 'educational';
  pdfContent?: string;
  pdfFileName?: string;
  quizIntent?: string;
  companyName?: string;
  industry?: string;
  tone?: string;
  leadTemperature?: string;
  focusTopics?: string;
  difficultyLevel?: string;
  targetAudiencePdf?: string;
  resultProfiles?: string;
  ctaText?: string;
  // Educational fields
  subject?: string;
  topic?: string;
  educationLevel?: string;
  educationalGoal?: string;
  includeExplanations?: boolean;
  explanationMode?: 'per_question' | 'end_of_quiz';
  // PDF proposal
  pdfProposal?: 'infoprodutor' | 'gestor_trafego' | 'educational';
}

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'google/gemini-2.5-flash-lite': { input: 0.025, output: 0.10 },
  'google/gemini-2.5-pro': { input: 1.25, output: 5.00 },
};

function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const costs = MODEL_COSTS[model] || { input: 0.15, output: 0.60 };
  return (promptTokens / 1_000_000) * costs.input + (completionTokens / 1_000_000) * costs.output;
}

function isDirectOpenAIModel(model: string): boolean {
  return model.startsWith('gpt-');
}

function replaceVariables(template: string, data: QuizGenerationRequest): string {
  return template
    .replace(/{productName}/g, data.productName || '')
    .replace(/{problemSolved}/g, data.problemSolved || '')
    .replace(/{targetAudience}/g, data.targetAudience || '')
    .replace(/{desiredAction}/g, data.desiredAction || 'Agendar conversa')
    .replace(/{numberOfQuestions}/g, String(data.numberOfQuestions))
    .replace(/{pdfFileName}/g, data.pdfFileName || 'documento.pdf')
    .replace(/{pdfContent}/g, data.pdfContent || '')
    .replace(/{quizIntent}/g, data.quizIntent || 'qualificar leads')
    .replace(/{companyName}/g, data.companyName || '')
    .replace(/{industry}/g, data.industry || '')
    .replace(/{tone}/g, data.tone || 'profissional')
    .replace(/{leadTemperature}/g, data.leadTemperature || 'morno')
    .replace(/{focusTopics}/g, data.focusTopics || '')
    .replace(/{difficultyLevel}/g, data.difficultyLevel || 'médio')
    .replace(/{targetAudiencePdf}/g, data.targetAudiencePdf || '')
    .replace(/{resultProfiles}/g, data.resultProfiles || '')
    .replace(/{ctaText}/g, data.ctaText || '')
    .replace(/{subject}/g, data.subject || '')
    .replace(/{topic}/g, data.topic || '')
    .replace(/{educationLevel}/g, data.educationLevel || '')
    .replace(/{educationalGoal}/g, data.educationalGoal || '')
    .replace(/{includeExplanations}/g, data.includeExplanations ? 'Sim, incluir explicação detalhada para cada alternativa' : 'Não')
    .replace(/{pdfProposal}/g, data.pdfProposal || 'infoprodutor');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check master_admin
    const { data: userRole } = await supabaseClient
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'master_admin').single();
    const isMasterAdmin = !!userRole;

    // Get subscription
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions').select('plan_type').eq('user_id', user.id).single();
    if (!subscription) {
      return new Response(JSON.stringify({ error: 'Subscription not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const planQuery = supabaseClient
      .from('subscription_plans')
      .select('allow_ai_generation, ai_generations_per_month, questions_per_quiz_limit')
      .eq('plan_type', subscription.plan_type);
    if (!isMasterAdmin && subscription.plan_type !== 'admin') {
      planQuery.eq('is_active', true);
    }
    const { data: plan } = await planQuery.single();

    if (!isMasterAdmin && (!plan || !plan.allow_ai_generation)) {
      return new Response(JSON.stringify({ error: 'AI generation not available in your plan' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const maxQuestionsAllowed = plan?.questions_per_quiz_limit || 10;

    // Get AI settings
    const { data: aiSettings } = await supabaseClient
      .from('system_settings').select('setting_key, setting_value')
      .in('setting_key', ['ai_model', 'ai_system_prompt_form', 'ai_system_prompt_pdf', 'ai_prompt_form', 'ai_prompt_pdf']);

    const aiModel = aiSettings?.find(s => s.setting_key === 'ai_model')?.setting_value || 'google/gemini-2.5-flash';

    const defaultSystemPromptForm = `Você é um especialista em criar funis de auto-convencimento através de perguntas estratégicas.

SEU OBJETIVO: Criar quizzes onde as perguntas conduzem o lead a reconhecer seus próprios problemas, entender as consequências de não agir, e concluir por conta própria que precisa de uma solução.

REGRA CRÍTICA - PERGUNTAS INICIAIS DE ESPELHAMENTO:
As primeiras 2-3 perguntas do quiz DEVEM SEMPRE ser perguntas de espelhamento/identificação pessoal.
Exemplos: faixa etária, sexo, rotina, momento de vida, objetivo principal.
Essas perguntas fazem o lead sentir que o quiz foi feito ESPECIFICAMENTE para ele.
Nunca comece com perguntas sobre o produto ou problema diretamente.

ESTRUTURA OBRIGATÓRIA DAS PERGUNTAS (em ordem):
1. Espelhamento (2-3 perguntas) - O lead se reconhece: idade, perfil, rotina
2. Amplificação da dor - O problema ganha peso e clareza
3. Consequência - O custo de não agir fica evidente
4. Contraste - Estado atual vs estado desejado
5. Conclusão guiada - A solução passa a fazer sentido

TIPOS DE PERGUNTAS A PRIORIZAR:
- "O que acontece hoje quando..."
- "Com que frequência você sente que..."
- "O quanto isso impacta..."
- "O que você já tentou e não funcionou?"
- "Se nada mudar, o que tende a acontecer?"

REGRAS DE FORMATO:
1. Retorne APENAS JSON válido no formato especificado
2. O campo "answer_format" deve ser EXATAMENTE: "single_choice", "multiple_choice" ou "yes_no"
3. O campo "options" deve ser um ARRAY SIMPLES de STRINGS
4. NÃO use objetos no array options, apenas strings`;

    const defaultSystemPromptPdf = `Você é um especialista em criar funis de auto-convencimento e qualificação de leads a partir de documentos.

SEU OBJETIVO: Analisar o conteúdo do documento e criar um quiz estratégico que conduza o respondente a reconhecer problemas, entender consequências e se convencer da necessidade de agir.

REGRA CRÍTICA - PERGUNTAS INICIAIS DE ESPELHAMENTO:
As primeiras 2-3 perguntas do quiz DEVEM SEMPRE ser perguntas de espelhamento/identificação pessoal.
Exemplos: faixa etária, sexo, rotina, momento de vida, objetivo principal.
Essas perguntas fazem o lead sentir que o quiz foi feito ESPECIFICAMENTE para ele.
Nunca comece com perguntas sobre o conteúdo do documento diretamente.

ESTRUTURA OBRIGATÓRIA DAS PERGUNTAS (em ordem):
1. Espelhamento (2-3 perguntas) - O lead se reconhece: idade, perfil, rotina
2. Amplificação da dor - O problema ganha peso e clareza
3. Consequência - O custo de não agir fica evidente
4. Contraste - Estado atual vs estado desejado
5. Conclusão guiada - A solução passa a fazer sentido

REGRAS:
1. Extraia os pontos-chave do documento para criar perguntas relevantes
2. As perguntas devem seguir a lógica de espelhamento → dor → consequência → contraste → solução
3. Cada opção deve ter um peso (score) para qualificação do lead
4. Adapte a linguagem ao tom e público-alvo especificados
5. Retorne APENAS JSON válido no formato especificado`;

    const defaultPromptForm = `Crie um quiz de auto-convencimento para:
PRODUTO/SERVIÇO: {productName}
PROBLEMA QUE RESOLVE: {problemSolved}
PÚBLICO-ALVO: {targetAudience}
AÇÃO DESEJADA (CTA): {desiredAction}
QUANTIDADE DE PERGUNTAS: {numberOfQuestions}
Intenção do quiz: {quizIntent}
Empresa: {companyName}
Segmento: {industry}
Tom de comunicação: {tone}
Temperatura do lead: {leadTemperature}
Texto do botão CTA: {ctaText}
Perfis de resultado desejados: {resultProfiles}

IMPORTANTE: As primeiras 2-3 perguntas devem ser de ESPELHAMENTO (ex: faixa etária, sexo, como descreveria sua rotina) para que o respondente sinta que o quiz é personalizado para ele. Depois siga o funil: dor → consequência → contraste → solução → CTA.

Retorne JSON com: title, description, questions (com question_text, answer_format, options com text e score), e results (com result_text, min_score, max_score, button_text, redirect_url).`;

    const defaultPromptPdf = `Analise o documento "{pdfFileName}" e crie um quiz estratégico de qualificação/auto-convencimento baseado no conteúdo.

CONTEÚDO DO DOCUMENTO:
{pdfContent}

CONFIGURAÇÕES:
Quantidade de perguntas: {numberOfQuestions}
Intenção do quiz: {quizIntent}
Tópicos de foco: {focusTopics}
Nível de dificuldade: {difficultyLevel}
Público-alvo: {targetAudiencePdf}

IMPORTANTE: As primeiras 2-3 perguntas devem ser de ESPELHAMENTO (ex: faixa etária, sexo, como descreveria sua rotina) para que o respondente sinta que o quiz é personalizado para ele. Depois siga o funil: dor → consequência → contraste → solução → CTA.

Retorne JSON com: title, description, questions (com question_text, answer_format, options com text e score), e results (com result_text, min_score, max_score).`;

    const defaultSystemPromptEducational = `Você é um professor especialista em criar quizzes educacionais para fixação e avaliação de conhecimento.

SEU OBJETIVO: Criar quizzes que testem o conhecimento do aluno sobre o tema, ajudem na fixação de conceitos e identifiquem lacunas de aprendizado.

ESTRUTURA DAS PERGUNTAS:
1. Perguntas conceituais - Definições e conceitos fundamentais
2. Perguntas de aplicação - Uso prático do conhecimento
3. Perguntas de análise - Interpretação e raciocínio
4. Perguntas de síntese - Conexão entre conceitos

REGRAS:
- Perguntas claras, objetivas e sem ambiguidade
- Alternativas plausíveis (evitar opções absurdas)
- Distribuir dificuldade conforme nível solicitado
- Se solicitado, incluir explicação para cada alternativa
- NÃO usar funil de vendas ou auto-convencimento
- Foco 100% pedagógico

REGRAS DE FORMATO:
1. Retorne APENAS JSON válido no formato especificado
2. O campo "answer_format" deve ser EXATAMENTE: "single_choice", "multiple_choice" ou "yes_no"
3. O campo "options" deve ser um ARRAY SIMPLES de STRINGS
4. NÃO use objetos no array options, apenas strings`;

    const defaultPromptEducational = `Crie um quiz educacional sobre:
DISCIPLINA: {subject}
CONTEÚDO/TEMA: {topic}
NÍVEL DE ENSINO: {educationLevel}
OBJETIVO: {educationalGoal}
DIFICULDADE: {difficultyLevel}
QUANTIDADE DE PERGUNTAS: {numberOfQuestions}
INCLUIR EXPLICAÇÕES: {includeExplanations}

Retorne JSON com: title, description, questions (com question_text, answer_format, options como array de strings${'{includeExplanations}' === 'Não' ? '' : ', explanation (string com explicação detalhada da resposta correta), correct_answer (string com o texto exato da alternativa correta)'}).
As perguntas devem testar conhecimento real sobre o tema, com alternativas plausíveis e bem formuladas.`;

    const defaultSystemPromptPdfTraffic = `Você é um especialista em criar quizzes de segmentação e qualificação de audiência para gestores de tráfego pago.

SEU OBJETIVO: Criar quizzes que segmentem a audiência, identifiquem o nível de consciência do lead e direcionem para ofertas relevantes baseadas no perfil.

ESTRUTURA OBRIGATÓRIA:
1. Segmentação demográfica (2 perguntas) - Perfil básico do respondente
2. Identificação de dor/necessidade - Qual problema mais incomoda
3. Nível de consciência - Quanto já sabe sobre soluções
4. Intenção de compra - Prontidão para agir
5. Qualificação final - Perfil ideal para a oferta

REGRAS:
- Linguagem direta e objetiva
- Foco em segmentação para campanhas de tráfego
- Opções que permitam classificar o lead em segmentos claros
- Retorne APENAS JSON válido
- O campo "options" deve ser um ARRAY SIMPLES de STRINGS`;

    const aiSystemPromptForm = aiSettings?.find(s => s.setting_key === 'ai_system_prompt_form')?.setting_value || defaultSystemPromptForm;
    const aiSystemPromptPdf = aiSettings?.find(s => s.setting_key === 'ai_system_prompt_pdf')?.setting_value || defaultSystemPromptPdf;
    const aiPromptForm = aiSettings?.find(s => s.setting_key === 'ai_prompt_form')?.setting_value || defaultPromptForm;
    const aiPromptPdf = aiSettings?.find(s => s.setting_key === 'ai_prompt_pdf')?.setting_value || defaultPromptPdf;
    const aiSystemPromptEducational = aiSettings?.find(s => s.setting_key === 'ai_system_prompt_educational')?.setting_value || defaultSystemPromptEducational;
    const aiPromptEducational = aiSettings?.find(s => s.setting_key === 'ai_prompt_educational')?.setting_value || defaultPromptEducational;


    // Check monthly limit
    if (!isMasterAdmin && plan && plan.ai_generations_per_month > 0) {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data: usageData } = await supabaseClient
        .from('ai_quiz_generations').select('id').eq('user_id', user.id).gte('generation_month', currentMonth);
      if (usageData && usageData.length >= plan.ai_generations_per_month) {
        return new Response(JSON.stringify({ error: 'Monthly AI generation limit reached', limit: plan.ai_generations_per_month, used: usageData.length }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const requestData: QuizGenerationRequest = await req.json();
    requestData.numberOfQuestions = Math.min(Math.max(requestData.numberOfQuestions || 5, 3), isMasterAdmin ? 999 : maxQuestionsAllowed);

    const isEducationalMode = requestData.mode === 'educational';
    const isPdfMode = requestData.mode === 'pdf' && requestData.pdfContent;
    const isPdfEducational = isPdfMode && requestData.pdfProposal === 'educational';
    const isPdfTraffic = isPdfMode && requestData.pdfProposal === 'gestor_trafego';

    let systemPrompt: string;
    let userPromptTemplate: string;

    if (isEducationalMode) {
      systemPrompt = aiSystemPromptEducational;
      userPromptTemplate = aiPromptEducational;
    } else if (isPdfEducational) {
      systemPrompt = aiSystemPromptEducational;
      userPromptTemplate = `Analise o documento "{pdfFileName}" e crie um quiz EDUCACIONAL baseado no conteúdo para fixação e avaliação de conhecimento.

CONTEÚDO DO DOCUMENTO:
{pdfContent}

CONFIGURAÇÕES:
Quantidade de perguntas: {numberOfQuestions}
Nível de dificuldade: {difficultyLevel}
Público-alvo: {targetAudiencePdf}

Retorne JSON com: title, description, questions (com question_text, answer_format, options como array de strings).
Foco 100% pedagógico. NÃO usar funil de vendas.`;
    } else if (isPdfTraffic) {
      systemPrompt = defaultSystemPromptPdfTraffic;
      userPromptTemplate = aiPromptPdf;
    } else if (isPdfMode) {
      systemPrompt = aiSystemPromptPdf;
      userPromptTemplate = aiPromptPdf;
    } else {
      systemPrompt = aiSystemPromptForm;
      userPromptTemplate = aiPromptForm;
    }

    const userPrompt = replaceVariables(userPromptTemplate, requestData);

    const isOpenAIModel = isDirectOpenAIModel(aiModel);
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    let aiResponse;
    let modelUsed = aiModel;
    const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];

    if (isOpenAIModel && OPENAI_API_KEY) {
      modelUsed = aiModel;
      aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: aiModel, messages, temperature: 0.7 }),
      });
    } else {
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'AI service not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: aiModel, messages }),
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`${PREFIX} API error:`, aiResponse.status, errorText);
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const usage = aiData.usage || {};
    let promptTokens = usage.prompt_tokens || usage.input_tokens || Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    let completionTokens = usage.completion_tokens || usage.output_tokens || Math.ceil(content.length / 4);
    const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
    const estimatedCostUsd = calculateCost(modelUsed, promptTokens, completionTokens);

    let quizData;
    try {
      let jsonStr = content;
      const markdownMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (markdownMatch) { jsonStr = markdownMatch[1]; }
      else { const m = content.match(/\{[\s\S]*\}/); if (m) jsonStr = m[0]; }
      quizData = JSON.parse(jsonStr.trim());
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', rawPreview: content.substring(0, 500) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabaseClient.from('ai_quiz_generations').insert({
      user_id: user.id, model_used: modelUsed, input_data: requestData,
      questions_generated: requestData.numberOfQuestions,
      prompt_tokens: promptTokens, completion_tokens: completionTokens,
      total_tokens: totalTokens, estimated_cost_usd: estimatedCostUsd,
    });

    return new Response(JSON.stringify(quizData), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`${PREFIX} Error:`, error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
