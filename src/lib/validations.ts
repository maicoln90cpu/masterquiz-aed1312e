import { z } from 'zod';
import { QUIZ, FILE_LIMITS } from './constants';

// =====================
// Common Validators
// =====================

export const uuidSchema = z.string().uuid("ID inválido");

export const emailSchema = z.union([
  z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  z.literal('')
]);

export const whatsappSchema = z.union([
  z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, "WhatsApp inválido. Use formato: +5511999999999"),
  z.literal('')
]);

export const slugSchema = z.union([
  z.string().trim().regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens").max(50, "Slug deve ter no máximo 50 caracteres"),
  z.literal('')
]);

export const gtmContainerSchema = z.union([
  z.string().trim().regex(/^GTM-[A-Z0-9]+$/, "GTM Container ID inválido. Formato: GTM-XXXXXXX"),
  z.literal('')
]);

export const pixelIdSchema = z.string().trim().max(50, "Pixel ID deve ter no máximo 50 caracteres");

// =====================
// Quiz Validations
// =====================

export const quizTitleSchema = z.string()
  .trim()
  .min(1, "Título é obrigatório")
  .max(QUIZ.MAX_TITLE_LENGTH, `Título deve ter no máximo ${QUIZ.MAX_TITLE_LENGTH} caracteres`);

export const quizDescriptionSchema = z.string()
  .trim()
  .max(QUIZ.MAX_DESCRIPTION_LENGTH, `Descrição deve ter no máximo ${QUIZ.MAX_DESCRIPTION_LENGTH} caracteres`)
  .optional();

export const questionTextSchema = z.string()
  .trim()
  .min(1, "Texto da pergunta é obrigatório")
  .max(QUIZ.MAX_QUESTION_TEXT_LENGTH, `Pergunta deve ter no máximo ${QUIZ.MAX_QUESTION_TEXT_LENGTH} caracteres`);

export const optionTextSchema = z.string()
  .trim()
  .min(1, "Opção não pode ser vazia")
  .max(QUIZ.MAX_OPTION_TEXT_LENGTH, `Opção deve ter no máximo ${QUIZ.MAX_OPTION_TEXT_LENGTH} caracteres`);

export const quizSchema = z.object({
  title: quizTitleSchema,
  description: quizDescriptionSchema,
  template: z.string().default('moderno'),
  is_public: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
});

// =====================
// Quiz Response Validation
// =====================

export const quizResponseSchema = z.object({
  name: z.string().trim().max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  email: emailSchema.optional(),
  whatsapp: whatsappSchema.optional(),
  customFields: z.record(z.string(), z.string().max(500, "Campo customizado deve ter no máximo 500 caracteres")).optional()
});

// =====================
// CRM Lead Validation
// =====================

export const leadStatusSchema = z.enum(['new', 'contacted', 'qualified', 'converted', 'lost'] as const);

export const leadSchema = z.object({
  respondent_name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  respondent_email: emailSchema.optional(),
  respondent_whatsapp: whatsappSchema.optional(),
  lead_status: leadStatusSchema.default('new'),
  custom_field_data: z.record(z.string(), z.string().max(500)).optional()
});

// =====================
// Profile Settings Validation
// =====================

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  company_slug: slugSchema.optional(),
  whatsapp: whatsappSchema.optional(),
  facebook_pixel_id: pixelIdSchema.optional(),
  gtm_container_id: gtmContainerSchema.optional()
});

// =====================
// Analytics Event Validation
// =====================

export const analyticsEventSchema = z.object({
  quizId: uuidSchema,
  event: z.enum(['view', 'start', 'complete'] as const)
});

// =====================
// File Upload Validation
// =====================

export const imageUploadSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, "Arquivo inválido")
    .refine((file) => file.size <= FILE_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024, 
      `Imagem deve ter no máximo ${FILE_LIMITS.MAX_IMAGE_SIZE_MB}MB`)
    .refine((file) => FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type as any), 
      "Formato de imagem não suportado"),
});

export const videoUploadSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, "Arquivo inválido")
    .refine((file) => file.size <= FILE_LIMITS.MAX_VIDEO_SIZE_MB * 1024 * 1024, 
      `Vídeo deve ter no máximo ${FILE_LIMITS.MAX_VIDEO_SIZE_MB}MB`)
    .refine((file) => FILE_LIMITS.ALLOWED_VIDEO_TYPES.includes(file.type as any), 
      "Formato de vídeo não suportado"),
});

export const audioUploadSchema = z.object({
  file: z.custom<File>((val) => val instanceof File, "Arquivo inválido")
    .refine((file) => file.size <= FILE_LIMITS.MAX_AUDIO_SIZE_MB * 1024 * 1024, 
      `Áudio deve ter no máximo ${FILE_LIMITS.MAX_AUDIO_SIZE_MB}MB`)
    .refine((file) => FILE_LIMITS.ALLOWED_AUDIO_TYPES.includes(file.type as any), 
      "Formato de áudio não suportado"),
});

// =====================
// Webhook Validation
// =====================

export const webhookUrlSchema = z.string()
  .url("URL inválida")
  .startsWith("https://", "URL deve usar HTTPS");

export const webhookSchema = z.object({
  webhook_url: webhookUrlSchema,
  is_active: z.boolean().default(true),
  events: z.array(z.string()).default(['quiz.response.completed']),
});

// =====================
// Auth Validation
// =====================

export const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const signupSchema = loginSchema;

export const passwordSchema = z.string()
  .min(6, "Senha deve ter no mínimo 6 caracteres");

// =====================
// Type Exports
// =====================

export type QuizResponse = z.infer<typeof quizResponseSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>;
export type Webhook = z.infer<typeof webhookSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type SignupCredentials = z.infer<typeof signupSchema>;
