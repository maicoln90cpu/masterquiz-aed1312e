import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir ataques XSS
 * Usado em todos os locais com dangerouslySetInnerHTML
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'img', 'sub', 'sup'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style', 'id',
      'src', 'alt', 'width', 'height', 'title'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
  });
};

/**
 * Sanitiza HTML com configuração mínima para textos simples
 * Usado para campos de texto curto como títulos e subtítulos
 */
export const sanitizeSimpleText = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'u', 's', 'strike', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitiza HTML para conteúdo rico (política de privacidade, termos)
 * Permite mais tags para formatação completa
 */
export const sanitizeRichContent = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'b', 'i', 'em', 'strong', 'u', 's', 'strike',
      'a', 'span', 'div',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption',
      'sub', 'sup', 'mark'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style', 'id',
      'src', 'alt', 'width', 'height', 'title',
      'colspan', 'rowspan', 'scope'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });
};
