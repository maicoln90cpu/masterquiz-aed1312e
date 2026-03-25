/**
 * Quiz Domain Types
 * Centralized TypeScript interfaces for the quiz system
 * These replace 'any' types throughout the codebase
 */

import type { QuizBlock, QuestionBlock } from './blocks';

// ============================================
// ENUMS (matching database enums)
// ============================================

export type AnswerFormat = 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text';
export type QuizStatus = 'draft' | 'active' | 'archived';
export type MediaType = 'image' | 'video';
export type CollectionTiming = 'none' | 'before' | 'after' | 'both';
export type ResultCondition = 'always' | 'score_range' | 'specific_answers';
export type PlanType = 'free' | 'partner' | 'premium' | 'paid' | 'professional' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'pending_validation';
export type AppRole = 'master_admin' | 'admin' | 'user';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

// ============================================
// QUIZ TYPES
// ============================================

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  slug: string | null;
  template: string;
  question_count: number;
  is_public: boolean;
  status: QuizStatus;
  logo_url: string | null;
  facebook_pixel_id: string | null;
  hide_branding: boolean | null;
  show_logo: boolean | null;
  show_title: boolean | null;
  show_description: boolean | null;
  show_question_number: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface QuizWithRelations extends Quiz {
  questions?: QuizQuestion[];
  results?: QuizResult[];
  form_config?: QuizFormConfig;
  analytics?: QuizAnalytics[];
  tags?: QuizTag[];
}

// ============================================
// QUESTION TYPES
// ============================================

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  answer_format: AnswerFormat;
  options: string[] | null;
  blocks: QuizBlock[] | null;
  media_type: MediaType | null;
  media_url: string | null;
  order_number: number;
  created_at: string;
  updated_at: string;
}

/** Local state representation of a question in the editor */
export interface EditorQuestion {
  id: string;
  quiz_id?: string;
  question_text: string;
  answer_format: AnswerFormat | string;
  options: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[];
  media_type?: MediaType | null;
  media_url?: string | null;
  order_number?: number;
  custom_label?: string;
  aiSuggestions?: AISuggestions;
}

export interface AISuggestions {
  suggestedMedia?: {
    type: 'image' | 'video';
    prompt?: string;
    url?: string;
  };
  additionalBlocks?: {
    type: string;
    content?: string;
    reason?: string;
  }[];
}

// ============================================
// RESULT TYPES
// ============================================

export interface QuizResult {
  id: string;
  quiz_id: string;
  result_text: string;
  image_url: string | null;
  video_url: string | null;
  redirect_url: string | null;
  button_text: string | null;
  condition_type: ResultCondition;
  condition_config: ResultConditionConfig | null;
  min_score: number | null;
  max_score: number | null;
  order_number: number;
  created_at: string;
  updated_at: string;
}

export interface ResultConditionConfig {
  minScore?: number;
  maxScore?: number;
  specificAnswers?: {
    questionId: string;
    answer: string | string[];
  }[];
}

// ============================================
// FORM CONFIG TYPES
// ============================================

export interface QuizFormConfig {
  id: string;
  quiz_id: string;
  collection_timing: CollectionTiming;
  collect_name: boolean;
  collect_email: boolean;
  collect_whatsapp: boolean;
  custom_fields: CustomField[] | null;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  field_options?: string[] | null;
  is_required: boolean;
  order_number: number;
}

// ============================================
// LEAD / RESPONSE TYPES
// ============================================

export interface Lead {
  id: string;
  quiz_id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_whatsapp: string | null;
  answers: QuizAnswers;
  custom_field_data: Record<string, string | boolean> | null;
  result_id: string | null;
  lead_status: LeadStatus | null;
  ip_address: string | null;
  user_agent: string | null;
  completed_at: string;
}

export interface QuizAnswers {
  [questionId: string]: string | string[];
}

