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
  mode?: 'form' | 'pdf';
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
    .replace(/{targetAudiencePdf}/g, data.targetAudiencePdf || '');
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

    const defaultSystemPromptForm = `Você é um especialista em criar funis de auto-convencimento através de perguntas estratégicas.\n\nSEU OBJETIVO: Criar quizzes onde as perguntas conduzem o lead a reconhecer seus próprios problemas, entender as consequências de não agir, e concluir por conta própria que precisa de uma solução.\n\nRetorne APENAS JSON válido no formato especificado.`;
    const defaultSystemPromptPdf = `Você é um especialista em criar funis de auto-convencimento a partir de documentos.\n\nRetorne APENAS JSON válido no formato especificado.`;

    const defaultPromptForm = `Crie um quiz de auto-convencimento para:\nPRODUTO/SERVIÇO: {productName}\nPROBLEMA QUE RESOLVE: {problemSolved}\nPÚBLICO-ALVO: {targetAudience}\nAÇÃO DESEJADA: {desiredAction}\nQUANTIDADE DE PERGUNTAS: {numberOfQuestions}\nIntenção: {quizIntent}\nTom: {tone}\nRetorne JSON com: title, description, questions (com question_text, answer_format, options).`;
    const defaultPromptPdf = `Analise o documento "{pdfFileName}" e crie um quiz baseado no conteúdo.\nCONTEÚDO:\n{pdfContent}\nQuantidade: {numberOfQuestions}\nRetorne JSON com: title, description, questions.`;

    const aiSystemPromptForm = aiSettings?.find(s => s.setting_key === 'ai_system_prompt_form')?.setting_value || defaultSystemPromptForm;
    const aiSystemPromptPdf = aiSettings?.find(s => s.setting_key === 'ai_system_prompt_pdf')?.setting_value || defaultSystemPromptPdf;
    const aiPromptForm = aiSettings?.find(s => s.setting_key === 'ai_prompt_form')?.setting_value || defaultPromptForm;
    const aiPromptPdf = aiSettings?.find(s => s.setting_key === 'ai_prompt_pdf')?.setting_value || defaultPromptPdf;

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

    const isPdfMode = requestData.mode === 'pdf' && requestData.pdfContent;
    const systemPrompt = isPdfMode ? aiSystemPromptPdf : aiSystemPromptForm;
    const userPromptTemplate = isPdfMode ? aiPromptPdf : aiPromptForm;
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
