# 📋 PENDÊNCIAS - MasterQuiz

> Documento centralizado de features, pendências, changelog e histórico de desenvolvimento.

---

## ✅ v2.26.0 - Sistema PQL + Lead de Teste (05/02/2025)

### Implementado

#### Sistema de Níveis PQL (Product Qualified Lead)
- **3 níveis de usuário**: Explorador (🧊), Construtor (🔥), Operador (🚀)
- **Progressão automática**: Baseada em comportamento real
  - Explorador → Construtor: Ao publicar primeiro quiz
  - Construtor → Operador: Ao visualizar CRM ou Analytics
- **CTAs dinâmicos no Dashboard**: Mensagens e ações personalizadas por nível
- **Campos em profiles**: `user_stage`, `crm_viewed_at`, `analytics_viewed_at`, `stage_updated_at`

#### Lead de Teste (Simulação)
- **Botão "Gerar Lead de Teste"**: Aparece em quizzes ativos
- **Dados fictícios realistas**: Nome, email, WhatsApp, resultado associado
- **Marcação especial**: Campo `_is_test_lead` nos answers
- **Badge visual no CRM**: Ícone de laboratório (🧪) identifica leads de teste
- **Toast com ação**: Leva diretamente ao CRM após gerar

#### Hooks Criados
| Hook | Descrição |
|------|-----------|
| `useUserStage.ts` | Gerencia nível PQL e CTAs dinâmicos |
| `useTestLead.ts` | Gera leads de teste para simulação |
| `useTrackPageView` | Rastreia visualização de CRM/Analytics |

### Arquivos Criados
- `src/hooks/useUserStage.ts`
- `src/hooks/useTestLead.ts`

### Arquivos Editados
| Arquivo | Alterações |
|---------|------------|
| `src/pages/Dashboard.tsx` | Card de CTA dinâmico baseado em user stage |
| `src/pages/CRM.tsx` | Track de visualização + badge de lead de teste |
| `src/pages/Analytics.tsx` | Track de visualização para upgrade de estágio |
| `src/pages/MyQuizzes.tsx` | Integração com useTestLead |
| `src/components/quiz/QuizCard.tsx` | Botão "Gerar Lead de Teste" |
| `src/components/crm/DraggableLeadCard.tsx` | Badge visual para leads de teste |
| `src/hooks/useQuizPersistence.ts` | Atualiza user_stage ao publicar primeiro quiz |

### Migração de Banco de Dados
```sql
ALTER TABLE profiles 
  ADD COLUMN user_stage TEXT DEFAULT 'explorador',
  ADD COLUMN crm_viewed_at TIMESTAMPTZ,
  ADD COLUMN analytics_viewed_at TIMESTAMPTZ,
  ADD COLUMN stage_updated_at TIMESTAMPTZ;
```

---


## ✅ v2.25.0 - Paradigma Auto-Convencimento + i18n Completo (04/02/2025)

### Mudança Conceitual (MAJOR)

#### Novo Paradigma: Funis de Auto-Convencimento
- **Antes:** Plataforma de qualificação e segmentação de leads
- **Depois:** Plataforma de funis de auto-convencimento via perguntas estratégicas
- **Impacto:** Toda comunicação, IA e UX reflete o novo paradigma

#### Estrutura das Perguntas (Novo Padrão)
1. Espelhamento - O lead se reconhece
2. Amplificação - O problema ganha peso
3. Consequência - Custo de não agir
4. Contraste - Atual vs desejado
5. Conclusão - Solução faz sentido

### Landing Page Atualizada (PT/EN/ES)

#### Banco de Dados (landing_content)
- 14 chaves `hero_*` atualizadas com novo paradigma
- Suporte trilíngue: PT, EN, ES

#### Copy Atualizada
| Campo | Novo Valor (PT) |
|-------|-----------------|
| hero_headline_main | Transforme Visitantes em Compradores |
| hero_headline_sub | Com Perguntas que Convencem |
| hero_bullet_1 | Faça seu lead reconhecer que precisa de você |
| hero_bullet_2 | Perguntas que revelam dores e criam urgência |
| hero_bullet_3 | Leads que chegam ao CTA já convencidos |
| hero_bullet_4 | Analytics de consciência em tempo real |
| hero_bullet_5 | IA que gera funis de auto-convencimento |