export interface LeadWithQuiz extends Lead {
  quiz?: Quiz;
  result?: QuizResult;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface QuizAnalytics {
  id: string;
  quiz_id: string;
  date: string;
  views: number;
  starts: number;
  completions: number;
  conversion_rate: number | null;
  avg_completion_time: number | null;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalStarts: number;
  totalCompletions: number;
  avgConversionRate: number;
  avgCompletionTime: number;
}

// ============================================
// USER / PROFILE TYPES
// ============================================

export interface Profile {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  company_slug: string | null;
  facebook_pixel_id: string | null;
  gtm_container_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  quiz_limit: number;
  response_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by: string | null;
}

// ============================================
// SUBSCRIPTION PLAN TYPES
// ============================================

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_type: PlanType;
  price_monthly: number | null;
  quiz_limit: number;
  response_limit: number;
  lead_limit: number | null;
  questions_per_quiz_limit: number;
  features: string[] | null;
  allowed_templates: string[] | null;
  allow_facebook_pixel: boolean | null;
  allow_gtm: boolean | null;
  allow_export_pdf: boolean | null;
  allow_webhook: boolean | null;
  allow_quiz_sharing: boolean | null;
  allow_white_label: boolean | null;
  allow_custom_domain: boolean | null;
  allow_video_upload: boolean | null;
  video_storage_limit_mb: number | null;
  allow_ai_generation: boolean | null;
  ai_generations_per_month: number | null;
  kiwify_checkout_url: string | null;
  is_active: boolean | null;
  is_popular: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// TAG TYPES
// ============================================

export interface QuizTag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface QuizTagRelation {
  id: string;
  quiz_id: string;
  tag_id: string;
  created_at: string;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface QuizTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  is_active: boolean | null;
  is_premium: boolean | null;
  display_order: number | null;
  preview_config: TemplatePreviewConfig;
  full_config: TemplateFullConfig;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TemplatePreviewConfig {
  title: string;
  description: string;
  template: string;
  questionCount: number;
}

export interface TemplateFullConfig extends TemplatePreviewConfig {
  questions: EditorQuestion[];
  formConfig: {
    collect_name: boolean;
    collect_email: boolean;
    collect_whatsapp: boolean;
    collection_timing: CollectionTiming;
  };
  results?: Partial<QuizResult>[];
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface UserWebhook {
  id: string;
  user_id: string;
  webhook_url: string;
  webhook_secret: string | null;
  is_active: boolean | null;
  events: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WebhookLog {
  id: string;
  webhook_id: string | null;
  response_id: string | null;
  quiz_id: string | null;
  status: string | null;
  status_code: number | null;
  error_message: string | null;
  response_body: string | null;
  attempt_count: number | null;
  email: string | null;
  evento: string | null;
  produto: string | null;
  token: string | null;
  provider: string | null;
  created_at: string | null;
}

// ============================================
// AI GENERATION TYPES
// ============================================

export interface AIQuizGeneration {
  id: string;
  user_id: string;
  quiz_id: string | null;
  input_data: AIGenerationInput;
  questions_generated: number;
  model_used: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  generation_month: string;
  created_at: string | null;
}

export interface AIGenerationInput {
  mode: 'form' | 'pdf';
  productName?: string;
  problemSolved?: string;
  targetAudience?: string;
  desiredAction?: string;
  numberOfQuestions: number;
  pdfFileName?: string;
  pdfContent?: string;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// SUPPORT TICKET TYPES
// ============================================

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  category: 'suggestion' | 'bug' | 'question' | 'feature_request' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal_note: boolean | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ONBOARDING TYPES
// ============================================

export interface UserOnboarding {
  id: string;
  user_id: string;
  welcome_completed: boolean | null;
  dashboard_tour_completed: boolean | null;
  settings_tour_completed: boolean | null;
  analytics_tour_completed: boolean | null;
  crm_tour_completed: boolean | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

export const isQuestionBlock = (block: QuizBlock): block is QuestionBlock => {
  return block.type === 'question';
};

export const hasValidOptions = (question: EditorQuestion): boolean => {
  if (question.answer_format === 'short_text') return true;
  if (question.answer_format === 'yes_no') return true;
  return Array.isArray(question.options) && question.options.length >= 2;
};

export const isTemporaryId = (id: string): boolean => {
  return id.startsWith('temp-');
};

// ============================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================

// Block types are re-exported from ./blocks via ./index.ts
// Use: import type { QuizBlock, QuestionBlock } from '@/types';
// Or:  import type { Quiz, QuizQuestion } from '@/types/quiz';
