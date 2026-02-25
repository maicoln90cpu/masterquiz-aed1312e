import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * check-activation-24h
 * Identifica usuários no estágio 'explorador' que criaram conta há mais de 24h
 * mas não publicaram nenhum quiz, e enfileira mensagem de ativação via WhatsApp.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Verificar se sistema de recovery está conectado
    const { data: settings } = await supabase
      .from('recovery_settings')
      .select('is_connected, is_active')
      .single();

    if (!settings?.is_connected) {
      return new Response(
        JSON.stringify({ message: 'WhatsApp não conectado', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar template activation_reminder
    const { data: template } = await supabase
      .from('recovery_templates')
      .select('id')
      .eq('category', 'activation_reminder')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(1)
      .single();

    if (!template) {
      return new Response(
        JSON.stringify({ message: 'Nenhum template activation_reminder ativo', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar exploradores com conta > 24h, que têm WhatsApp
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const maxCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // max 7 dias

    const { data: explorers, error: expError } = await supabase
      .from('profiles')
      .select('id, full_name, whatsapp, created_at')
      .eq('user_stage', 'explorador')
      .not('whatsapp', 'is', null)
      .lt('created_at', cutoff)
      .gt('created_at', maxCutoff);

    if (expError) {
      console.error('Error fetching explorers:', expError);
      throw expError;
    }

    if (!explorers || explorers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum explorador elegível', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verificar quais NÃO têm quiz publicado (status = 'active')
    const explorerIds = explorers.map(e => e.id);

    const { data: publishedQuizzes } = await supabase
      .from('quizzes')
      .select('user_id')
      .in('user_id', explorerIds)
      .eq('status', 'active');

    const usersWithPublished = new Set((publishedQuizzes || []).map(q => q.user_id));

    // 5. Filtrar quem NÃO publicou
    const unpublished = explorers.filter(e => !usersWithPublished.has(e.id));

    if (unpublished.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Todos exploradores já publicaram', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Verificar blacklist e contatos já enviados com este template
    const { data: blacklist } = await supabase
      .from('recovery_blacklist')
      .select('user_id, phone_number');

    const blacklistedUsers = new Set((blacklist || []).map(b => b.user_id));
    const blacklistedPhones = new Set((blacklist || []).map(b => b.phone_number));

    const { data: alreadySent } = await supabase
      .from('recovery_contacts')
      .select('user_id')
      .eq('template_id', template.id)
      .in('user_id', unpublished.map(u => u.id));

    const alreadySentSet = new Set((alreadySent || []).map(c => c.user_id));

    // 7. Montar fila
    const toQueue = unpublished.filter(u =>
      !blacklistedUsers.has(u.id) &&
      !blacklistedPhones.has(u.whatsapp) &&
      !alreadySentSet.has(u.id)
    );

    if (toQueue.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Todos já foram contactados ou blacklisted', queued: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Inserir na fila
    const contacts = toQueue.map(u => ({
      user_id: u.id,
      phone_number: u.whatsapp!,
      template_id: template.id,
      status: 'pending' as const,
      priority: 10, // Alta prioridade — ativação
      days_inactive_at_contact: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      scheduled_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('recovery_contacts')
      .insert(contacts);

    if (insertError) {
      console.error('Error inserting activation contacts:', insertError);
      throw insertError;
    }

    console.log(`✅ [Activation 24h] Queued ${contacts.length} explorers for follow-up`);

    return new Response(
      JSON.stringify({
        message: `${contacts.length} exploradores enfileirados para ativação`,
        queued: contacts.length,
        total_eligible: unpublished.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('check-activation-24h error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