### Demo do Mockup Internacionalizado

#### Novos Namespaces i18n
- `landingDemo.intro.*` — Tela inicial do demo
- `landingDemo.objective.*` — Perguntas do demo
- `landingDemo.channels.*` — Opções do demo
- `landingDemo.loading.*` — Tela de loading
- `landingDemo.result.*` — Resultado do demo
- `landingDemo.navigation.*` — Botões
- `landingDemo.blocks.*` — Nomes dos blocos

#### Arquivos Atualizados
- `src/components/landing/LandingQuizDemo.tsx` — useTranslation() adicionado
- `src/components/landing/BlockIndicators.tsx` — Blocos traduzidos

### Edge Function: generate-quiz-ai

#### Prompts de IA Atualizados (Auto-Convencimento)
- System Prompt: Especialista em funis de auto-convencimento
- Estrutura obrigatória: 5 fases de consciência
- User Prompt: Foco em revelação de dores

### Admin Dashboard Otimizado
- Lazy loading de 15+ componentes pesados
- TanStack Query com cache 5min para list-all-users
- Parallelização de queries iniciais

### Arquivos Criados/Editados
| Arquivo | Tipo |
|---------|------|
| PRD.md | Atualizado |
| README.md | Atualizado |
| ROADMAP.md | Atualizado |
| docs/SYSTEM_DESIGN.md | Atualizado |
| src/i18n/config.ts | +160 chaves EN/ES + landingDemo |
| src/components/landing/LandingQuizDemo.tsx | Internacionalizado |
| src/components/landing/BlockIndicators.tsx | Internacionalizado |
| src/components/landing/HeroSection.tsx | Fallback atualizado |
| src/pages/AdminDashboard.tsx | Performance otimizada |
| supabase/functions/generate-quiz-ai/index.ts | Prompts atualizados |

---

## ✅ v2.24.0 - Documentação e Correções (23/01/2025)

### Implementado

#### Correção Crítica: Inicialização de Perguntas
- **CreateQuiz.tsx**: Bug corrigido - perguntas vazias agora são criadas ao avançar do Step 1
- **initializeEmptyQuestions**: Função extraída e utilizada corretamente no fluxo

#### Landing Page Atualizada
- **6 novos feature cards**: Audio Upload, NPS Survey, Countdown Timer, Social Proof, Quiz via PDF, Testimonials
- **Ícones importados**: Music, Timer, Quote, FileText, Star, Bell

#### System Design Document
- **docs/SYSTEM_DESIGN.md**: Documento técnico completo criado
- **Conteúdo**: Arquitetura, fluxos de dados, algoritmos, APIs, segurança, performance

#### Documentação Sincronizada
- **README.md**: v2.24, link para System Design
- **PRD.md**: v2.24, backlog atualizado
- **ROADMAP.md**: Histórico de alterações expandido
- **Links cruzados**: Todos os documentos com referências atualizadas

### Arquivos Criados
- `docs/SYSTEM_DESIGN.md`

### Arquivos Editados
- `src/pages/CreateQuiz.tsx` - Correção de inicialização de perguntas
- `src/pages/Index.tsx` - 6 novos feature cards na landing
- `README.md` - v2.24, novos links
- `PRD.md` - v2.24
- `ROADMAP.md` - Histórico atualizado
- `PENDENCIAS.md` - Este changelog

---

## ✅ v2.23.0 - Calculator Wizard + Correções UX (12/01/2025)

### Implementado

#### Calculator Wizard (3 passos)
- **VariableStep.tsx**: Seleção de perguntas e mapeamento de variáveis (X1, X2, etc.)
- **FormulaStep.tsx**: Editor de fórmulas matemáticas com preview em tempo real
- **RangesStep.tsx**: Definição de faixas de resultado com labels e descrições
- **CalculatorWizard.tsx**: Modal orquestrador do fluxo de 3 passos
- **Formatação**: Número, moeda (R$), porcentagem, unidade customizada
- **Casas decimais**: Configurável de 0 a 4

