/**
 * Helper compartilhado para registrar tentativas de execução de automações de email
 * na tabela `email_automation_logs`.
 *
 * REGRESSION SHIELD (Onda 1.5): garante que o input ORIGINAL é salvo no campo
 * `details` ANTES de qualquer tentativa de envio. Isso permite que o botão
 * "Reenviar" do painel admin recupere exatamente o que foi tentado, mesmo em
 * caso de falha, timeout ou erro de autenticação.
 *
 * Fluxo recomendado:
 *   const logId = await logAutomationAttempt(supabase, 'platform_news', input);
 *   try {
 *     // ... executa envio ...
 *     await finalizeAutomationLog(supabase, logId, 'success', sentCount, { ...result });
 *   } catch (err) {
 *     await finalizeAutomationLog(supabase, logId, 'error', 0, null, err.message);
 *   }
 */

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

/**
 * Cria um log inicial com status 'pending' contendo o input completo da tentativa.
 * Retorna o ID do log para atualização posterior.
 */
export async function logAutomationAttempt(
  supabase: SupabaseClient,
  automationKey: string,
  input: Record<string, unknown>,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('email_automation_logs')
      .insert({
        automation_key: automationKey,
        status: 'pending',
        emails_sent: 0,
        details: input,
      })
      .select('id')
      .single();
    if (error) {
      console.error('[automation-logger] failed to insert attempt:', error);
      return null;
    }
    return data?.id || null;
  } catch (e) {
    console.error('[automation-logger] exception inserting attempt:', e);
    return null;
  }
}

/**
 * Finaliza um log existente, atualizando status, contagem de envios e detalhes.
 * Mescla `extraDetails` com o input original já salvo.
 */
export async function finalizeAutomationLog(
  supabase: SupabaseClient,
  logId: string | null,
  status: 'success' | 'skipped' | 'error',
  emailsSent: number,
  extraDetails: Record<string, unknown> | null = null,
  errorMessage: string | null = null,
): Promise<void> {
  try {
    if (logId) {
      // Recupera details atual (input original) e mescla com novos campos
      const { data: existing } = await supabase
        .from('email_automation_logs')
        .select('details')
        .eq('id', logId)
        .single();

      const mergedDetails = {
        ...(existing?.details || {}),
        ...(extraDetails || {}),
      };

      await supabase
        .from('email_automation_logs')
        .update({
          status,
          emails_sent: emailsSent,
          details: mergedDetails,
          error_message: errorMessage,
        })
        .eq('id', logId);
    } else {
      // Fallback: insere log direto se a tentativa inicial falhou
      await supabase.from('email_automation_logs').insert({
        automation_key: 'unknown',
        status,
        emails_sent: emailsSent,
        details: extraDetails,
        error_message: errorMessage,
      });
    }

    // Atualiza contador de execuções
    const { data: existingLog } = await supabase
      .from('email_automation_logs')
      .select('automation_key')
      .eq('id', logId)
      .single();

    const key = existingLog?.automation_key;
    if (key) {
      const { data: config } = await supabase
        .from('email_automation_config')
        .select('execution_count')
        .eq('automation_key', key)
        .single();
      await supabase
        .from('email_automation_config')
        .update({
          last_executed_at: new Date().toISOString(),
          last_result: { status, emails_sent: emailsSent, timestamp: new Date().toISOString() },
          execution_count: (config?.execution_count || 0) + 1,
        })
        .eq('automation_key', key);
    }
  } catch (e) {
    console.error('[automation-logger] failed to finalize:', e);
  }
}