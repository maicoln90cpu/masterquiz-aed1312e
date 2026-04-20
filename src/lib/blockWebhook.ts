import { logger } from '@/lib/logger';
/**
 * ✅ Etapa 4: Disparo de webhook por campo individual
 * Envia dados do campo para URL configurada no bloco
 */
export async function fireBlockWebhook(
  webhookUrl: string,
  payload: {
    blockType: string;
    blockId: string;
    label: string;
    value: string | number;
    timestamp: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const url = new URL(webhookUrl);
    // Whitelist de protocolos
    if (!['http:', 'https:'].includes(url.protocol)) {
      logger.warn('[BlockWebhook] Protocolo não permitido:', url.protocol);
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'block_field_submit',
        ...payload,
      }),
      // Não bloquear a UX — fire and forget com timeout
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch (error) {
    logger.warn('[BlockWebhook] Erro ao disparar webhook:', error);
    return false;
  }
}