#### Correções de UX
- **Botão deletar sempre visível**: Removido hover condicional no QuestionsList
- **Confirmação de deleção**: AlertDialog em perguntas e resultados
- **IDs temporários corrigidos**: Formato `temp-${Date.now()}` evita erro null no banco
- **custom_label persistido**: Campo de título customizado salvo corretamente

#### Traduções
- **~50 novas chaves** em PT/EN/ES para Calculator Wizard
- Chaves para confirmação de deleção
- Chaves para steps do wizard

### Arquivos Criados
- `src/components/quiz/wizard/VariableStep.tsx`
- `src/components/quiz/wizard/FormulaStep.tsx`
- `src/components/quiz/wizard/RangesStep.tsx`
- `src/components/quiz/CalculatorWizard.tsx`
- `CHECKLIST.md` - Checklist completo de validação do MVP

### Arquivos Editados
- `src/components/quiz/ResultsConfigStep.tsx` - Integração do Calculator Wizard
- `src/components/quiz/QuestionsList.tsx` - Botão deletar visível + confirmação
- `src/i18n/config.ts` - Novas traduções

---

## ✅ v2.22.0 - Performance e Otimizações (12/01/2025)

### Implementado

#### Lazy Loading Agressivo
- **EditorComponentsBundle.tsx**: Lazy loading de BlockEditor, UnifiedQuizPreview, AIQuizGenerator, QuizTemplateSelector
- **AnalyticsChartsBundle.tsx**: Lazy loading de FunnelChart, ResponseHeatmap, VideoAnalytics
- **Skeletons específicos**: Fallbacks visuais bonitos para cada componente

#### Hooks de Performance
- **useStableCallback.ts**: Callbacks estáveis para evitar re-renders em componentes memoizados
- **useDeferredValue.ts**: Valores deferidos, filtros lazy, virtualização de listas longas
- **useRenderTracker**: Debug de re-renders em desenvolvimento

#### Bundle Optimization
- **vite.config.ts**: 13 chunks separados (era 8) para melhor cache
- **Chunks específicos**: router, form, query, supabase, date separados
- **Target ES2020**: Build menor para browsers modernos
- **assetsInlineLimit**: 4KB para reduzir requests

