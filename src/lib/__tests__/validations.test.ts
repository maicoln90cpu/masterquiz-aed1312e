import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  emailSchema,
  whatsappSchema,
  slugSchema,
  gtmContainerSchema,
  pixelIdSchema,
  quizTitleSchema,
  quizDescriptionSchema,
  questionTextSchema,
  optionTextSchema,
  quizSchema,
  quizResponseSchema,
  leadStatusSchema,
  leadSchema,
  profileSettingsSchema,
  analyticsEventSchema,
  webhookUrlSchema,
  webhookSchema,
  loginSchema,
  signupSchema,
  passwordSchema,
} from '../validations';

// ============================================================
// UUID VALIDATION
// ============================================================
describe('uuidSchema', () => {
  it('aceita UUID válido', () => {
    const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
    expect(result.success).toBe(true);
  });

  it('rejeita UUID inválido', () => {
    const result = uuidSchema.safeParse('invalid-uuid');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('ID inválido');
  });

  it('rejeita string vazia', () => {
    const result = uuidSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

// ============================================================
// EMAIL VALIDATION
// ============================================================
describe('emailSchema', () => {
  it('aceita email válido', () => {
    const result = emailSchema.safeParse('test@example.com');
    expect(result.success).toBe(true);
  });

  it('aceita string vazia (opcional)', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
  });

  it('rejeita email sem @', () => {
    const result = emailSchema.safeParse('testexample.com');
    expect(result.success).toBe(false);
  });

  it('rejeita email muito longo', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    const result = emailSchema.safeParse(longEmail);
    expect(result.success).toBe(false);
  });

  it('remove espaços em branco', () => {
    const result = emailSchema.safeParse('  test@example.com  ');
    expect(result.success).toBe(true);
  });
});

// ============================================================
// WHATSAPP VALIDATION
// ============================================================
describe('whatsappSchema', () => {
  it('aceita número com código de país', () => {
    const result = whatsappSchema.safeParse('+5511999999999');
    expect(result.success).toBe(true);
  });

  it('aceita número sem +', () => {
    const result = whatsappSchema.safeParse('5511999999999');
    expect(result.success).toBe(true);
  });

  it('aceita string vazia (opcional)', () => {
    const result = whatsappSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('rejeita número com letras', () => {
    const result = whatsappSchema.safeParse('+55abc99999999');
    expect(result.success).toBe(false);
  });

  it('rejeita número iniciando com 0', () => {
    const result = whatsappSchema.safeParse('0511999999999');
    expect(result.success).toBe(false);
  });

  it('rejeita número muito curto', () => {
    const result = whatsappSchema.safeParse('+55');
    expect(result.success).toBe(false);
  });
});

// ============================================================
// SLUG VALIDATION
// ============================================================
describe('slugSchema', () => {
  it('aceita slug válido', () => {
    const result = slugSchema.safeParse('meu-quiz-123');
    expect(result.success).toBe(true);
  });

  it('aceita string vazia (opcional)', () => {
    const result = slugSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('rejeita slug com letras maiúsculas', () => {
    const result = slugSchema.safeParse('Meu-Quiz');
    expect(result.success).toBe(false);
  });

  it('rejeita slug com espaços', () => {
    const result = slugSchema.safeParse('meu quiz');
    expect(result.success).toBe(false);
  });

  it('rejeita slug com caracteres especiais', () => {
    const result = slugSchema.safeParse('meu_quiz!');
    expect(result.success).toBe(false);
  });

  it('rejeita slug muito longo', () => {
    const longSlug = 'a'.repeat(51);
    const result = slugSchema.safeParse(longSlug);
    expect(result.success).toBe(false);
  });
});

// ============================================================
// GTM CONTAINER VALIDATION
// ============================================================
describe('gtmContainerSchema', () => {
  it('aceita GTM container válido', () => {
    const result = gtmContainerSchema.safeParse('GTM-ABCD123');
    expect(result.success).toBe(true);
  });

  it('aceita string vazia (opcional)', () => {
    const result = gtmContainerSchema.safeParse('');
    expect(result.success).toBe(true);
  });

  it('rejeita GTM sem prefixo', () => {
    const result = gtmContainerSchema.safeParse('ABCD123');
    expect(result.success).toBe(false);
  });

  it('rejeita GTM com letras minúsculas', () => {
    const result = gtmContainerSchema.safeParse('GTM-abcd123');
    expect(result.success).toBe(false);
  });
});

// ============================================================
// PIXEL ID VALIDATION
// ============================================================
describe('pixelIdSchema', () => {
  it('aceita pixel ID válido', () => {
    const result = pixelIdSchema.safeParse('123456789012345');
    expect(result.success).toBe(true);
  });

  it('rejeita pixel ID muito longo', () => {
    const longPixel = '1'.repeat(51);
    const result = pixelIdSchema.safeParse(longPixel);
    expect(result.success).toBe(false);
  });
});

// ============================================================
// QUIZ TITLE VALIDATION
// ============================================================
describe('quizTitleSchema', () => {
  it('aceita título válido', () => {
    const result = quizTitleSchema.safeParse('Meu Quiz Incrível');
    expect(result.success).toBe(true);
  });

  it('rejeita título vazio', () => {
    const result = quizTitleSchema.safeParse('');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Título é obrigatório');
  });

  it('rejeita título apenas com espaços', () => {
    const result = quizTitleSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });
});

// ============================================================
// QUIZ SCHEMA (FULL)
// ============================================================
describe('quizSchema', () => {
  it('aceita quiz completo válido', () => {
    const result = quizSchema.safeParse({
      title: 'Quiz Teste',
      description: 'Descrição do quiz',
      template: 'moderno',
      is_public: true,
      status: 'active',
    });
    expect(result.success).toBe(true);
  });

  it('aceita quiz com valores padrão', () => {
    const result = quizSchema.safeParse({
      title: 'Quiz Simples',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.template).toBe('moderno');
      expect(result.data.is_public).toBe(false);
      expect(result.data.status).toBe('draft');
    }
  });

  it('rejeita status inválido', () => {
    const result = quizSchema.safeParse({
      title: 'Quiz',
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// QUIZ RESPONSE VALIDATION
// ============================================================
describe('quizResponseSchema', () => {
  it('aceita resposta completa', () => {
    const result = quizResponseSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      whatsapp: '+5511999999999',
    });
    expect(result.success).toBe(true);
  });

  it('aceita resposta vazia (todos opcionais)', () => {
    const result = quizResponseSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('aceita campos customizados', () => {
    const result = quizResponseSchema.safeParse({
      customFields: {
        empresa: 'Acme Corp',
        cargo: 'Desenvolvedor',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejeita campo customizado muito longo', () => {
    const result = quizResponseSchema.safeParse({
      customFields: {
        campo: 'a'.repeat(501),
      },
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// LEAD VALIDATION
// ============================================================
describe('leadSchema', () => {
  it('aceita lead válido', () => {
    const result = leadSchema.safeParse({
      respondent_name: 'Maria',
      respondent_email: 'maria@example.com',
      lead_status: 'new',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita lead sem nome', () => {
    const result = leadSchema.safeParse({
      respondent_email: 'test@example.com',
    });
    expect(result.success).toBe(false);
  });

  it('aplica valores padrão', () => {
    const result = leadSchema.safeParse({
      respondent_name: 'Pedro',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lead_status).toBe('new');
    }
  });
});

describe('leadStatusSchema', () => {
  it('aceita todos os status válidos', () => {
    const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
    statuses.forEach(status => {
      const result = leadStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it('rejeita status inválido', () => {
    const result = leadStatusSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

// ============================================================
// PROFILE SETTINGS VALIDATION
// ============================================================
describe('profileSettingsSchema', () => {
  it('aceita perfil completo', () => {
    const result = profileSettingsSchema.safeParse({
      full_name: 'João Silva',
      company_slug: 'minha-empresa',
      whatsapp: '+5511999999999',
      facebook_pixel_id: '123456789',
      gtm_container_id: 'GTM-ABC123',
    });
    expect(result.success).toBe(true);
  });

  it('aceita perfil vazio (todos opcionais)', () => {
    const result = profileSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ============================================================
// ANALYTICS EVENT VALIDATION
// ============================================================
describe('analyticsEventSchema', () => {
  it('aceita evento válido', () => {
    const result = analyticsEventSchema.safeParse({
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      event: 'view',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita evento inválido', () => {
    const result = analyticsEventSchema.safeParse({
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      event: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita UUID inválido', () => {
    const result = analyticsEventSchema.safeParse({
      quizId: 'not-a-uuid',
      event: 'start',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// WEBHOOK VALIDATION
// ============================================================
describe('webhookUrlSchema', () => {
  it('aceita URL HTTPS válida', () => {
    const result = webhookUrlSchema.safeParse('https://example.com/webhook');
    expect(result.success).toBe(true);
  });

  it('rejeita URL HTTP (não segura)', () => {
    const result = webhookUrlSchema.safeParse('http://example.com/webhook');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('URL deve usar HTTPS');
  });

  it('rejeita URL inválida', () => {
    const result = webhookUrlSchema.safeParse('not-a-url');
    expect(result.success).toBe(false);
  });
});

describe('webhookSchema', () => {
  it('aceita webhook completo', () => {
    const result = webhookSchema.safeParse({
      webhook_url: 'https://example.com/webhook',
      is_active: true,
      events: ['quiz.response.completed'],
    });
    expect(result.success).toBe(true);
  });

  it('aplica valores padrão', () => {
    const result = webhookSchema.safeParse({
      webhook_url: 'https://example.com/hook',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.events).toContain('quiz.response.completed');
    }
  });
});

// ============================================================
// AUTH VALIDATION
// ============================================================
describe('loginSchema', () => {
  it('aceita credenciais válidas', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'senha123',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: 'senha123',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita senha muito curta', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Senha deve ter no mínimo 6 caracteres');
  });
});

describe('signupSchema', () => {
  it('aceita cadastro válido', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'senha123',
      confirmPassword: 'senha123',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita senhas diferentes', () => {
    const result = signupSchema.safeParse({
      email: 'test@example.com',
      password: 'senha123',
      confirmPassword: 'senha456',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Senhas não conferem');
  });
});

describe('passwordSchema', () => {
  it('aceita senha forte', () => {
    const result = passwordSchema.safeParse('Senha123');
    expect(result.success).toBe(true);
  });

  it('rejeita senha sem maiúscula', () => {
    const result = passwordSchema.safeParse('senha123');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('maiúscula');
  });

  it('rejeita senha sem minúscula', () => {
    const result = passwordSchema.safeParse('SENHA123');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('minúscula');
  });

  it('rejeita senha sem número', () => {
    const result = passwordSchema.safeParse('SenhaForte');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('número');
  });

  it('rejeita senha curta', () => {
    const result = passwordSchema.safeParse('Ab1');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('8 caracteres');
  });
});
