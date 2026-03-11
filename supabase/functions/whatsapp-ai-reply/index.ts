import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { phone_number, message_text, user_id, contact_id } = await req.json();

    if (!phone_number || !message_text) {
      return new Response(
        JSON.stringify({ error: 'phone_number and message_text required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[WHATSAPP-AI] Processing message from ${phone_number}: "${message_text.substring(0, 50)}"`);

    // 0. Check blacklist — skip if number is blacklisted
    const { data: blacklisted } = await supabase
      .from('recovery_blacklist')
      .select('id')
      .eq('phone_number', phone_number)
      .limit(1);

    if (blacklisted && blacklisted.length > 0) {
      console.log(`[WHATSAPP-AI] Phone ${phone_number} is blacklisted, skipping`);
      return new Response(
        JSON.stringify({ success: false, reason: 'blacklisted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // 1. Check if AI is enabled
    const { data: aiSettings } = await supabase
      .from('whatsapp_ai_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!aiSettings?.is_enabled) {
      console.log('[WHATSAPP-AI] AI is disabled, skipping');
      return new Response(
        JSON.stringify({ success: false, reason: 'ai_disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Rate limiting: check messages in the last hour for this phone
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('phone_number', phone_number)
      .eq('role', 'assistant')
      .gte('created_at', oneHourAgo);

    if ((recentCount || 0) >= (aiSettings.rate_limit_per_hour || 30)) {
      console.log(`[WHATSAPP-AI] Rate limit reached for ${phone_number}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'rate_limited' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Save user message to history
    await supabase.from('whatsapp_conversations').insert({
      user_id: user_id || null,
      phone_number,
      role: 'user',
      content: message_text,
      template_context_id: contact_id || null,
    });

    // 4. Fetch user context if we have a user_id
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

    // 5. Fetch conversation history
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

    // 6. Build system prompt
    const systemPrompt = (aiSettings.system_prompt || 'Você é um assistente útil.') +
      (userContext ? `\n\n${userContext}` : '');

    // 7. Call OpenAI
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

    console.log(`[WHATSAPP-AI] Calling OpenAI with ${messages.length} messages`);

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

    // 8. Check if AI wants to escalate to human support
    const shouldEscalate = aiReply.toLowerCase().includes('suporte humano') ||
                           aiReply.toLowerCase().includes('encaminhar') ||
                           aiReply.toLowerCase().includes('equipe de suporte');

    // 9. Send reply via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      console.error('[WHATSAPP-AI] Evolution API not configured');
      throw new Error('Evolution API not configured');
    }

    // Get instance name from recovery_settings
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

    // 10. Save assistant message to history
    await supabase.from('whatsapp_conversations').insert({
      user_id: user_id || null,
      phone_number,
      role: 'assistant',
      content: aiReply,
      template_context_id: contact_id || null,
      tokens_used: tokensUsed,
    });

    // 11. If escalation needed, create support ticket
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

    // Try to send fallback message
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
