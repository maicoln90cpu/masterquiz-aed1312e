// ──────────────────────────────────────────────────────────────────────
// Helpers para criação de blocos em templates de quiz
// ──────────────────────────────────────────────────────────────────────

type Option = { text: string; value: string };

export function questionBlock(id: string, text: string, opts: Option[], format = 'single_choice', order = 1) {
  return {
    id: `block-${id}-question`,
    type: 'question',
    order,
    content: text,
    options: opts,
    answerFormat: format,
    required: true,
    autoAdvance: false,
  };
}

export function textBlock(id: string, html: string, order = 0) {
  return { id: `block-${id}-text`, type: 'text', order, content: html, fontSize: 'medium', textAlign: 'left' };
}

export function separatorBlock(id: string, order = 0) {
  return { id: `block-${id}-sep`, type: 'separator', order, content: '', style: 'solid' };
}

export function socialProofBlock(id: string, order: number, items: Array<{ name: string; text: string; rating?: number }>) {
  return {
    id: `block-${id}-social`,
    type: 'social_proof',
    order,
    notifications: items.map((i, idx) => ({
      id: `sp-${id}-${idx}`,
      name: i.name,
      text: i.text,
      rating: i.rating ?? 5,
      timeAgo: `${Math.floor(Math.random() * 20) + 1}min atrás`,
    })),
  };
}

export function comparisonBlock(id: string, order: number, before: { title: string; items: string[] }, after: { title: string; items: string[] }) {
  return {
    id: `block-${id}-comp`,
    type: 'comparison',
    order,
    beforeTitle: before.title,
    afterTitle: after.title,
    beforeItems: before.items,
    afterItems: after.items,
  };
}

export function countdownBlock(id: string, order: number, minutes: number, label: string) {
  return { id: `block-${id}-cd`, type: 'countdown', order, minutes, label, showProgress: true };
}

export function progressBlock(id: string, order: number, value: number, label: string) {
  return { id: `block-${id}-prog`, type: 'progress', order, value, label, showPercentage: true };
}

export function sliderBlock(id: string, order: number, label: string, min: number, max: number, step: number, unit: string) {
  return { id: `block-${id}-slider`, type: 'slider', order, label, min, max, step, unit, showValue: true, required: true };
}

export function testimonialBlock(id: string, order: number, quote: string, authorName: string, authorRole: string, rating = 5) {
  return {
    id: `block-${id}-testimonial`,
    type: 'testimonial',
    order,
    quote,
    authorName,
    authorRole,
    rating,
    showRating: true,
    style: 'card',
  };
}
