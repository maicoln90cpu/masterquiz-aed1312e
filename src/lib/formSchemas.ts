import { z } from "zod";

/**
 * Validation schema for visitor form configuration
 */
export const visitorFormConfigSchema = z.object({
  collectionTiming: z.union([
    z.literal('none'),
    z.literal('before'),
    z.literal('after'),
    z.literal('both')
  ]),
  collectName: z.boolean(),
  collectEmail: z.boolean(),
  collectWhatsapp: z.boolean(),
}).refine(
  (data) => {
    // At least one field must be collected if timing is not 'none'
    if (data.collectionTiming !== 'none') {
      return data.collectName || data.collectEmail || data.collectWhatsapp;
    }
    return true;
  },
  {
    message: "Selecione pelo menos um campo para coletar",
    path: ["collectName"]
  }
);

/**
 * Validation schema for custom form fields
 */
export const customFieldSchema = z.object({
  field_name: z.string()
    .trim()
    .min(1, "Nome do campo é obrigatório")
    .max(100, "Nome do campo deve ter no máximo 100 caracteres"),
  field_type: z.union([
    z.literal('text'),
    z.literal('email'),
    z.literal('phone'),
    z.literal('select'),
    z.literal('textarea'),
    z.literal('checkbox')
  ]),
  is_required: z.boolean(),
  field_options: z.array(z.string()).optional(),
  order_number: z.number().int().min(0)
}).refine(
  (data) => {
    // If type is 'select', field_options must be provided and not empty
    if (data.field_type === 'select') {
      return data.field_options && data.field_options.length > 0;
    }
    return true;
  },
  {
    message: "Campo do tipo 'select' deve ter pelo menos uma opção",
    path: ["field_options"]
  }
);

/**
 * Validation schema for quiz duplicate name
 */
export const duplicateQuizNameSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-Z0-9\s\-_áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]+$/, 
      "Nome deve conter apenas letras, números, espaços e hífens")
});

/**
 * Validation schema for quiz basic info
 */
export const quizBasicInfoSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string()
    .trim()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  logo_url: z.string().url("URL da logo inválida").optional().or(z.literal('')),
});

export type VisitorFormConfig = z.infer<typeof visitorFormConfigSchema>;
export type CustomField = z.infer<typeof customFieldSchema>;
export type DuplicateQuizName = z.infer<typeof duplicateQuizNameSchema>;
export type QuizBasicInfo = z.infer<typeof quizBasicInfoSchema>;
