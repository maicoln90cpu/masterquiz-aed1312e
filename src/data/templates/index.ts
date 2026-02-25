// Barrel export — todos os templates modulares
export type { QuizTemplate } from './types';

export { leadCaptureTemplate } from './lead-capture';
export { vslConversionTemplate } from './vsl-conversion';
export { paidTrafficTemplate } from './paid-traffic';
export { offerValidationTemplate } from './offer-validation';
export { educationalTemplate } from './educational';
export { healthWellnessTemplate } from './health-wellness';
export { incomeOpportunityTemplate } from './income-opportunity';
export { diagnosticExamTemplate } from './diagnostic-exam';
export { courseOnboardingTemplate } from './course-onboarding';

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
import { healthWellnessTemplate } from './health-wellness';
import { incomeOpportunityTemplate } from './income-opportunity';
import { diagnosticExamTemplate } from './diagnostic-exam';
import { courseOnboardingTemplate } from './course-onboarding';

export const allBaseTemplates = [
  leadCaptureTemplate,
  vslConversionTemplate,
  paidTrafficTemplate,
  offerValidationTemplate,
  educationalTemplate,
  healthWellnessTemplate,
  incomeOpportunityTemplate,
  diagnosticExamTemplate,
  courseOnboardingTemplate,
];