#### Refatorações da Etapa 5 (concluídas)
- **QuizView.tsx**: Reduzido de 1146 → ~100 linhas
- **UnifiedQuizPreview.tsx**: Refatorado com hooks e sub-componentes
- **Novos hooks**: useQuizViewState, useQuizTracking
- **Novos componentes view/**: QuizViewResult, QuizViewForm, QuizViewQuestion, QuizViewHeader

#### Testes Automatizados (Etapa 6)
- **useQuizViewState.test.ts**: Testes de estado do quiz
- **useQuizTracking.test.ts**: Testes de GTM/Facebook Pixel
- **QuizViewQuestion.test.tsx**: Testes do componente de pergunta

### Arquivos Criados
- `src/components/lazy/EditorComponentsBundle.tsx`
- `src/hooks/useStableCallback.ts`
- `src/hooks/useDeferredValue.ts`
- `src/hooks/__tests__/useQuizViewState.test.ts`
- `src/hooks/__tests__/useQuizTracking.test.ts`
- `src/components/quiz/__tests__/QuizViewQuestion.test.tsx`

### Arquivos Editados
- `vite.config.ts` - Chunks otimizados
- `src/components/lazy/AnalyticsChartsBundle.tsx` - Novos wrappers

---

## 🔄 Prioridade 7: Internacionalização (EM STANDBY)

> **Status:** Aguardando priorização. Remover strings hardcoded restantes, verificar PT/EN/ES.

---

## ✅ v2.21.0 - Layout QuizCard 4 Linhas + Auditoria de Responsividade (12/01/2025)

### Implementado

#### Refatoração Completa do QuizCard
- **Layout de 4 linhas**: Título/Badge → Descrição → Link/Data → Botões
- **Mobile**: Grid 4x1 para botões, info empilhada
- **Tablet**: 4 linhas com botões inline e tooltips
- **Desktop**: 4 linhas com todos os botões visíveis por extenso
- **Overflow corrigido**: `min-w-0`, `truncate`, `line-clamp` em todos os layouts

#### Correções de Responsividade
- **CRM.tsx**: Kanban com scroll horizontal para 6 colunas (`overflow-x-auto`, `min-w-[800px]`)
- **Responses.tsx**: Filtros com `flex-wrap` para adaptar em tablets

#### Documentação
- **Template de Auditoria**: `docs/AUDIT_TEMPLATE.md` criado para reutilização em outros projetos
- **Checklist rápido** de performance, segurança, responsividade e i18n incluído

### Arquivos Criados
- `docs/AUDIT_TEMPLATE.md`

### Arquivos Editados
- `src/components/quiz/QuizCard.tsx` - Layout completamente refatorado
- `src/pages/CRM.tsx` - Kanban com scroll horizontal
- `src/pages/Responses.tsx` - Filtros responsivos

---

## ✅ v2.20.0 - Refatoração de Arquitetura e i18n (12/01/2025)

### Implementado

#### Refatoração do Sistema de Quizzes
- **QuizCard isolado**: Componente independente `src/components/quiz/QuizCard.tsx`
- **Correção de overflow**: Layouts desktop/tablet com `min-w-0` e `overflow-hidden`
- **Responsividade**: 3 layouts otimizados (mobile, tablet, desktop)

#### Internacionalização (i18n) Expandida
- **Hooks corrigidos**: `useRateLimit.ts`, `useBunnyUpload.ts` - strings hardcoded removidas
- **Pages corrigidas**: `Integrations.tsx`, `MediaLibrary.tsx`, `Settings.tsx`
- **~40 novas chaves de tradução** em PT/EN/ES

#### Edge Functions Padronizadas
- **cors.ts**: Headers CORS e segurança padronizados
- **auth.ts**: Autenticação unificada com `getClaims()` + fallback `getUser()`
- **9 edge functions atualizadas**: bunny-*, export-user-data, delete-user-complete

### Arquivos Criados
- `src/components/quiz/QuizCard.tsx`
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/auth.ts`

### Arquivos Editados
- `src/pages/MyQuizzes.tsx` - Usa QuizCard isolado
- `src/i18n/config.ts` - Novas chaves de tradução
- `src/hooks/useRateLimit.ts` - i18n corrigido
- `src/hooks/useBunnyUpload.ts` - i18n corrigido
- `src/pages/Integrations.tsx` - i18n corrigido
- `src/pages/MediaLibrary.tsx` - i18n corrigido
- `src/pages/Settings.tsx` - i18n corrigido
- 9 edge functions com imports padronizados

---

## ✅ v2.19.0 - Segurança, Autosave e Testes Expandidos (08/01/2025)

### Implementado

#### Segurança RLS
- **ab_test_sessions**: UPDATE restrito a sessões criadas nas últimas 24h
- **landing_ab_sessions**: UPDATE restrito a sessões criadas nas últimas 24h
- **user_integrations_safe**: View criada para mascarar API keys/secrets
- **Admins podem ver integrações**: Para suporte técnico sem expor credenciais

#### Audit Logging Expandido
- Logs de alterações em integrações
- Logs de exportação de dados
- Logs de operações de admin
- Metadata enriquecida com contexto

#### Hook useAutoSave
- **Debounce de 30 segundos**: Evita saves excessivos
- **Estados visuais**: idle, pending, saving, saved, error
- **Detecção online/offline**: Pausa saves quando offline
- **saveNow()**: Salvamento imediato quando necessário
- **markAsSaved()**: Atualiza estado após publish
- **Integrado no CreateQuiz.tsx**: Autosave funcional no editor

#### Testes Automatizados Expandidos (~430 testes total)

**Novos testes de hooks:**
- `src/hooks/__tests__/useAutoSave.test.ts` (15+ testes)
- `src/hooks/__tests__/useVideoAnalytics.test.ts` (20+ testes)
- `src/hooks/__tests__/useFunnelData.test.ts` (15+ testes)
- `src/hooks/__tests__/useABTest.test.ts` (15+ testes)

**Novos testes de componentes:**
- `src/components/quiz/__tests__/AIQuizGenerator.test.tsx` (15+ testes)
- `src/components/quiz/__tests__/ConditionBuilder.test.tsx` (15+ testes)

**Novos testes de páginas:**
- `src/pages/__tests__/Dashboard.test.tsx` (20+ testes)
- `src/pages/__tests__/CRM.test.tsx` (15+ testes)
- `src/pages/__tests__/Analytics.test.tsx` (15+ testes)

### Arquivos Criados
- `src/hooks/__tests__/useAutoSave.test.ts`
- `src/hooks/__tests__/useVideoAnalytics.test.ts`
- `src/hooks/__tests__/useFunnelData.test.ts`
- `src/hooks/__tests__/useABTest.test.ts`
- `src/components/quiz/__tests__/AIQuizGenerator.test.tsx`
- `src/components/quiz/__tests__/ConditionBuilder.test.tsx`
- `src/pages/__tests__/Dashboard.test.tsx`
- `src/pages/__tests__/CRM.test.tsx`
- `src/pages/__tests__/Analytics.test.tsx`

### Arquivos Editados
- `src/hooks/useAutoSave.ts` - Hook de autosave
- `src/pages/CreateQuiz.tsx` - Integração do useAutoSave
- Documentação técnica completa (README, PRD, ROADMAP, PENDENCIAS, STYLE_GUIDE)

---

## ✅ v2.18.0 - Testes Automatizados (23/12/2024)

### Implementado

#### Fase 1: Infraestrutura de Testes
- **Setup de testes**: `vitest.config.ts` configurado com ambiente jsdom
- **Configuração global**: `src/__tests__/setup.ts` com mocks de Supabase, i18next, matchMedia
- **Test utilities**: `src/__tests__/test-utils.tsx` com renders customizados (authenticated, loading)
- **Factories de mock**: `createMockUser`, `createMockSession` para testes

#### Fase 2: Testes de Funções Utilitárias (~165 testes)
- **validations.test.ts** (45+ testes): Schemas Zod para email, WhatsApp, slug, GTM, Pixel, quiz, lead, webhook
- **sanitize.test.ts** (40+ testes): Segurança XSS, sanitizeHtml, sanitizeSimpleText, sanitizeRichContent
- **errorHandler.test.ts** (25+ testes): Mapeamento de erros Supabase, AppError, toasts
- **calculatorEngine.test.ts** (25+ testes): Substituição de variáveis, avaliação de fórmulas, formatação
- **conditionEvaluator.test.ts** (30+ testes): Operadores, lógica AND/OR, detecção de ciclos

#### Fase 3: Testes de Componentes Críticos (~50 testes)
- **AuthContext.test.tsx** (15+ testes): Estados loading, login/logout, persistência de sessão
- **LivePreview.test.tsx** (35+ testes): Renderização de blocos, navegação, templates

#### Fase 4: Testes de Páginas/Fluxos (~70 testes)
- **Login.test.tsx** (40+ testes): Formulário, validação, troca login/signup, recuperação de senha
- **QuizView.test.tsx** (30+ testes): Renderização, navegação entre perguntas, submissão

#### Fase 5: CI/CD com Cobertura
- **pr.yml atualizado**: Testes com cobertura, upload de artifacts, comentário no PR
- **Threshold de 50%**: PRs falham se cobertura média < 50%
- **Relatório detalhado**: Tabela com Lines, Statements, Functions, Branches

---

## ✅ v2.17.0 - Padronização de Código (23/12/2024)

### Implementado
- **Prettier configurado**: `.prettierrc` com regras de formatação padrão
- **ESLint aprimorado**: Ordenação de imports, complexidade máxima, variáveis não usadas como warning
- **Logger categorizado**: Categorias `quiz`, `auth`, `api`, `form`, `analytics`, `integration`, `admin`
- **Limpeza de console.logs**: Substituídos por logger nos arquivos principais
- **STYLE_GUIDE.md**: Documentação completa de padrões de código
- **CI/CD Pipeline**: Workflow de validação de PR com ESLint, TypeScript e testes

### Arquivos criados/editados
- `.prettierrc` - Configuração do Prettier
- `.prettierignore` - Arquivos ignorados pelo Prettier
- `eslint.config.js` - ESLint com regras aprimoradas
- `src/lib/logger.ts` - Logger com categorias
- `STYLE_GUIDE.md` - Guia de estilo do projeto
- `.github/workflows/pr.yml` - Pipeline de validação de PR
- `scripts/health-check.js` - Script de verificação de saúde

---

## ✅ v2.16.0 - Heatmap de Respostas (23/12/2024)

### Implementado
- **Heatmap visual de respostas**: Visualização de quais opções são mais escolhidas
- **Cores de calor**: Escala de azul (frio) a vermelho (quente)
- **Insights automáticos**: Identifica opções que dominam com >50%
- **Suporte a todos os formatos**: single_choice, multiple_choice, yes_no, short_text
- **Seletor de quiz**: Permite alternar entre quizzes para comparar
- **Animações suaves**: Framer Motion para transições

### Arquivos criados/editados
- `src/components/analytics/ResponseHeatmap.tsx`
- `src/pages/Analytics.tsx`

---

## ✅ v2.15.0 - Análise de Bundle Size (23/12/2024)

### Implementado
- **Integração Bunny CDN completa**: Upload de vídeos com CDN de alta performance
- **Edge Functions para Bunny**: TUS protocol, chunked upload, confirmação, exclusão
- **CSP atualizada**: Adicionado `*.b-cdn.net` e `storage.bunnycdn.com`
- **CORS corrigido**: `crossOrigin` condicional no CustomVideoPlayer
- **BunnyVideoUploader**: Componente com drag-and-drop
- **Video Analytics**: Tracking de eventos de vídeo

---

## ✅ v2.11.0 - Calculadoras (21/12/2024)

### Implementado
- **Tipo de resultado Calculator**: Resultados numéricos com fórmulas
- **Editor de fórmulas**: Interface visual para variáveis e fórmulas
- **Mapeamento de variáveis**: Capturam valores/scores das respostas
- **Formatação flexível**: Número, moeda (R$), porcentagem, personalizado
- **Faixas de resultado**: Classificação automática
- **Motor de cálculo seguro**: Sem eval() inseguro

### Como usar
1. Na etapa de Resultados, selecione "Calculadora"
2. Defina variáveis que capturam valores das respostas
3. Escreva a fórmula usando as variáveis
4. Configure formato de exibição e faixas opcionais

---

## ✅ v2.10.0 - Integrações Webhook (20/12/2024)

### Implementado
- **Suporte a n8n**: Adicionado como opção de automação
- **Providers completos**: Zapier, Make, n8n, HubSpot, RD Station, Pipedrive, Mailchimp, ActiveCampaign
- **Edge Function sync-integration**: Sincroniza leads automaticamente
- **Página /integrations**: Interface completa para gestão
- **Logs de sincronização**: Histórico com status

---

## 📊 Status Geral

| Categoria | Completo | Em Progresso | Pendente |
|-----------|----------|--------------|----------|
| Core Features | **100%** | 0% | 0% |
| Admin Panel | 100% | 0% | 0% |
| Pagamentos | 100% | 0% | 0% |
| Analytics | 95% | 5% | 0% |
| Vídeo/CDN | 100% | 0% | 0% |
| LGPD/GDPR | 95% | 5% | 0% |
| Performance | 95% | 5% | 0% |
| **Segurança RLS** | **100%** | **0%** | **0%** |
| **Testes** | **100%** | **0%** | **0%** |
| **Calculator Wizard** | **100%** | **0%** | **0%** |

---

## ✅ Features Implementadas

### Quiz Builder
- [x] Editor visual com blocos drag-and-drop
- [x] Blocos: texto, imagem, vídeo, áudio, botão, separador
- [x] Blocos de engajamento: progress, countdown, testimonial
- [x] Geração de quiz com IA (Gemini)
- [x] Upload de PDF para geração de quiz
- [x] 8 templates visuais
- [x] Resultados condicionais por score range
- [x] Resultados tipo Calculadora + **Calculator Wizard (3 passos)** ✅
- [x] Custom labels para perguntas ✅
- [x] Formulário de coleta de dados
- [x] Campos customizados
- [x] Preview interativo
- [x] Duplicação de perguntas
- [x] Confirmação de deleção (perguntas e resultados) ✅
- [x] Embed dialog
- [x] Preview links
- [x] Undo/Redo

### Testes Automatizados
- [x] Infraestrutura de testes (Vitest + Testing Library)
- [x] Testes de validações (Zod schemas)
- [x] Testes de sanitização (XSS)
- [x] Testes de tratamento de erros
- [x] Testes do motor de cálculo
- [x] Testes de lógica condicional
- [x] Testes do AuthContext
- [x] Testes de componentes (LivePreview)
- [x] Testes de páginas (Login, QuizView)
- [x] CI/CD com cobertura mínima 50%

### Vídeo & Mídia
- [x] Upload para Supabase Storage
- [x] Upload para Bunny CDN
- [x] Player customizado
- [x] Video analytics
- [x] Tracking de uso de storage

### Dashboard & CRM
- [x] Dashboard com estatísticas
- [x] CRM Kanban
- [x] Tags e filtros
- [x] Exportação Excel/CSV
- [x] Analytics com gráficos
- [x] Funnel visualization
- [x] Heatmap de respostas

### Autenticação & Usuários
- [x] Login/Signup com email
- [x] Recuperação de senha
- [x] Roles: user, admin, master_admin
- [x] Onboarding tours
- [x] Preferências de notificação

### Pagamentos (Kiwify)
- [x] Integração webhook Kiwify
- [x] Processamento de eventos
- [x] Páginas de sucesso/cancelamento
- [x] Logs de webhook
- [x] Teste de webhook

### Integrações
- [x] Zapier (via webhook)
- [x] Make (via webhook)
- [x] n8n (via webhook)
- [x] HubSpot
- [x] RD Station
- [x] Pipedrive
- [x] Mailchimp
- [x] ActiveCampaign
- [x] Logs de sincronização

### Admin Panel
- [x] Gestão de templates
- [x] Configuração de planos
- [x] Configuração Kiwify
- [x] Configuração Bunny CDN
- [x] Prompts de IA
- [x] Tracking configuration
- [x] Audit logs
- [x] Support tickets
- [x] Performance metrics
- [x] CSP violations panel

### Tracking & Analytics
- [x] Facebook Pixel por quiz
- [x] GTM global + por quiz
- [x] Eventos de vídeo
- [x] Web Vitals monitoring
- [x] Quiz analytics
- [x] Video analytics dashboard

### Internacionalização
- [x] Português (PT-BR) - Principal
- [ ] Inglês (EN) - Revisar apenas quando solicitado
- [ ] Espanhol (ES) - Revisar apenas quando solicitado

> **Nota:** Traduções EN/ES devem ser revisadas/completadas apenas quando solicitado pelo usuário. Foco atual é PT-BR.

---

## 🔄 Em Progresso

### Analytics Avançado
- [x] Heatmaps de respostas ✅
- [x] Funnel visualization ✅
- [x] A/B testing ✅
- [ ] Cohort Analysis
- [ ] Predictive Scoring de leads

---

## 📝 Pendências Prioritárias

### Alta Prioridade

#### Segurança
- [x] Logger condicional ✅
- [x] Error Boundaries ✅
- [x] beforeunload com sendBeacon ✅
- [x] Interfaces TypeScript tipadas ✅
- [x] CSP atualizada para Bunny CDN ✅
- [x] RLS corrigido: `ab_test_sessions` UPDATE restrito a 24h ✅
- [x] RLS corrigido: `landing_ab_sessions` UPDATE restrito a 24h ✅
- [x] View `user_integrations_safe` criada (mascara API keys) ✅
- [x] Admins podem ver integrações e respostas para suporte ✅
- [x] Audit Logging expandido (integrações, exports) ✅
- [ ] Leaked Password Protection (Habilitar no painel Auth backend)
- [ ] 2FA opcional para usuários (`src/pages/Settings.tsx` + `src/components/settings/TwoFactorSetup.tsx`)

### Média Prioridade

#### UX Improvements
- [x] Undo/Redo no editor ✅
- [x] Hook useAutoSave.ts criado ✅
- [x] Integrar useAutoSave no CreateQuiz.tsx ✅ (autosave 30s + indicador visual)
- [ ] Drag-and-drop de arquivos
- [ ] Keyboard shortcuts documentados

#### Novas Features
- [x] Quiz branching ✅
- [x] A/B testing ✅
- [x] Integrações ✅
- [ ] Timer por pergunta
- [ ] Gamificação

### Baixa Prioridade
- [ ] App mobile (PWA)
- [ ] API pública documentada
- [ ] White-label completo
- [ ] Multi-tenancy

---

## 📜 Changelog

### v2.18.0 (2024-12-23) - Testes Automatizados
**Adicionado:**
- Infraestrutura completa de testes (Vitest + Testing Library)
- ~285 testes automatizados em 9 arquivos
- Testes de funções utilitárias (validations, sanitize, errorHandler, calculatorEngine, conditionEvaluator)
- Testes de contexts (AuthContext)
- Testes de componentes (LivePreview)
- Testes de páginas (Login, QuizView)
- CI/CD com cobertura mínima de 50%
- Documentação de testes atualizada

---

### v2.17.0 (2024-12-23) - Padronização de Código
**Adicionado:**
- Prettier configurado
- ESLint aprimorado
- Logger categorizado
- STYLE_GUIDE.md
- CI/CD Pipeline

---

### v2.16.0 (2024-12-23) - Heatmap de Respostas
**Adicionado:**
- Heatmap visual de respostas
- Cores de calor
- Insights automáticos
- Animações suaves

---

### v2.12.0 (2024-12-22) - Bunny CDN Integration
**Adicionado:**
- Integração completa com Bunny CDN
- 6 Edge Functions para gestão de vídeos
- BunnyVideoUploader
- Video analytics
- CSP atualizada

**Corrigido:**
- CORS issue no CustomVideoPlayer

---

### v2.11.0 (2024-12-21) - Calculadoras
**Adicionado:**
- Resultado tipo Calculator
- Editor visual de fórmulas
- Motor de cálculo seguro
- Formatação e faixas

---

### v2.10.0 (2024-12-20) - Integrações Webhook
**Adicionado:**
- Zapier, Make, n8n via webhooks
- Integrações com CRMs
- Edge function sync-integration
- Logs de sincronização

---

### v2.8.0 (2024-12-19) - Undo/Redo
**Adicionado:**
- Hook useHistory
- Hook useUndoRedoShortcuts
- Componente UndoRedoControls
- Suporte a Ctrl+Z/Ctrl+Y

---

### v2.7.0 (2024-12-19) - Funnel Visualization
**Adicionado:**
- Tabela quiz_step_analytics
- Edge function track-quiz-step
- View quiz_funnel_view
- Componente FunnelChart
- Hook useFunnelData

---

## 🏷 Tags de Versão

| Tag | Data | Descrição |
|-----|------|-----------|
| v2.19.0 | 2025-01-08 | Segurança, Autosave e Testes Expandidos |
| v2.18.0 | 2024-12-23 | Testes Automatizados |
| v2.17.0 | 2024-12-23 | Padronização de Código |
| v2.16.0 | 2024-12-23 | Heatmap de Respostas |
| v2.12.0 | 2024-12-22 | Bunny CDN Integration |
| v2.11.0 | 2024-12-21 | Calculadoras |
| v2.10.0 | 2024-12-20 | Integrações Webhook |
| v2.8.0 | 2024-12-19 | Undo/Redo |
| v2.7.0 | 2024-12-19 | Funnel Visualization |
| v2.6.0 | 2025-01-16 | Stability & Quality |
| v2.5.0 | 2025-01-15 | Kiwify Exclusive |
| v2.4.0 | 2025-01-10 | Performance |
| v2.3.0 | 2025-01-05 | Editor Enhancements |
| v2.2.0 | 2024-12-28 | AI & Templates |
| v2.1.0 | 2024-12-20 | Onboarding |
| v2.0.0 | 2024-12-15 | Major Refactor |
| v1.0.0 | 2024-11-01 | Initial Release |

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [README.md](./README.md) | Setup, stack e arquitetura |
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código |
| [src/__tests__/README.md](./src/__tests__/README.md) | Guia de testes |

---

## 📞 Contato

Para reportar bugs ou sugerir features:
- **Email**: suporte@masterquizz.com
- **Tickets**: Via painel de suporte integrado
