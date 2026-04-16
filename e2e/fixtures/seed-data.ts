/**
 * E2E Seed Data — MasterQuiz
 * Dados determinísticos com IDs fixos para reprodutibilidade.
 */

export const seedQuizzes = [
  {
    id: 'quiz-001',
    title: 'Quiz de Marketing Digital',
    description: 'Teste seus conhecimentos em marketing',
    status: 'published',
    template: 'modern',
    is_public: true,
    question_count: 5,
    created_at: '2026-04-01T10:00:00Z',
    user_id: '11111111-1111-1111-1111-111111111111',
  },
  {
    id: 'quiz-002',
    title: 'Calculadora de ROI',
    description: 'Calcule o retorno do seu investimento',
    status: 'draft',
    template: 'clean',
    is_public: false,
    question_count: 3,
    created_at: '2026-04-05T10:00:00Z',
    user_id: '11111111-1111-1111-1111-111111111111',
  },
];

export const seedProfiles = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@test.com',
    full_name: 'Test User',
    user_stage: 'engajado',
    company_slug: 'test-company',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@test.com',
    full_name: 'Test Admin',
    user_stage: 'operador',
    company_slug: null,
  },
];

export const seedResponses = [
  {
    id: 'resp-001',
    quiz_id: 'quiz-001',
    respondent_email: 'lead@example.com',
    respondent_name: 'Lead Teste',
    completed_at: '2026-04-10T14:30:00Z',
    answers: { q1: 'A', q2: 'B' },
    lead_status: 'new',
  },
];
