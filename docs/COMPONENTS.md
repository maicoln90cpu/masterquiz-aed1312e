# 🧩 Componentes - MasterQuiz

> Documentação dos componentes principais do frontend
> Versão 2.41.0 | 15 de Abril de 2026

---

## 📋 Índice

- [Páginas](#páginas)
- [Quiz Editor](#quiz-editor)
- [Quiz View (Público)](#quiz-view-público)
- [Admin Recovery](#admin-recovery)
- [Landing](#landing)
- [Componentes Compartilhados](#componentes-compartilhados)

---

## 📄 Páginas

### `Index` — `/`
- **Arquivo:** `src/pages/Index.tsx`
- **Descrição:** Landing page pública com i18n (PT/EN/ES)
- **Componentes:** HeroSection, FeaturesSection, PricingSection, FAQSection, Footer
- **Dependências:** i18next, framer-motion

### `Login` — `/login`
- **Arquivo:** `src/pages/Login.tsx`
- **Descrição:** Login/Signup com tabs, recuperação de senha
- **Eventos GTM:** SignupStarted (1x/sessão)
- **Dependências:** AuthContext, react-hook-form, zod

### `Dashboard` — `/dashboard`
- **Arquivo:** `src/pages/Dashboard.tsx`
- **Descrição:** Dashboard principal com stats, quizzes recentes, CTAs por nível PQL
- **Hooks:** useUserStage, useSubscriptionLimits
- **Dependências:** TanStack Query, recharts

### `CreateQuiz` — `/create` e `/edit/:id`
- **Arquivo:** `src/pages/CreateQuiz.tsx`
- **Descrição:** Thin router que delega para `CreateQuizClassic` ou `CreateQuizModern` baseado em `useEditorLayout`
- **Padrão:** Lazy loading via `React.lazy` + `Suspense` — nenhum hook pesado neste arquivo
- **Dependências:** useEditorLayout

### `CreateQuizClassic` — Editor clássico 5 steps
- **Arquivo:** `src/pages/CreateQuizClassic.tsx`
- **Descrição:** Editor original com 5 steps (template, aparência, perguntas, formulário, resultados)
- **Hooks:** useQuizState, useQuizPersistence, useHistory, useAutoSave
- **Eventos GTM:** QuizShared, EditorAbandoned

### `CreateQuizModern` — Editor moderno com sidebar
- **Arquivo:** `src/pages/CreateQuizModern.tsx`
- **Descrição:** Editor com sidebar de blocos, preview lateral e paleta compacta
- **Hooks:** useQuizState, useQuizPersistence, useHistory, useAutoSave

### `QuizView` — `/:company/:slug`
- **Arquivo:** `src/pages/QuizView.tsx`
- **Descrição:** Renderiza quiz público para visitantes
- **Hooks:** useQuizViewState, useQuizTracking
- **Dependências:** Componentes de `quiz/view/`

### `CRM` — `/crm`
- **Arquivo:** `src/pages/CRM.tsx`
- **Descrição:** Kanban de leads com drag-and-drop, tags, filtros, exportação
- **Eventos GTM:** LeadExported
- **Dependências:** @dnd-kit, xlsx

### `Analytics` — `/analytics`
- **Arquivo:** `src/pages/Analytics.tsx`
- **Descrição:** Dashboard de métricas com gráficos, funil, heatmap, A/B testing
- **Hooks:** useFunnelData, useABTest
- **Dependências:** recharts

### `AdminDashboard` — `/admin`
- **Arquivo:** `src/pages/AdminDashboard.tsx`
- **Descrição:** Painel admin com tabs: Usuários, Templates, Planos, Config, Observabilidade, Recovery, Blog, Email
- **Lazy loading:** 15+ componentes admin carregados sob demanda
- **Guard:** ProtectedRoute com role admin/master_admin

---

## ✏️ Quiz Editor

### `QuestionsList`
- **Arquivo:** `src/components/quiz/QuestionsList.tsx`
- **Descrição:** Sidebar com lista de perguntas no editor
- **Features:** Drag-and-drop para reordenar, edição inline, delete com confirmação
- **Layout:** Cards compactos com line-clamp-2, ícones fixos à direita

### `BlockEditor`
- **Arquivo:** `src/components/quiz/BlockEditor.tsx`
- **Descrição:** Editor dos 34 tipos de blocos
- **Tipos:** question, text, separator, image, video, audio, gallery, embed, button, price, metrics, loading, progress, countdown, testimonial, slider, textInput, nps, accordion, comparison, socialProof, animatedCounter, callout, iconList, quote, badgeRow, banner, answerSummary, progressMessage, avatarGroup, conditionalText, comparisonResult, recommendation, calculator

### `CalculatorWizard`
- **Arquivo:** `src/components/quiz/wizard/CalculatorWizard.tsx`
- **Descrição:** Wizard de 3 passos para configurar resultados tipo calculadora
- **Steps:** VariableStep → FormulaStep → RangesStep
- **Props:** `questions`, `result`, `onSave`, `onCancel`

### `UnifiedQuizPreview`
- **Arquivo:** `src/components/quiz/UnifiedQuizPreview.tsx`
- **Descrição:** Preview interativo do quiz dentro do editor
- **Features:** Preview em tempo real, navegação entre perguntas, simulação de respostas

### `ConditionBuilder`
- **Arquivo:** `src/components/quiz/ConditionBuilder.tsx`
- **Descrição:** Editor visual de lógica condicional (branching)
- **Operadores:** equals, not_equals, contains, greater_than, less_than
- **Lógica:** AND/OR entre condições

### `AIQuizGenerator`
- **Arquivo:** `src/components/quiz/AIQuizGenerator.tsx`
- **Descrição:** Modal de geração de quiz via IA
- **Features:** Modo formulário e modo PDF, seletor de quantidade, preview

---

## 👀 Quiz View (Público)

### `QuizViewHeader`
- **Arquivo:** `src/components/quiz/view/QuizViewHeader.tsx`
- **Descrição:** Header do quiz público (logo, título, descrição)

### `QuizViewQuestion`
- **Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx`
- **Descrição:** Renderiza pergunta com opções e blocos de mídia

### `QuizViewForm`
- **Arquivo:** `src/components/quiz/view/QuizViewForm.tsx`
- **Descrição:** Formulário de coleta de dados (nome, email, WhatsApp, campos custom)

### `QuizViewResult`
- **Arquivo:** `src/components/quiz/view/QuizViewResult.tsx`
- **Descrição:** Tela de resultado (texto, imagem, vídeo, CTA, calculadora)

---

## 📧 Admin Recovery

### `CustomerRecovery`
- **Arquivo:** `src/components/admin/recovery/CustomerRecovery.tsx`
- **Descrição:** Dashboard principal do sistema de recuperação WhatsApp

### `EmailAutomations`
- **Arquivo:** `src/components/admin/recovery/EmailAutomations.tsx`
- **Descrição:** Gestão de automações de email (5 tipos) com toggle, teste, logs
- **Features:** Cards por automação, frequência, última execução, botão de teste

### `EmailRecoveryReports`
- **Arquivo:** `src/components/admin/recovery/EmailRecoveryReports.tsx`
- **Descrição:** Dashboard de performance por categoria (open rate, click rate, bounce)

### `EmailRecoveryTemplates`
- **Arquivo:** `src/components/admin/recovery/EmailRecoveryTemplates.tsx`
- **Descrição:** CRUD de templates de email com editor HTML
- **Features:** 13 categorias, subject_b para A/B testing, preview, prioridade, trigger_days

### `RecoveryCampaigns`
- **Arquivo:** `src/components/admin/recovery/RecoveryCampaigns.tsx`
- **Descrição:** Gestão de campanhas WhatsApp com cooldown global

### `EmailRecoveryCosts`
- **Arquivo:** `src/components/admin/recovery/EmailRecoveryCosts.tsx`
- **Descrição:** Aba de custos de email transacional com cálculo detalhado por categoria
- **Features:** Cards de saldo/custo total, tabela por categoria, baseado em R$190/40.533 emails

---

## 🏠 Landing

### `HeroSection`
- **Arquivo:** `src/components/landing/HeroSection.tsx`
- **Descrição:** Hero da landing page com animações Framer Motion
- **i18n:** Todas as strings via `t('landing.*')` e `t('hero_*')`

### `PricingSection`
- **Arquivo:** `src/components/landing/PricingSection.tsx`
- **Descrição:** Tabela de preços com 3-4 planos e comparação de features

### `FeaturesSection`
- **Arquivo:** `src/components/landing/FeaturesSection.tsx`
- **Descrição:** Grid de features com ícones e animações

### `LandingQuizDemo`
- **Arquivo:** `src/components/landing/LandingQuizDemo.tsx`
- **Descrição:** Demo interativo de quiz na landing (i18n completo)

---

## 🔧 Componentes Compartilhados

### `ProtectedRoute`
- **Arquivo:** `src/components/ProtectedRoute.tsx`
- **Descrição:** Guard de rotas por autenticação e role
- **Props:** `requiredRole?: 'admin' | 'master_admin'`

### `EmbedDialog`
- **Arquivo:** `src/components/quiz/EmbedDialog.tsx`
- **Descrição:** Modal com código de embed (iframe), link público e QR Code
- **Eventos GTM:** QuizShared

### `VideoPlayer`
- **Arquivo:** `src/components/video/VideoPlayer.tsx`
- **Descrição:** Player de vídeo customizado com analytics tracking
- **Integração:** Bunny CDN streaming

### `ModeComparison`
- **Arquivo:** `src/components/admin/ModeComparison.tsx`
- **Descrição:** Comparação histórica de métricas entre Modo A (Freemium) e Modo B (Apenas Pago)
- **Features:** Segmentação por período, cadastros, quizzes, conversões, tabela comparativa

### `useQuizGTMTracking`
- **Arquivo:** `src/hooks/useQuizGTMTracking.ts`
- **Descrição:** Hook de tracking GTM integrado ao estado real do quiz público
- **Eventos:** quiz_view (mount), quiz_start (1º step), quiz_complete (resultado), lead_captured (form)

---

## 🛡️ Suporte Administrativo

### `SupportDashboard`
- **Arquivo:** `src/pages/SupportDashboard.tsx` (lazy no AdminDashboard)
- **Descrição:** Dashboard de impersonação: lista usuários, entra em modo suporte
- **Features:** Busca por email, visualização de dados, ações corretivas, histórico de sessões

### `SupportQuizEditor`
- **Arquivo:** `src/pages/SupportQuizEditor.tsx`
- **Descrição:** Editor de quiz completo para admin em modo suporte
- **Features:** Edição de metadados, CRUD de perguntas, diff visual, snapshot antes/depois

### `SupportBlockEditor`
- **Arquivo:** `src/pages/support/SupportBlockEditor.tsx`
- **Descrição:** Editor de blocos dedicado para suporte (34 tipos)
- **Features:** 26 interfaces dedicadas + 9 JSON fallback com validação

### `SupportModeBanner`
- **Arquivo:** `src/components/admin/SupportModeBanner.tsx`
- **Descrição:** Banner fixo amarelo durante modo suporte com cronômetro

### `NotificationBell`
- **Arquivo:** `src/components/notifications/NotificationBell.tsx`
- **Descrição:** Sino de notificações no header do dashboard
- **Features:** Polling 60s, marcar lidas, tipos de ícone por tipo de notificação

### `supportPdfReport`
- **Arquivo:** `src/lib/supportPdfReport.ts`
- **Descrição:** Gerador de relatório PDF de sessão de suporte
- **Features:** Branding MasterQuiz, metadados da sessão, cronologia de eventos

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup e visão geral |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [API_DOCS.md](./API_DOCS.md) | Edge Functions |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [TESTING.md](./TESTING.md) | Guia de testes |
| [BLOG.md](./BLOG.md) | Guia do blog com IA |
| [EGOI.md](./EGOI.md) | Guia do email marketing |
| [MONETIZATION.md](./MONETIZATION.md) | Monetização A/B e custos |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema completo do banco |
| [SECURITY.md](./SECURITY.md) | Práticas de segurança |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões de código |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo das 61 Edge Functions |
| [ONBOARDING.md](./ONBOARDING.md) | Guia para novos desenvolvedores |
| [ADR.md](./ADR.md) | Architecture Decision Records |
