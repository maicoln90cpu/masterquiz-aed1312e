// ──────────────────────────────────────────────────────────────────────
// Helpers para criação de blocos em templates de quiz
// Alinhados com os tipos em src/types/blocks.ts
// ──────────────────────────────────────────────────────────────────────

type Option = { text: string; value: string };

export function questionBlock(id: string, text: string, opts: Option[], format = 'single_choice', order = 1) {
  return {
    id: `block-${id}-question`,
    type: 'question' as const,
    order,
    questionText: text,
    options: opts.map(o => o.text),
    answerFormat: format,
    required: true,
    autoAdvance: false,
  };
}

export function textBlock(id: string, html: string, order = 0) {
  return {
    id: `block-${id}-text`,
    type: 'text' as const,
    order,
    content: html,
    fontSize: 'medium' as const,
    alignment: 'left' as const,
  };
}

export function separatorBlock(id: string, order = 0) {
  return {
    id: `block-${id}-sep`,
    type: 'separator' as const,
    order,
    style: 'line' as const,
    thickness: 'medium' as const,
  };
}

export function socialProofBlock(id: string, order: number, items: Array<{ name: string; text: string; rating?: number }>) {
  return {
    id: `block-${id}-social`,
    type: 'socialProof' as const,
    order,
    notifications: items.map((i, idx) => ({
      id: `sp-${id}-${idx}`,
      name: i.name,
      action: i.text,
      time: `${Math.floor(Math.random() * 20) + 1}min atrás`,
    })),
    interval: 5,
    style: 'toast' as const,
    position: 'bottom-left' as const,
    showAvatar: true,
  };
}

export function comparisonBlock(id: string, order: number, before: { title: string; items: string[] }, after: { title: string; items: string[] }) {
  return {
    id: `block-${id}-comp`,
    type: 'comparison' as const,
    order,
    leftTitle: before.title,
    rightTitle: after.title,
    leftItems: before.items,
    rightItems: after.items,
    leftStyle: 'negative' as const,
    rightStyle: 'positive' as const,
    showIcons: true,
  };
}

export function countdownBlock(id: string, order: number, minutes: number, label: string) {
  return {
    id: `block-${id}-cd`,
    type: 'countdown' as const,
    order,
    mode: 'duration' as const,
    duration: minutes * 60,
    showDays: false,
    showHours: false,
    showMinutes: true,
    showSeconds: true,
    style: 'default' as const,
    expiryMessage: label,
    expiryAction: 'none' as const,
  };
}

export function progressBlock(id: string, order: number, _value: number, _label: string) {
  return {
    id: `block-${id}-prog`,
    type: 'progress' as const,
    order,
    style: 'bar' as const,
    showPercentage: true,
    showCounter: false,
    height: 'medium' as const,
    animated: true,
  };
}

export function sliderBlock(id: string, order: number, label: string, min: number, max: number, step: number, unit: string) {
  return {
    id: `block-${id}-slider`,
    type: 'slider' as const,
    order,
    label,
    min,
    max,
    step,
    unit,
    showValue: true,
    required: true,
  };
}

export function testimonialBlock(id: string, order: number, quote: string, authorName: string, authorRole: string, rating = 5) {
  return {
    id: `block-${id}-testimonial`,
    type: 'testimonial' as const,
    order,
    quote,
    authorName,
    authorRole,
    rating,
    showRating: true,
    style: 'card' as const,
  };
}
