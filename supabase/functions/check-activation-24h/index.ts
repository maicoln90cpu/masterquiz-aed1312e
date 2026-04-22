import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getTraceId, okResponse, errorResponse } from '../_shared/envelope.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * check-activation-24h
 * Identifica usuários no estágio 'explorador' que criaram conta há mais de 24h
 * mas não publicaram nenhum quiz, e enfileira mensagem de ativação via WhatsApp.
 * Diferencia mensagens: "criou draft mas não publicou" vs "não criou nada".
 */
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

    // 1. Verificar se sistema de recovery está conectado
    const { data: settings } = await supabase
      .from('recovery_settings')
      .select('is_connected, is_active')
      .maybeSingle();

    if (!settings?.is_connected) {
      return okResponse({ message: 'WhatsApp não conectado', queued: 0 }, traceId, corsHeaders);
    }

    // 2. Buscar templates: activation_reminder (genérico) e activation_draft (para quem tem draft)
    const { data: templates } = await supabase
      .from('recovery_templates')
      .select('id, category')
      .in('category', ['activation_reminder', 'activation_draft'])
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const templateReminder = templates?.find(t => t.category === 'activation_reminder');
    const templateDraft = templates?.find(t => t.category === 'activation_draft');

    // Precisa de pelo menos o template genérico
    if (!templateReminder) {
      return okResponse({ message: 'Nenhum template activation_reminder ativo', queued: 0 }, traceId, corsHeaders);
    }

    // 3. Buscar exploradores com conta > 24h, que têm WhatsApp
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const maxCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

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
      return okResponse({ message: 'Nenhum explorador elegível', queued: 0 }, traceId, corsHeaders);
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
      return okResponse({ message: 'Todos exploradores já publicaram', queued: 0 }, traceId, corsHeaders);
    }

    // 5b. Verificar quem tem draft (criou mas não publicou) vs quem não criou nada
    const { data: draftQuizzes } = await supabase
      .from('quizzes')
      .select('user_id')
      .in('user_id', unpublished.map(u => u.id))
      .eq('status', 'draft');

    const usersWithDraft = new Set((draftQuizzes || []).map(q => q.user_id));

    // 6. Verificar blacklist e contatos já enviados
    const { data: blacklist } = await supabase
      .from('recovery_blacklist')
      .select('user_id, phone_number');

    const blacklistedUsers = new Set((blacklist || []).map(b => b.user_id));
    const blacklistedPhones = new Set((blacklist || []).map(b => b.phone_number));

    // Verificar se já receberam qualquer template de activation
    const templateIds = [templateReminder.id, ...(templateDraft ? [templateDraft.id] : [])];
    const { data: alreadySent } = await supabase
      .from('recovery_contacts')
      .select('user_id')
      .in('template_id', templateIds)
      .in('user_id', unpublished.map(u => u.id));

    const alreadySentSet = new Set((alreadySent || []).map(c => c.user_id));

    // 7. Montar fila com template diferenciado
    const toQueue = unpublished.filter(u =>
      !blacklistedUsers.has(u.id) &&
      !blacklistedPhones.has(u.whatsapp) &&
      !alreadySentSet.has(u.id)
    );

    if (toQueue.length === 0) {
      return okResponse({ message: 'Todos já foram contactados ou blacklisted', queued: 0 }, traceId, corsHeaders);
    }

    // 8. Inserir na fila — usar template_draft para quem tem draft, template_reminder para quem não criou nada
    const contacts = toQueue.map(u => ({
      user_id: u.id,
      phone_number: u.whatsapp!,
      template_id: (usersWithDraft.has(u.id) && templateDraft) ? templateDraft.id : templateReminder.id,
      status: 'pending' as const,
      priority: 10,
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

    const draftCount = contacts.filter(c => c.template_id === templateDraft?.id).length;
    const noQuizCount = contacts.length - draftCount;

    console.log(`✅ [Activation 24h] Queued ${contacts.length} explorers (${draftCount} with draft, ${noQuizCount} no quiz)`);

    return okResponse({
      message: `${contacts.length} exploradores enfileirados para ativação`,
      queued: contacts.length,
      with_draft: draftCount,
      no_quiz: noQuizCount,
      total_eligible: unpublished.length,
    }, traceId, corsHeaders);
  } catch (error) {
    console.error('check-activation-24h error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro interno', traceId, corsHeaders);
  }
});
