// Barrel export — todos os templates modulares
export type { QuizTemplate } from './types';

export { leadCaptureTemplate } from './lead-capture';
export { vslConversionTemplate } from './vsl-conversion';
export { paidTrafficTemplate } from './paid-traffic';
export { offerValidationTemplate } from './offer-validation';
export { educationalTemplate } from './educational';

// Re-export helpers para uso externo
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
} from './helpers';

// Array consolidado de todos os templates base (não-premium)
import { leadCaptureTemplate } from './lead-capture';
import { vslConversionTemplate } from './vsl-conversion';
import { paidTrafficTemplate } from './paid-traffic';
import { offerValidationTemplate } from './offer-validation';
import { educationalTemplate } from './educational';

export const allBaseTemplates = [
  leadCaptureTemplate,
  vslConversionTemplate,
  paidTrafficTemplate,
  offerValidationTemplate,
  educationalTemplate,
];
