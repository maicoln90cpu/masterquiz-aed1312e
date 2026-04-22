import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { okResponse, errorResponse, getTraceId } from '../_shared/envelope.ts';
import { parseBody, z } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-trace-id',
};

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const BodySchema = z.object({
  phone_number: z.string().min(5),
  message_text: z.string().min(1),
  user_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = getTraceId(req);
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const parsed = await parseBody(req, BodySchema, traceId);
    if (parsed instanceof Response) return parsed;
    const { phone_number, message_text, user_id, contact_id } = parsed.data;

    console.log(`[WHATSAPP-AI] Processing message from ${phone_number}: "${message_text.substring(0, 50)}"`);

    // 0. Check blacklist
    const { data: blacklisted } = await supabase
      .from('recovery_blacklist')
      .select('id')
      .eq('phone_number', phone_number)
      .limit(1);

    if (blacklisted && blacklisted.length > 0) {
      console.log(`[WHATSAPP-AI] Phone ${phone_number} is blacklisted, skipping`);
      return okResponse({ success: false, reason: 'blacklisted' }, traceId, corsHeaders);
    }

    // 1. Check if AI is enabled
    const { data: aiSettings } = await supabase
      .from('whatsapp_ai_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!aiSettings?.is_enabled) {
      console.log('[WHATSAPP-AI] AI is disabled, skipping');
      return okResponse({ success: false, reason: 'ai_disabled' }, traceId, corsHeaders);
    }

    // 2. Rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('phone_number', phone_number)
      .eq('role', 'assistant')
      .gte('created_at', oneHourAgo);

    if ((recentCount || 0) >= (aiSettings.rate_limit_per_hour || 30)) {
      console.log(`[WHATSAPP-AI] Rate limit reached for ${phone_number}`);
      return okResponse({ success: false, reason: 'rate_limited' }, traceId, corsHeaders);
    }

    // 3. Check for human intervention — if last non-user message is 'human' within pause window, skip AI
    const humanPauseMinutes = aiSettings.human_pause_minutes ?? 30;
    const pauseCutoff = new Date(Date.now() - humanPauseMinutes * 60 * 1000).toISOString();
    
    const { data: lastNonUserMsg } = await supabase
      .from('whatsapp_conversations')
      .select('role, content, created_at')
      .eq('phone_number', phone_number)
      .in('role', ['assistant', 'human'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastNonUserMsg?.role === 'human' && lastNonUserMsg.created_at >= pauseCutoff) {
      console.log(`[WHATSAPP-AI] Human intervention detected for ${phone_number} (within ${humanPauseMinutes}min window), skipping AI reply`);

      // Save user message anyway for history
      await supabase.from('whatsapp_conversations').insert({
        user_id: user_id || null,
        phone_number,
        role: 'user',
        content: message_text,
        template_context_id: contact_id || null,
      });

      // Send alert to admin if configured
      const adminPhone = aiSettings.admin_alert_phone;
      if (adminPhone) {
        try {
          const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
          const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
          const { data: recoverySettings } = await supabase
            .from('recovery_settings')
            .select('instance_name')
            .limit(1)
            .maybeSingle();
          const instanceName = recoverySettings?.instance_name || 'masterquizz';

          if (evolutionUrl && evolutionKey) {
            const alertText = `⚠️ *Alerta: Resposta após intervenção humana*\n\n📱 Número: ${phone_number}\n💬 Mensagem: "${message_text.substring(0, 200)}"\n\n_O agente IA NÃO respondeu pois detectou que você já estava conversando com este número._`;
            
            await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionKey,
              },
              body: JSON.stringify({
                number: adminPhone.replace(/\D/g, ''),
                text: alertText,
              }),
            });
            console.log(`[WHATSAPP-AI] Admin alert sent to ${adminPhone}`);
          }
        } catch (alertError) {
          console.error('[WHATSAPP-AI] Failed to send admin alert:', alertError);
        }
      }

      return okResponse({ success: false, reason: 'human_intervention', admin_alerted: !!adminPhone }, traceId, corsHeaders);
    }

    // 3.5 CHECK MAX AGENT RETRIES — count consecutive assistant messages without user reply
    const maxRetries = aiSettings.max_agent_retries ?? 2;
    const { data: recentMessages } = await supabase
      .from('whatsapp_conversations')
      .select('role')
      .eq('phone_number', phone_number)
      .order('created_at', { ascending: false })
      .limit(maxRetries + 5); // fetch a bit more to find pattern

    if (recentMessages && recentMessages.length > 0) {
      // Count consecutive assistant messages at the top (most recent)
      // The current user message hasn't been saved yet, so the history starts with the last saved message
      let consecutiveAssistant = 0;
      for (const msg of recentMessages) {
        if (msg.role === 'assistant') {
          consecutiveAssistant++;
        } else {
          break;
        }
      }

      if (consecutiveAssistant >= maxRetries) {
        console.log(`[WHATSAPP-AI] Max agent retries (${maxRetries}) reached for ${phone_number}, escalating to human`);

        // Save user message
        await supabase.from('whatsapp_conversations').insert({
          user_id: user_id || null,
          phone_number,
          role: 'user',
          content: message_text,
          template_context_id: contact_id || null,
        });

        // Send escalation message
        const fallbackMessage = aiSettings.fallback_message || 
          'Obrigado pelo contato! Vou encaminhar sua dúvida para nossa equipe de suporte. Um atendente humano entrará em contato em breve. 🙏';

        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
        const { data: recoverySettings } = await supabase
          .from('recovery_settings')
          .select('instance_name')
          .limit(1)
          .maybeSingle();
        const instanceName = recoverySettings?.instance_name || 'masterquizz';

        if (evolutionUrl && evolutionKey) {
          await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              number: phone_number.replace(/\D/g, ''),
              text: fallbackMessage,
            }),
          });

          // Save escalation message as assistant
          await supabase.from('whatsapp_conversations').insert({
            user_id: user_id || null,
            phone_number,
            role: 'assistant',
            content: `[ESCALADO] ${fallbackMessage}`,
            template_context_id: contact_id || null,
          });

          // Alert admin
          const adminPhone = aiSettings.admin_alert_phone;
          if (adminPhone) {
            const alertText = `🚨 *Escalação automática*\n\n📱 Número: ${phone_number}\n🔄 O agente IA atingiu o limite de ${maxRetries} tentativas sem resolver.\n💬 Última msg: "${message_text.substring(0, 200)}"\n\n_Necessária intervenção humana._`;
            await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
              body: JSON.stringify({ number: adminPhone.replace(/\D/g, ''), text: alertText }),
            });
          }
        }

        return okResponse({ success: true, reason: 'max_retries_escalated', max_retries: maxRetries }, traceId, corsHeaders);
      }
    }

    // 4. Save user message to history
    await supabase.from('whatsapp_conversations').insert({
      user_id: user_id || null,
      phone_number,
      role: 'user',
      content: message_text,
      template_context_id: contact_id || null,
    });

    // 4b. Fetch user context if we have a user_id
    let userContext = '';
    if (user_id) {
      const [profileRes, subsRes, quizRes] = await Promise.all([
        supabase.from('profiles').select('full_name, email, user_stage, user_objectives').eq('id', user_id).maybeSingle(),
        supabase.from('user_subscriptions').select('plan_type, status').eq('user_id', user_id).maybeSingle(),
        supabase.rpc('get_user_quiz_stats', { user_ids: [user_id] }),
      ]);

      const profile = profileRes.data;
      const subscription = subsRes.data;
      const stats = quizRes.data?.[0];

      if (profile) {
        userContext = `
Contexto do usuário:
- Nome: ${profile.full_name || 'Não informado'}
- Email: ${profile.email || 'Não informado'}
- Plano: ${subscription?.plan_type || 'free'}
- Estágio: ${profile.user_stage || 'explorador'}
- Objetivos: ${(profile.user_objectives || []).join(', ') || 'Não definidos'}
- Quizzes criados: ${stats?.quiz_count || 0}
- Leads coletados: ${stats?.lead_count || 0}`;
      }
    }

    // 5. Knowledge Base lookup — match keywords from user message
    let knowledgeContext = '';
    try {
      const messageLower = message_text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      const { data: allArticles } = await supabase
        .from('whatsapp_ai_knowledge')
        .select('title, content, keywords')
        .eq('is_active', true);

      if (allArticles && allArticles.length > 0) {
        const scored = allArticles.map((article: any) => {
          let score = 0;
          const keywords: string[] = article.keywords || [];
          for (const kw of keywords) {
            const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (messageLower.includes(kwNorm)) {
              score += kwNorm.length;
            }
          }
          return { ...article, score };
        });

        const relevant = scored
          .filter((a: any) => a.score > 0)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5);

        if (relevant.length > 0) {
          knowledgeContext = '\n\nBase de Conhecimento (use estas informações para responder com precisão):\n' +
            relevant.map((a: any) => `### ${a.title}\n${a.content}`).join('\n\n');
          console.log(`[WHATSAPP-AI] Found ${relevant.length} relevant KB articles`);
        }
      }
    } catch (kbError) {
      console.error('[WHATSAPP-AI] KB lookup error (non-fatal):', kbError);
    }

    // 6. Fetch conversation history
    const maxHistory = aiSettings.max_history_messages || 10;
    const { data: history } = await supabase
      .from('whatsapp_conversations')
      .select('role, content')
      .eq('phone_number', phone_number)
      .order('created_at', { ascending: false })
      .limit(maxHistory);

    const conversationHistory: ConversationMessage[] = (history || [])
      .reverse()
      .map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // 7. Build system prompt with knowledge base
    const systemPrompt = (aiSettings.system_prompt || 'Você é um assistente útil.') +
      (userContext ? `\n\n${userContext}` : '') +
      knowledgeContext;

    // 8. Call OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('[WHATSAPP-AI] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    console.log(`[WHATSAPP-AI] Calling OpenAI with ${messages.length} messages, system prompt length: ${systemPrompt.length}`);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`[WHATSAPP-AI] OpenAI error: ${openaiResponse.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReply = openaiData.choices?.[0]?.message?.content || '';
    const tokensUsed = openaiData.usage?.total_tokens || 0;

    if (!aiReply) {
      console.error('[WHATSAPP-AI] Empty AI response');
      throw new Error('Empty AI response');
    }

    console.log(`[WHATSAPP-AI] AI reply (${tokensUsed} tokens): "${aiReply.substring(0, 80)}..."`);

    // 9. Check if AI wants to escalate
    const shouldEscalate = aiReply.toLowerCase().includes('suporte humano') ||
                           aiReply.toLowerCase().includes('encaminhar') ||
                           aiReply.toLowerCase().includes('equipe de suporte');

    // 10. Send reply via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      console.error('[WHATSAPP-AI] Evolution API not configured');
      throw new Error('Evolution API not configured');
    }

    const { data: recoverySettings } = await supabase
      .from('recovery_settings')
      .select('instance_name')
      .limit(1)
      .maybeSingle();

    const instanceName = recoverySettings?.instance_name || 'masterquizz';
    const formattedNumber = phone_number.replace(/\D/g, '');

    const sendResponse = await fetch(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: aiReply,
        }),
      }
    );

    if (!sendResponse.ok) {
      const errText = await sendResponse.text();
      console.error(`[WHATSAPP-AI] Evolution send error: ${sendResponse.status} - ${errText}`);
      throw new Error(`Failed to send WhatsApp message: ${sendResponse.status}`);
    }

    console.log(`[WHATSAPP-AI] Reply sent to ${phone_number}`);

    // 11. Save assistant message
    await supabase.from('whatsapp_conversations').insert({
      user_id: user_id || null,
      phone_number,
      role: 'assistant',
      content: aiReply,
      template_context_id: contact_id || null,
      tokens_used: tokensUsed,
    });

    // 12. Escalate if needed
    if (shouldEscalate && user_id) {
      console.log(`[WHATSAPP-AI] Escalating to human support for ${phone_number}`);
      await supabase.from('support_tickets').insert({
        user_id,
        subject: `WhatsApp: dúvida de ${phone_number}`,
        message: `Usuário respondeu à mensagem de recuperação e a IA encaminhou para suporte humano.\n\nÚltima mensagem: "${message_text}"\n\nResposta da IA: "${aiReply}"`,
        status: 'open',
        priority: 'medium',
        source: 'whatsapp_ai',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply_sent: true,
        tokens_used: tokensUsed,
        escalated: shouldEscalate,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WHATSAPP-AI] Error:', error);

    try {
      const body = await new Response(error as any).text().catch(() => '');
      console.error('[WHATSAPP-AI] Error details:', body);
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
