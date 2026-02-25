// ══════════════════════════════════════════════════════════════════════
// Barrel — re-exporta templates modulares de src/data/templates/
// ══════════════════════════════════════════════════════════════════════
// IMPORTANTE: Este arquivo mantém compatibilidade com todos os imports
// existentes (Start.tsx, QuizTemplateSelector.tsx, useQuizTemplates.ts)

export type { QuizTemplate } from './templates/types';

// Re-export individual templates (para uso direto em Start.tsx etc.)
export {
  leadCaptureTemplate,
  vslConversionTemplate,
  paidTrafficTemplate,
  offerValidationTemplate,
  educationalTemplate,
  allBaseTemplates,
} from './templates/index';

// Re-export helpers (para quem precisar criar blocos)
export {
  questionBlock,
  textBlock,
  separatorBlock,
  socialProofBlock,
  comparisonBlock,
  countdownBlock,
  progressBlock,
  sliderBlock,
  testimonialBlock,
} from './templates/helpers';

// Array compatível com o nome antigo
import { allBaseTemplates } from './templates/index';
export const quizTemplates = allBaseTemplates;
