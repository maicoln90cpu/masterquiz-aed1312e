# 🎯 MasterQuiz

**Versão 2.37.0** | Última atualização: 21 de Março de 2026

**Plataforma de Funis de Auto-Convencimento — Transforme visitantes em compradores através de perguntas estratégicas.**

> O MasterQuiz não apenas qualifica leads — ele conduz o visitante a reconhecer seus próprios problemas e decidir por conta própria que precisa da sua solução. A venda acontece antes do CTA.

### O que NÃO é

- ❌ Um formulário de pesquisa tradicional
- ❌ Um questionário neutro de coleta de dados
- ❌ Uma ferramenta que só classifica leads

### O que É

- ✅ Uma experiência de descoberta guiada
- ✅ Um espelho que revela problemas reais
- ✅ Um condutor de decisão via perguntas estratégicas

---

## 📋 Índice

- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Setup do Projeto](#-setup-do-projeto)
- [Design System](#-design-system)
- [Autenticação](#-autenticação)
- [Edge Functions](#-edge-functions)
- [API e Database](#-api-e-database)
- [Testes Automatizados](#-testes-automatizados)
- [Funcionalidades](#-funcionalidades)
- [Troubleshooting](#-troubleshooting)
- [Documentação Relacionada](#-documentação-relacionada)
- [Contribuição](#-contribuição)

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Estilização utility-first |
| shadcn/ui | latest | Componentes UI |
| Framer Motion | 12.x | Animações |
| React Router | 6.x | Roteamento |
| TanStack Query | 5.x | Cache e server state |
| i18next | 25.x | Internacionalização (PT/EN/ES) |
| driver.js | 1.4.x | Onboarding tours |
| Recharts | 2.x | Gráficos e analytics |
| @dnd-kit | 6.x/10.x | Drag and drop |

### Backend (Supabase Externo)
| Serviço | Propósito |
|---------|-----------|
| PostgreSQL | Banco de dados relacional com RLS |
| Edge Functions (Deno) | Lógica serverless (57 funções) |
| Auth | Autenticação email/senha |
| Storage | Bucket `quiz-media` (público) |
| Realtime | Updates em tempo real |

### Testes & Qualidade
| Ferramenta | Propósito |
|------------|-----------|
| Vitest 4.x | Framework de testes |
| Testing Library | Testes de componentes React |
| ESLint | Linting e padrões de código |
| Prettier | Formatação de código |

### Integrações
| Serviço | Propósito |
|---------|-----------|
| Kiwify | Gateway de pagamento + webhook |
| Bunny CDN | Armazenamento e streaming de vídeos |
| Google Tag Manager | Tracking global (centralizado via `pushGTMEvent`) |
| Facebook Pixel | Tracking por quiz |
| Lovable AI (Gemini) | Geração de quizzes com IA |
| Evolution API | WhatsApp (recuperação de usuários) |
| E-goi | Email marketing automatizado (Bulk API) |
| Zapier/Make/n8n | Automações via webhook |
| HubSpot/RD Station/Pipedrive | CRMs externos |
| Mailchimp/ActiveCampaign | Email marketing |

---

## 🏗 Arquitetura

```
masterquizz/
├── docs/
│   ├── SYSTEM_DESIGN.md      # Arquitetura e fluxos técnicos
│   ├── AUDIT_TEMPLATE.md     # Template de auditoria
│   ├── API_DOCS.md           # Documentação das 57 Edge Functions
│   ├── COMPONENTS.md         # Documentação de componentes
│   ├── PRD.md                # Product Requirements
│   ├── ROADMAP.md            # Planejamento estratégico
│   ├── PENDENCIAS.md         # Changelog e pendências
│   ├── STYLE_GUIDE.md        # Padrões de código
│   ├── CHECKLIST.md          # Checklist de validação MVP
│   ├── BLOCKS.md             # Catálogo dos 34 tipos de blocos
│   └── TESTING.md            # Guia de testes automatizados
├── public/                    # Assets estáticos
├── scripts/                   # Scripts de automação
├── src/
│   ├── __tests__/             # Setup e utilities de testes
│   ├── assets/                # Imagens importadas (ES6)
│   ├── components/
│   │   ├── admin/             # Painel administrativo (lazy-loaded)
│   │   │   ├── recovery/      # Sistema de recuperação WhatsApp + Email
│   │   │   └── blog/          # Gestão de blog e prompts
│   │   ├── analytics/         # Componentes de analytics
│   │   ├── crm/               # Gestão de leads (kanban)
│   │   ├── integrations/      # Gestão de integrações
│   │   ├── kiwify/            # Componentes pós-compra
│   │   ├── landing/           # Landing page (i18n)
│   │   ├── lazy/              # Componentes lazy-loaded
│   │   ├── onboarding/        # Tours guiados (driver.js)
│   │   ├── quiz/              # Editor de quizzes
│   │   │   ├── blocks/        # 34 tipos de blocos
│   │   │   ├── view/          # Componentes de visualização pública
│   │   │   ├── wizard/        # Calculator Wizard (3 steps)
│   │   │   └── __tests__/     # Testes de componentes quiz
│   │   ├── support/           # Tickets de suporte
│   │   ├── video/             # Player de vídeo customizado
│   │   └── ui/                # shadcn components
│   ├── contexts/              # React contexts (Auth)
│   ├── hooks/                 # Custom hooks (35+)
│   ├── i18n/                  # Traduções (PT/EN/ES)
│   ├── integrations/
│   │   └── supabase/          # Cliente e tipos gerados
│   ├── lib/                   # Utilitários (calculator, sanitize, etc.)
│   ├── pages/                 # Rotas da aplicação
│   ├── styles/                # CSS adicional
│   ├── types/                 # Tipos TypeScript compartilhados
│   └── utils/                 # Helpers
├── supabase/
│   ├── config.toml            # Configuração Supabase
│   ├── migrations/            # SQL migrations (read-only)
│   └── functions/             # 57 Edge Functions
│       └── _shared/           # Código compartilhado (cors.ts, auth.ts)
└── [config files]
```

### Fluxo de Dados Principal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│    Auth     │────▶│  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │ Quiz Editor │           │     CRM     │           │  Analytics  │
            └─────────────┘           └─────────────┘           └─────────────┘
                    │                                                   │
                    ▼                                                   ▼
            ┌─────────────┐                                     ┌─────────────┐
            │  QuizView   │◀──── Visitantes                     │ Integrations│
            └─────────────┘                                     └─────────────┘
```

---

## 🚀 Setup do Projeto

### Pré-requisitos
- Node.js 18+ ou Bun
- Supabase project ID: `kmmdzwoidakmbekqvkmq`

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale dependências
npm install   # ou: bun install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

O arquivo `.env` é auto-populado com:

```env
VITE_SUPABASE_URL=https://kmmdzwoidakmbekqvkmq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=kmmdzwoidakmbekqvkmq
```

### Secrets (Edge Functions)

Configurados no Supabase Dashboard → Settings → Functions:

| Secret | Propósito |
|--------|-----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso admin ao DB |
| `LOVABLE_API_KEY` | Gateway AI (Gemini) |
| `BUNNY_API_KEY` | API Bunny CDN |
| `BUNNY_STORAGE_ZONE_NAME` | Storage zone Bunny |
| `BUNNY_STORAGE_ZONE_PASSWORD` | Password storage Bunny |
| `BUNNY_CDN_HOSTNAME` | Hostname CDN Bunny |
| `EVOLUTION_API_URL` | URL da Evolution API (WhatsApp) |
| `EVOLUTION_API_KEY` | Key da Evolution API |
| `EGOI_API_KEY` | API E-goi (email marketing) |
| `OPENAI_API_KEY` | Fallback para IA |

### Scripts Disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build
npm run test             # Executa testes (single run)
npm run test -- --watch  # Testes em modo watch
npm run test -- --coverage  # Testes com cobertura
npm run lint             # Linting com ESLint
```

---

## 🎨 Design System

### Tokens de Cor (HSL)

```css
/* Cores Primárias */
--primary: 160 84% 39%        /* Verde principal */
--primary-foreground: 0 0% 100%

/* Superfícies */
--background: 0 0% 100%
--foreground: 0 0% 3.9%
--card: 0 0% 100%
--muted: 0 0% 96.1%

/* Acentos */
--accent: 160 84% 39%
--destructive: 0 84.2% 60.2%
```

### Templates de Quiz

| Template | Descrição | Plano |
|----------|-----------|-------|
| moderno | Clean e contemporâneo | Free |
| colorido | Vibrante e chamativo | Free |
| profissional | Corporativo e sóbrio | Paid |
| criativo | Artístico e único | Paid |
| elegante | Luxo e sofisticação | Partner |
| vibrante | Energético e dinâmico | Partner |
| minimalista | Ultra limpo | Premium |
| escuro | Dark mode elegante | Premium |

### Componentes UI

Baseado em **shadcn/ui** com customizações:
- Button variants: `default`, `outline`, `ghost`, `hero`, `premium`
- Card com glassmorphism sutil
- Toast notifications (sonner)
- Dialog/Sheet responsivos

---

## 🔐 Autenticação

### Roles de Usuário (tabela `user_roles`)

| Role | Permissões |
|------|------------|
| `user` | Acesso implícito — todos os autenticados |
| `admin` | Atribuído automaticamente via trigger `handle_new_user_role()` |
| `master_admin` | Acesso total; email deve estar em `master_admin_emails` |

**Verificação de role:** Usa `has_role()` (SECURITY DEFINER) para evitar recursão RLS.

### Fluxo

```
Signup → trigger handle_new_user_profile() → cria profile
       → trigger handle_new_user_role() → atribui role admin (ou nada se master)
       → trigger handle_new_user_subscription() → cria subscription free
```

---

## ⚡ Edge Functions (57 funções)

### Core
| Função | Propósito |
|--------|-----------|
| `generate-quiz-ai` | Geração de quiz com IA (Gemini) |
| `parse-pdf-document` | Extração de conteúdo PDF para quiz |
| `save-quiz-draft` | Autosave de rascunhos |
| `generate-pdf-report` | Exportação de relatórios PDF |

### Pagamento & Usuários
| Função | Propósito |
|--------|-----------|
| `kiwify-webhook` | Processamento de pagamentos Kiwify |
| `list-all-users` | Listagem de usuários (Admin API) |
| `list-all-respondents` | Listagem de respondentes |
| `delete-user` / `delete-user-complete` | Exclusão de conta |
| `export-user-data` | Exportação LGPD |
| `update-user-profile` | Atualização de perfil |
| `merge-user-data` / `migrate-imported-user` | Migração de dados |
| `check-imported-user` | Verificação de usuário importado |

### Analytics & Tracking
| Função | Propósito |
|--------|-----------|
| `track-quiz-analytics` | Tracking de eventos (views, starts, completions) |
| `track-quiz-step` | Tracking de funil por step |
| `track-video-analytics` | Analytics de vídeo |
| `track-blog-view` | Views de blog posts |
| `rate-limiter` | Controle de rate limit |

### Integrações
| Função | Propósito |
|--------|-----------|
| `sync-integration` | Sincronização com CRMs externos |

### Bunny CDN (8 funções)
| Função | Propósito |
|--------|-----------|
| `bunny-upload-video` | Upload simples |
| `bunny-upload-video-multipart` | Upload multipart |
| `bunny-chunked-init` / `bunny-chunked-complete` | Upload chunked |
| `bunny-tus-create` / `bunny-tus-confirm` | Upload TUS protocol |
| `bunny-confirm-upload` | Confirmação |
| `bunny-delete-video` | Exclusão |
| `bunny-generate-thumbnail` | Thumbnail |

### WhatsApp Recovery (8 funções)
| Função | Propósito |
|--------|-----------|
| `evolution-connect` | Conexão com Evolution API |
| `evolution-webhook` | Webhook de eventos WhatsApp |
| `send-welcome-message` | Mensagem de boas-vindas |
| `send-whatsapp-recovery` | Mensagem de recuperação |
| `send-test-message` | Teste de conexão |
| `process-recovery-queue` | Processamento da fila |
| `check-inactive-users` | Detecção de inativos |
| `check-activation-24h` | Check de ativação 24h |
| `whatsapp-ai-reply` | Resposta IA via WhatsApp |

### Email Recovery & Automações (10 funções)
| Função | Propósito |
|--------|-----------|
| `generate-email-content` | Geração de conteúdo com IA |
| `check-inactive-users-email` | Detecção de inativos para email |
| `process-email-recovery-queue` | Processamento da fila de email |
| `send-blog-digest` | Envio de digest do blog (Bulk API) |
| `send-weekly-tip` | Envio de dica semanal (Bulk API) |
| `send-success-story` | Envio de case de sucesso (Bulk API) |
| `send-platform-news` | Envio de novidades (Bulk API) |
| `send-monthly-summary` | Resumo mensal personalizado |
| `send-test-email` | Teste de envio de email |
| `egoi-email-webhook` | Webhook E-goi (open/click/bounce) |
| `handle-email-unsubscribe` | Processamento de unsubscribe |

### Blog (5 funções)
| Função | Propósito |
|--------|-----------|
| `generate-blog-post` | Geração de post com IA |
| `regenerate-blog-asset` | Regeneração de imagem |
| `blog-cron-trigger` | Trigger de cron para blog |
| `blog-sitemap` | Geração de sitemap |
| `track-blog-view` | Tracking de views |

### Admin
| Função | Propósito |
|--------|-----------|
| `system-health-check` | Saúde do sistema |
| `export-schema-sql` / `export-table-data` | Exportação de dados |
| `anonymize-ips` | Anonimização LGPD |

---

## 🗄 API e Database

### Schema Principal (40+ tabelas)

```sql
-- Core
quizzes, quiz_questions, quiz_responses, quiz_results
quiz_form_config, custom_form_fields

-- Analytics
quiz_analytics, quiz_step_analytics, gtm_event_logs

-- Vídeo
bunny_videos

-- Usuários
profiles, user_subscriptions, user_roles, user_onboarding

-- Integrações
user_integrations, integration_logs, user_webhooks

-- Admin
subscription_plans, quiz_templates, system_settings
audit_logs, support_tickets, ticket_messages

-- A/B Testing
quiz_variants, ab_test_sessions
landing_ab_tests, landing_ab_sessions

-- Recovery (WhatsApp)
recovery_settings, recovery_templates, recovery_campaigns
recovery_contacts, recovery_blacklist

-- Email Recovery & Automações
email_recovery_settings, email_recovery_templates, email_recovery_contacts
email_automation_config, email_automation_logs
email_unsubscribes, email_tips

-- LGPD
cookie_consents, scheduled_deletions, rate_limit_tracker

-- i18n
quiz_translations, quiz_question_translations

-- Blog
blog_posts, blog_settings, blog_image_prompts
blog_generation_logs

-- Outros
landing_content, master_admin_emails, notification_preferences
ai_quiz_generations, system_health_metrics, quiz_tags, quiz_tag_relations
```

### RLS Policies

Todas as tabelas possuem Row Level Security ativo:
- Usuários acessam apenas seus dados via `auth.uid()`
- Admin/master_admin verificados via `has_role()` (SECURITY DEFINER)
- Quizzes públicos acessíveis via `is_public = true AND status = 'active'`
- Endpoints públicos (analytics, responses) permitem INSERT anon

### Database Functions

| Função | Propósito |
|--------|-----------|
| `has_role(uuid, app_role)` | Verifica role sem recursão RLS |
| `handle_new_user_profile()` | Cria profile no signup |
| `handle_new_user_role()` | Atribui role no signup |
| `handle_new_user_subscription()` | Cria subscription free |
| `generate_slug(text)` | Gera slug único para quiz |
| `get_quiz_for_display(slug)` | Busca quiz público (SECURITY DEFINER) |
| `get_user_quiz_stats(uuid[])` | Stats agregados para admin |
| `increment_login_count(uuid)` | Incrementa contador de login |
| `delete_user_by_id(uuid)` | Fallback para deleção |
| `cleanup_old_audit_logs()` | Limpeza de logs > 90 dias |
| `cleanup_old_health_metrics()` | Limpeza de métricas > 30 dias |
| `cleanup_expired_rate_limits()` | Limpeza de rate limits |
| `anonymize_old_ips()` | Anonimização LGPD (6 meses) |
| `cleanup_old_gtm_events()` | Limpeza de eventos GTM > 30 dias |
| `trigger_welcome_message()` | Dispara welcome WhatsApp |
| `trigger_first_quiz_message()` | Dispara msg no 1º quiz ativo |

---

## 🧪 Testes Automatizados

### Executando

```bash
npm run test                    # Single run
npm run test -- --watch         # Watch mode
npm run test -- --ui            # Interface visual
npm run test -- --coverage      # Com cobertura
```

### Estrutura

```
src/
├── __tests__/setup.ts          # Mocks globais (Supabase, i18n, matchMedia)
├── __tests__/test-utils.tsx    # Renders customizados (authenticated, loading)
├── lib/__tests__/              # ~165 testes (validations, sanitize, calculator)
├── hooks/__tests__/            # ~80 testes (useAutoSave, useFunnelData, useABTest)
├── contexts/__tests__/         # AuthContext
├── components/quiz/__tests__/  # LivePreview, AIQuizGenerator, ConditionBuilder
└── pages/__tests__/            # Login, QuizView, Dashboard, CRM, Analytics
```

### Cobertura Mínima

| Métrica | Mínimo | Meta |
|---------|--------|------|
| Lines | 50% | 80% |
| Statements | 50% | 80% |
| Functions | 50% | 80% |
| Branches | 40% | 70% |

---

## ✨ Funcionalidades

### Para Usuários
- ✅ Editor visual de blocos (34 tipos) com modo Classic e Modern
- ✅ Geração de quiz com IA (auto-convencimento)
- ✅ Upload de PDF para geração
- ✅ 8 templates visuais
- ✅ Quiz branching (lógica condicional)
- ✅ Resultados por score, condições ou calculadora
- ✅ Calculator Wizard (3 passos: variáveis → fórmula → faixas)
- ✅ Coleta de leads (nome, email, WhatsApp, campos custom)
- ✅ CRM integrado com Kanban
- ✅ Analytics + Funnel + Heatmap + A/B Testing
- ✅ Video upload (Bunny CDN) + Video Analytics
- ✅ Webhooks + 8 integrações (CRMs, email marketing)
- ✅ URLs customizadas `/:company/:slug`
- ✅ i18n (PT/EN/ES)
- ✅ Facebook Pixel por quiz + GTM global
- ✅ Exportação Excel/CSV + PDF
- ✅ Undo/Redo + Autosave (30s debounce)
- ✅ Embed via iframe + QR Code

### Para Admins
- ✅ Gestão de templates e planos
- ✅ Listagem de usuários (Edge Function)
- ✅ Sistema de recuperação via WhatsApp (Evolution API)
- ✅ Sistema de email marketing automatizado (E-goi Bulk API)
  - 12 templates estáticos + 5 dinâmicos com IA
  - Automações: blog digest, dica semanal, case de sucesso, novidades, resumo mensal
  - A/B testing de assuntos (subject_b)
  - Dashboard de performance por categoria
  - Unsubscribe com compliance CAN-SPAM/LGPD
- ✅ Tickets de suporte
- ✅ Audit logs + System health
- ✅ Configuração Kiwify, Bunny, AI prompts
- ✅ CSP monitoring + Bundle analysis
- ✅ Dashboard de Eventos GTM (observabilidade)
- ✅ Blog: Rotação de prompts de imagem (5 estilos, anti-repetição)
- ✅ Cooldown global de campanhas WhatsApp

---

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| Quiz não aparece | Verificar `status` = `active` e `user_id` correto |
| Mídia não carrega | CSP headers devem incluir `*.b-cdn.net` |
| Webhook Kiwify falha | Verificar token no `system_settings` |
| IA não gera quiz | Verificar `LOVABLE_API_KEY` e limites do plano |
| Erro 400 em analytics | FK `quiz_step_analytics.quiz_id` deve existir |
| `validation_requests` 400 | Normal para não-admin; tratado graciosamente |
| Eventos GTM não aparecem | Verificar se `pushGTMEvent` está sendo chamado e tabela `gtm_event_logs` tem RLS INSERT |
| Imagens do blog sempre iguais | Verificar se há ≥2 prompts ativos em `blog_image_prompts` |
| Emails não enviados | Verificar `EGOI_API_KEY` e configurações em `email_recovery_settings` |

### Debug

```typescript
import { logger } from '@/lib/logger';
logger.quiz('Saving quiz', { id, title });
logger.api('API call', { endpoint, status });
```

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [docs/PRD.md](./docs/PRD.md) | Requisitos do produto e backlog |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Planejamento estratégico 2025-2026 |
| [docs/PENDENCIAS.md](./docs/PENDENCIAS.md) | Changelog e pendências atuais |
| [docs/STYLE_GUIDE.md](./docs/STYLE_GUIDE.md) | Padrões de código e convenções |
| [docs/CHECKLIST.md](./docs/CHECKLIST.md) | Checklist de validação do MVP |
| [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) | Arquitetura e fluxos técnicos |
| [docs/API_DOCS.md](./docs/API_DOCS.md) | Documentação das 57 Edge Functions |
| [docs/COMPONENTS.md](./docs/COMPONENTS.md) | Documentação de componentes |
| [docs/AUDIT_TEMPLATE.md](./docs/AUDIT_TEMPLATE.md) | Template de auditoria |
| [docs/BLOCKS.md](./docs/BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [docs/TESTING.md](./docs/TESTING.md) | Guia de testes automatizados |

---

## 🤝 Contribuição

### Padrões de Código
- TypeScript strict, sem `any`
- Componentes funcionais + hooks
- Nomes em inglês, comentários em português
- UI primitives em `src/components/ui/`
- Componentes por domínio em `src/components/<domain>/`
- Cores via tokens semânticos HSL (nunca hardcoded)

### Commits
```
feat: adiciona novo bloco de vídeo
fix: corrige salvamento de blocos
refactor: extrai hook useQuizEditor
docs: atualiza README
test: adiciona testes para AuthContext
chore: atualiza dependências
```

---

## 📄 Licença

Proprietary - MasterQuizz © 2025-2026

---

## 🔗 Links

- **Preview:** https://id-preview--7eff0065-6ae9-416d-bf40-6fc07607f40d.lovable.app
- **Produção:** https://masterquiz.lovable.app
- [Supabase Dashboard](https://supabase.com/dashboard/project/kmmdzwoidakmbekqvkmq)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
