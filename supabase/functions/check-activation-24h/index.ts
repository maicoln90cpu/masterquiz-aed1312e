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

    // === BLOCO EMAIL — 24h após publicação do PRIMEIRO quiz real ===
    // Roda independentemente do status do WhatsApp.
    let emailQueued = 0;
    try {
      const { data: emailSettings } = await supabase
        .from('email_recovery_settings')
        .select('is_active')
        .maybeSingle();

      if (!emailSettings || emailSettings.is_active !== false) {
        const { data: activationTpl } = await supabase
          .from('email_recovery_templates')
          .select('id')
          .eq('category', 'activation')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activationTpl?.id) {
          // Janela 20h–28h após first_published_at
          const windowEnd = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
          const windowStart = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString();

          const { data: recentQuizzes } = await supabase
            .from('quizzes')
            .select('id, user_id, first_published_at, creation_source')
            .eq('status', 'active')
            .neq('creation_source', 'express_auto')
            .gte('first_published_at', windowStart)
            .lte('first_published_at', windowEnd);

          if (recentQuizzes && recentQuizzes.length > 0) {
            const userIds = Array.from(new Set(recentQuizzes.map(q => q.user_id)));

            // Chunking ≤150 IDs
            const chunk = <T,>(arr: T[], n: number): T[][] => {
              const out: T[][] = [];
              for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
              return out;
            };

            const profilesAll: Array<{ id: string; email: string | null }> = [];
            for (const ids of chunk(userIds, 150)) {
              const { data } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', ids);
              if (data) profilesAll.push(...data);
            }

            // Filtra emails válidos e não-institucionais (heurística básica: ignora vazios)
            const candidates = profilesAll.filter(p => p.email && p.email.includes('@'));

            if (candidates.length > 0) {
              // Verifica unsubscribes
              const emails = candidates.map(c => c.email!);
              const unsubsAll: string[] = [];
              for (const eChunk of chunk(emails, 150)) {
                const { data: u } = await supabase
                  .from('email_unsubscribes')
                  .select('email')
                  .in('email', eChunk);
                if (u) unsubsAll.push(...u.map(x => x.email));
              }
              const unsubSet = new Set(unsubsAll);

              // Filtro de domínios institucionais
              const { data: institutionalData } = await supabase
                .from('institutional_email_domains')
                .select('domain')
                .eq('is_active', true);
              const institutionalDomains = new Set(
                (institutionalData || []).map((d: { domain: string }) => d.domain.toLowerCase())
              );

              // Verifica quem já recebeu este template
              const candidateIds = candidates.map(c => c.id);
              const alreadySent = new Set<string>();
              for (const ids of chunk(candidateIds, 150)) {
                const { data: sent } = await supabase
                  .from('email_recovery_contacts')
                  .select('user_id')
                  .eq('template_id', activationTpl.id)
                  .in('user_id', ids);
                if (sent) sent.forEach(s => alreadySent.add(s.user_id));
              }

              const toEnqueue = candidates.filter(c => {
                if (!c.email) return false;
                if (unsubSet.has(c.email)) return false;
                if (alreadySent.has(c.id)) return false;
                const domain = c.email.split('@')[1]?.toLowerCase() || '';
                const isInstitutional = [...institutionalDomains].some(
                  d => domain === d || domain.endsWith('.' + d)
                );
                return !isInstitutional;
              });

              if (toEnqueue.length > 0) {
                const rows = toEnqueue.map(c => ({
                  user_id: c.id,
                  email: c.email!,
                  template_id: activationTpl.id,
                  status: 'pending' as const,
                  priority: 10,
                  days_inactive_at_contact: 1,
                  scheduled_at: new Date().toISOString(),
                  user_plan_at_contact: 'free',
                }));
                const { error: insErr, count } = await supabase
                  .from('email_recovery_contacts')
                  .insert(rows, { count: 'exact' });
                if (insErr) {
                  console.error('[Activation 24h Email] insert error:', insErr);
                } else {
                  emailQueued = count ?? rows.length;
                  console.log(`✅ [Activation 24h Email] Queued ${emailQueued}`);
                }
              }
            }
          }
        }
      }
    } catch (emailErr) {
      console.error('[Activation 24h Email] block error:', emailErr);
    }

    // === BLOCO WHATSAPP (original) — early-return movido para cá ===
    const { data: settings } = await supabase
      .from('recovery_settings')
      .select('is_connected, is_active')
      .maybeSingle();

    if (!settings?.is_connected) {
      return okResponse(
        { message: 'WhatsApp não conectado (email block executado)', queued: 0, email_queued: emailQueued },
        traceId,
        corsHeaders
      );
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
      return okResponse({ message: 'Nenhum template activation_reminder ativo', queued: 0, email_queued: emailQueued }, traceId, corsHeaders);
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
      return okResponse({ message: 'Nenhum explorador elegível', queued: 0, email_queued: emailQueued }, traceId, corsHeaders);
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
      return okResponse({ message: 'Todos exploradores já publicaram', queued: 0, email_queued: emailQueued }, traceId, corsHeaders);
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
      return okResponse({ message: 'Todos já foram contactados ou blacklisted', queued: 0, email_queued: emailQueued }, traceId, corsHeaders);
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
      email_queued: emailQueued,
    }, traceId, corsHeaders);
  } catch (error) {
    console.error('check-activation-24h error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Erro interno', traceId, corsHeaders);
  }
});
