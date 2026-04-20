/**
 * Utilitários para manipular HTML em campos que podem conter
 * conteúdo do RichTextEditor (ex.: quiz_results.result_text).
 *
 * 🔒 REGRESSION SHIELD: Sempre use stripHtml() ao exportar para CSV/Excel,
 * exibir em listas resumidas, ou enviar para canais texto-puro (CRM, webhooks).
 */

/**
 * Remove todas as tags HTML e retorna apenas o texto.
 * Tolera valores nulos/undefined.
 */
export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Detecta se uma string contém marcação HTML (qualquer tag).
 * Usado para decidir entre renderização texto puro vs HTML sanitizado.
 */
export const hasHtml = (text: string | null | undefined): boolean => {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
};