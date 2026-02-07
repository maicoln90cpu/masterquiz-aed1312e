# 🎯 MasterQuiz

**Versão 2.25.0** | Última atualização: 04 de Fevereiro de 2025

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
- [System Design](#-system-design)
- [Checklist de Validação](#-checklist-de-validação)
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
| TanStack Query | 5.x | Cache e state management |
| i18next | 25.x | Internacionalização (PT/EN/ES) |
| driver.js | 1.4.x | Onboarding tours |
| Recharts | 2.x | Gráficos e analytics |
| @dnd-kit | 6.x | Drag and drop |

### Backend (Lovable Cloud / Supabase)
| Serviço | Propósito |
|---------|-----------|
| PostgreSQL | Banco de dados relacional |
| Edge Functions | Lógica serverless (Deno) |
| Auth | Autenticação de usuários |
| Storage | Armazenamento de mídia |
| Realtime | Atualizações em tempo real |

### Testes & Qualidade
| Ferramenta | Propósito |
|------------|-----------|
| Vitest | Framework de testes |
| Testing Library | Testes de componentes React |
| ESLint | Linting e padrões de código |
| Prettier | Formatação de código |
| GitHub Actions | CI/CD pipeline |

### Integrações
| Serviço | Propósito |
|---------|-----------|
| Kiwify | Gateway de pagamento |
| Bunny CDN | Armazenamento e streaming de vídeos |
| Google Tag Manager | Tracking global |
| Facebook Pixel | Tracking por quiz |
| Lovable AI (Gemini) | Geração de quizzes com IA |
| Zapier/Make/n8n | Automações via webhook |
| HubSpot/RD Station/Pipedrive | CRMs externos |
| Mailchimp/ActiveCampaign | Email marketing |

---

## 🏗 Arquitetura

```
masterquizz/
├── .github/
│   └── workflows/            # CI/CD pipelines
│       └── pr.yml            # Validação de PRs
├── public/                   # Assets estáticos
│   ├── _headers              # Cache headers (Cloudflare)
│   └── favicon.png
├── scripts/                  # Scripts de automação
│   ├── analyze-bundle.js     # Análise de bundle size
│   ├── health-check.js       # Verificação de saúde
│   └── validate-docs.js      # Validação de documentação
├── src/
│   ├── __tests__/            # Setup e utilities de testes
│   │   ├── setup.ts          # Configuração global
│   │   ├── test-utils.tsx    # Render customizado
│   │   └── README.md         # Documentação de testes
│   ├── assets/               # Imagens importadas
│   ├── components/
│   │   ├── admin/            # Painel administrativo
│   │   ├── analytics/        # Componentes de analytics
│   │   ├── crm/              # Gestão de leads
│   │   ├── integrations/     # Gestão de integrações
│   │   ├── kiwify/           # Componentes pós-compra
│   │   ├── landing/          # Landing page
│   │   ├── lazy/             # Componentes lazy-loaded
│   │   ├── onboarding/       # Tours guiados
│   │   ├── quiz/             # Editor de quizzes
│   │   │   ├── blocks/       # Blocos do editor
│   │   │   └── __tests__/    # Testes de componentes quiz
│   │   ├── support/          # Tickets de suporte
│   │   ├── video/            # Player de vídeo customizado
│   │   ├── ui/               # shadcn components
│   │   └── __tests__/        # Testes de componentes
│   ├── contexts/             # React contexts (Auth)
│   │   └── __tests__/        # Testes de contexts
│   ├── hooks/                # Custom hooks
│   │   └── __tests__/        # Testes de hooks
│   ├── i18n/                 # Traduções
│   ├── integrations/
│   │   └── supabase/         # Cliente e tipos
│   ├── lib/                  # Utilitários
│   │   └── __tests__/        # Testes de utilitários
│   ├── pages/                # Rotas da aplicação
│   │   └── __tests__/        # Testes de páginas
│   ├── styles/               # CSS adicional
│   ├── types/                # Tipos TypeScript
│   └── utils/                # Helpers
├── supabase/
│   ├── config.toml           # Configuração Supabase
│   └── functions/            # Edge Functions
│       └── _shared/          # Código compartilhado
├── PENDENCIAS.md             # Changelog e pendências
├── PRD.md                    # Product Requirements
├── ROADMAP.md                # Planejamento estratégico
├── STYLE_GUIDE.md            # Padrões de código
└── [config files]
```

### Fluxo de Dados

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
- Node.js 18+
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

O arquivo `.env` é gerado automaticamente pelo Lovable Cloud:

```env
VITE_SUPABASE_URL=https://otabjwhvrwtixlyebkvm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=otabjwhvrwtixlyebkvm
```

### Secrets (Edge Functions)

Configurados via Admin Panel:
- `BUNNY_API_KEY` - API Key do Bunny CDN
- `BUNNY_LIBRARY_ID` - ID da biblioteca de vídeos Bunny
- `LOVABLE_API_KEY` - API para geração de quiz com IA

### Scripts Disponíveis

```bash
npm run dev           # Servidor de desenvolvimento
npm run build         # Build de produção
npm run preview       # Preview do build
npm run test          # Executa testes (single run)
npm run test -- --watch  # Testes em modo watch
npm run test -- --coverage  # Testes com cobertura
npm run lint          # Linting com ESLint
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
- Button variants: default, outline, ghost, hero, premium
- Card com glassmorphism
- Toast notifications (sonner)
- Dialog/Sheet responsivos

---

## 🔐 Autenticação

### Fluxo de Auth

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Supabase   │────▶│  Dashboard  │
│   Signup    │     │    Auth     │     │  Protected  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Roles de Usuário

| Role | Permissões |
|------|------------|
| `user` | Acesso básico, criar quizzes |
| `admin` | Gestão de usuários |
| `master_admin` | Acesso total, configurações globais |

### Configuração Auth

- **Auto-confirm email**: Habilitado
- **Password recovery**: Via email
- **Session**: JWT com refresh automático

---

## ⚡ Edge Functions

### Funções Disponíveis

| Função | Endpoint | Propósito |
|--------|----------|-----------|
| `generate-quiz-ai` | `/functions/v1/generate-quiz-ai` | Geração de quiz com IA |
| `parse-pdf-document` | `/functions/v1/parse-pdf-document` | Extração de conteúdo PDF |
| `kiwify-webhook` | `/functions/v1/kiwify-webhook` | Processamento de pagamentos |
| `trigger-user-webhook` | `/functions/v1/trigger-user-webhook` | Webhooks personalizados |
| `sync-integration` | `/functions/v1/sync-integration` | Sincronização com integrações |
| `track-quiz-analytics` | `/functions/v1/track-quiz-analytics` | Tracking de eventos |
| `track-quiz-step` | `/functions/v1/track-quiz-step` | Tracking de funil |
| `track-video-analytics` | `/functions/v1/track-video-analytics` | Analytics de vídeo |
| `bunny-upload-video` | `/functions/v1/bunny-upload-video` | Upload para Bunny CDN |
| `bunny-delete-video` | `/functions/v1/bunny-delete-video` | Exclusão de vídeo Bunny |
| `generate-pdf-report` | `/functions/v1/generate-pdf-report` | Exportação de relatórios |
| `save-quiz-draft` | `/functions/v1/save-quiz-draft` | Autosave de rascunhos |
| `delete-user` | `/functions/v1/delete-user` | Exclusão de conta |
| `list-all-users` | `/functions/v1/list-all-users` | Listagem admin |
| `rate-limiter` | `/functions/v1/rate-limiter` | Controle de rate limit |

### Exemplo: Geração de Quiz com IA

```typescript
const response = await supabase.functions.invoke('generate-quiz-ai', {
  body: {
    mode: 'form', // ou 'pdf'
    numberOfQuestions: 5,
    productName: 'Meu Produto',
    targetAudience: 'Empreendedores',
    // ...
  }
});
```

---

## 🗄 API e Database

### Schema Principal

```sql
-- Quizzes
quizzes (id, user_id, title, description, template, status, is_public, slug, ...)

-- Perguntas
quiz_questions (id, quiz_id, question_text, answer_format, options, blocks, order_number, ...)

-- Respostas
quiz_responses (id, quiz_id, respondent_email, answers, result_id, lead_status, ...)

-- Resultados
quiz_results (id, quiz_id, result_text, condition_type, min_score, max_score, formula, variable_mapping, ...)

-- Vídeos Bunny
bunny_videos (id, user_id, quiz_id, bunny_video_id, cdn_url, size_mb, status, ...)

-- Analytics
quiz_analytics (id, quiz_id, date, views, starts, completions, conversion_rate, ...)
video_analytics (id, quiz_id, video_url, event_type, watch_time_seconds, ...)
quiz_step_analytics (id, quiz_id, step_number, session_id, ...)

-- Usuários
profiles (id, full_name, company_slug, facebook_pixel_id, gtm_container_id, ...)
user_subscriptions (id, user_id, plan_type, status, quiz_limit, response_limit, ...)
user_roles (id, user_id, role)

-- Integrações
user_integrations (id, user_id, provider, api_key, webhook_url, is_active, ...)
integration_logs (id, integration_id, action, status, error_message, ...)

-- Planos
subscription_plans (id, plan_name, plan_type, quiz_limit, response_limit, features, kiwify_checkout_url, ...)
```

### RLS Policies

Todas as tabelas possuem Row Level Security:
- Usuários só acessam seus próprios dados
- Master admins têm acesso global
- Quizzes públicos são acessíveis para respostas

### Queries Comuns

```typescript
// Buscar quizzes do usuário
const { data } = await supabase
  .from('quizzes')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Buscar respostas de um quiz
const { data } = await supabase
  .from('quiz_responses')
  .select('*, quiz_results(*)')
  .eq('quiz_id', quizId);
```

---

## 🧪 Testes Automatizados

[![Test Coverage](https://img.shields.io/badge/coverage-70%25+-green)](./coverage/index.html)

### Visão Geral

O projeto possui uma suíte completa de testes automatizados com **Vitest** e **Testing Library**, cobrindo:

- **Funções utilitárias** (validações, sanitização, cálculos)
- **Hooks** (useAutoSave, useVideoAnalytics, useFunnelData, useABTest)
- **Componentes React** (renderização, interações)
- **Contexts** (AuthContext)
- **Páginas/Fluxos** (Login, QuizView, Dashboard, CRM, Analytics)

### Executando Testes

```bash
# Rodar todos os testes
npm run test

# Modo watch (re-executa ao salvar)
npm run test -- --watch

# Interface visual do Vitest
npm run test -- --ui

# Com relatório de cobertura
npm run test -- --coverage
```

### Estrutura de Testes

```
src/
├── __tests__/
│   ├── setup.ts              # Configuração global
│   └── test-utils.tsx        # Utilities customizadas
│
├── lib/__tests__/            # ~165 testes de utilitários
│   ├── validations.test.ts   # 45+ testes de schemas Zod
│   ├── sanitize.test.ts      # 40+ testes de XSS
│   ├── errorHandler.test.ts  # 25+ testes de erros
│   ├── calculatorEngine.test.ts  # 25+ testes de cálculos
│   └── conditionEvaluator.test.ts # 30+ testes de lógica
│
├── hooks/__tests__/          # ~80 testes de hooks
│   ├── useAutoSave.test.ts   # 15+ testes de autosave
│   ├── useVideoAnalytics.test.ts # 20+ testes de video tracking
│   ├── useFunnelData.test.ts # 15+ testes de funil
│   └── useABTest.test.ts     # 15+ testes de A/B testing
│
├── contexts/__tests__/       # Testes de contexts
│   └── AuthContext.test.tsx  # 15+ testes de auth
│
├── components/quiz/__tests__/ # Testes de componentes
│   ├── LivePreview.test.tsx  # 35+ testes de preview
│   ├── AIQuizGenerator.test.tsx # 15+ testes de geração IA
│   └── ConditionBuilder.test.tsx # 15+ testes de condições
│
└── pages/__tests__/          # Testes de páginas
    ├── Login.test.tsx        # 40+ testes de login
    ├── QuizView.test.tsx     # 30+ testes de quiz
    ├── Dashboard.test.tsx    # 20+ testes de dashboard
    ├── CRM.test.tsx          # 15+ testes de CRM
    └── Analytics.test.tsx    # 15+ testes de analytics
```

### Hooks Principais com Cobertura

| Hook | Propósito | Testes |
|------|-----------|--------|
| `useAutoSave` | Autosave com debounce 30s | 15+ |
| `useVideoAnalytics` | Tracking de eventos de vídeo | 20+ |
| `useFunnelData` | Dados do funil de conversão | 15+ |
| `useABTest` | Gestão de testes A/B | 15+ |

### Cobertura Mínima

O CI/CD requer **50% de cobertura** para aprovação de PRs.

| Métrica | Mínimo | Meta |
|---------|--------|------|
| Lines | 50% | 80% |
| Statements | 50% | 80% |
| Functions | 50% | 80% |
| Branches | 40% | 70% |

### Documentação Detalhada

Veja [src/__tests__/README.md](./src/__tests__/README.md) para:
- Como escrever novos testes
- Utilities disponíveis (render, mocks)
- Padrões AAA (Arrange-Act-Assert)
- Mocking do Supabase

---

## ✨ Funcionalidades

### Para Usuários

- ✅ Criar quizzes com editor visual de blocos
- ✅ Geração de quiz com IA (Gemini)
- ✅ Upload de PDF para geração de quiz
- ✅ 8 templates visuais
- ✅ Resultados condicionais por score
- ✅ Resultados tipo Calculadora com fórmulas + **Calculator Wizard (3 passos)**
- ✅ Custom labels para perguntas (títulos personalizados)
- ✅ Coleta de leads (nome, email, WhatsApp)
- ✅ CRM integrado com Kanban
- ✅ Analytics em tempo real
- ✅ Funnel visualization
- ✅ Heatmap de respostas
- ✅ A/B testing de quizzes
- ✅ Quiz branching (perguntas condicionais)
- ✅ Webhooks personalizados
- ✅ Integrações (Zapier, Make, n8n, CRMs)
- ✅ Upload de vídeos (Supabase + Bunny CDN)
- ✅ Upload de imagens com conversão WebP automática
- ✅ Video analytics
- ✅ Embed de quizzes
- ✅ URLs customizadas (/:company/:slug)
- ✅ Internacionalização (PT/EN/ES)
- ✅ Facebook Pixel por quiz
- ✅ Exportação de dados (Excel/CSV)
- ✅ Undo/Redo no editor

### Para Admins

- ✅ Gestão de templates (JSON + Editor Visual)
- ✅ Editor visual de templates sem JSON
- ✅ Configuração de planos
- ✅ Logs de pagamento Kiwify
- ✅ Configuração Bunny CDN
- ✅ Prompts de IA customizáveis
- ✅ GTM global
- ✅ Auditoria de ações
- ✅ Tickets de suporte
- ✅ CSP monitoring
- ✅ Análise de Bundle Size

---

## 🔧 Troubleshooting

### Problemas Comuns

**Quiz não aparece no dashboard**
- Verifique se o status é `draft` ou `active`
- Confirme que o `user_id` está correto

**Mídia não carrega**
- Verifique CSP headers (deve incluir *.b-cdn.net para Bunny)
- Confirme bucket permissions no Storage

**Vídeo Bunny não carrega**
- Verifique se CSP inclui `https://*.b-cdn.net` em media-src e connect-src
- Confirme que BUNNY_API_KEY e BUNNY_LIBRARY_ID estão configurados

**Webhook Kiwify não processa**
- Verifique token no system_settings
- Confira logs em PaymentWebhookLogs

**IA não gera quiz**
- Verifique LOVABLE_API_KEY
- Confirme limites do plano

**Testes falhando**
- Execute `npm run test -- --reporter=verbose` para detalhes
- Verifique se mocks estão configurados em `setup.ts`

### Logs de Debug

```typescript
// Use o logger categorizado em desenvolvimento
import { logger } from '@/lib/logger';

logger.quiz('Saving quiz', { id, title });
logger.api('API call', { endpoint, status });
```

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico 2025-2026 |
| [PENDENCIAS.md](./PENDENCIAS.md) | Changelog e pendências atuais |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código e convenções |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação do MVP |
| [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) | Arquitetura e fluxos técnicos |
| [src/__tests__/README.md](./src/__tests__/README.md) | Guia de testes automatizados |

---

## 🤝 Contribuição

### Padrões de Código

- TypeScript strict mode
- ESLint + Prettier
- Componentes funcionais com hooks
- Nomes em inglês, comentários em português

### Estrutura de Commits

```
feat: adiciona novo bloco de vídeo
fix: corrige salvamento de blocos
refactor: extrai hook useQuizEditor
docs: atualiza README
test: adiciona testes para AuthContext
```

### Processo de PR

1. Crie uma branch: `git checkout -b feat/nova-feature`
2. Faça commits seguindo o padrão
3. Abra um PR para `main` ou `develop`
4. O CI/CD executará:
   - ESLint
   - TypeScript check
   - Testes com cobertura
   - Build de produção
   - Análise de bundle size
5. PR precisa de 50%+ de cobertura de testes

### Criando Componentes

```typescript
// src/components/quiz/blocks/NewBlock.tsx
interface NewBlockProps {
  data: BlockData;
  onChange: (data: BlockData) => void;
}

export function NewBlock({ data, onChange }: NewBlockProps) {
  return (
    <div className="p-4 border rounded-lg">
      {/* Conteúdo */}
    </div>
  );
}
```

---

## 📄 Licença

Proprietary - MasterQuizz © 2025

---

## 🔗 Links Úteis

- [Lovable Documentation](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Bunny CDN Docs](https://docs.bunny.net/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
