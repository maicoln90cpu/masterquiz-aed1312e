# 📋 PENDÊNCIAS - MasterQuiz

## ✅ Onda 7 — Etapa 4 (dateUtils + lint warns + reduced-motion)

### O que mudou
- **`src/lib/dateUtils.ts` (novo)**: facade único para datas. Helpers: `now()`, `nowISO()`, `parseISO()` (tolerante, devolve null), `toDate()`, `format()`, `formatDate()` (dd/MM/yyyy), `formatDateTime()`, `formatTime()`, `formatLong()`, `formatISODate()`, `diffInDays()`, `relativeFromNow()`, `isValidDate()`. Tudo com fallback `"—"` para entradas nulas/inválidas, locale pt-BR default.
- **`src/lib/__tests__/dateUtils.test.ts`**: 11 testes cobrindo formatação, parsing tolerante, diff, validação e relativo. ✅ todos passando.
- **`eslint.config.js` — P21 (warn)**: `new Date()` sem argumentos em código de produção → sugere `now()`/`nowISO()` de `@/lib/dateUtils`. Exceções: `dateUtils.ts`, `useWebVitals.ts`, `performanceCapture.ts`, testes.
- **`eslint.config.js` — P22 (warn)**: `.single()` após `.insert/.update/.delete/.upsert` → sugere `.maybeSingle()` (single lança PGRST116 quando 0 linhas, maybeSingle devolve null).
- **`src/index.css`**: bloco `@media (prefers-reduced-motion: reduce)` global no fim do arquivo zera animações/transições/scroll-behavior. Respeita WCAG 2.3.3 (AAA) e configuração de SO de usuários com sensibilidade vestibular.

### Antes / Depois (leigo)
- **Antes**: cada componente formatava datas do seu jeito (`new Date(x).toLocaleDateString('pt-BR')`, `format(parseISO(x), 'dd/MM/yyyy')` direto, ou `String(x).slice(0,10)`). Strings vazias/null quebravam exibição.
- **Depois**: `formatDate(x)` em qualquer lugar devolve string previsível com fallback elegante. Animações desligam automaticamente para usuários sensíveis a movimento. Lint avisa quando alguém usa padrão antigo.

### Vantagens
- Centralização → trocar timezone/locale futuro vira 1 mudança.
- Mock fácil em testes (basta mockar `now()` em vez de `Date`).
- Acessibilidade WCAG AAA sem custo de runtime.
- Lint preventivo sem quebrar build (warns, não erros).

### Desvantagens / Riscos
- 56 edges legadas continuam usando `new Date(string)` — apenas warning, migração incremental.
- `.single()` warn pode ter falsos positivos em queries SELECT depois de mutation chain (raro). Verificar caso a caso.

### Checklist manual
1. Abrir DevTools → System Preferences → Reduce Motion ON: confirmar que animações framer-motion ficam estáticas no preview.
2. `bun test src/lib/__tests__/dateUtils.test.ts` → 11 ✅.
3. `bunx eslint src/components/admin/blog/BlogCostTracking.tsx` → 0 errors (warns esperadas de import-order pré-existentes).
4. Importar `formatDate` em qualquer arquivo novo: TS valida assinatura.

### Pendências (próximas etapas)
- **Etapa 5**: Contract Tests P18 (envelope), P19 (idempotência), P20 (`x-trace-id`) + atualizar `CODE_STANDARDS.md` com seção dateUtils + reduced-motion.
- **Migração incremental**: substituir `new Date()` por `now()` e `.single()` por `.maybeSingle()` em arquivos quentes (admin, recovery, billing). Meta: zerar warns P21/P22 em 4 PRs.
- **i18n datas**: hoje hardcoded em pt-BR; quando ativar EN/ES por usuário, ler locale de i18next dentro de `format()`.

### Prevenção de regressão
- Lint warns P21+P22 ativos em todo `src/**` exceto exceções listadas.
- Reduced-motion como **última regra** do `index.css` para vencer especificidade — se alguém adicionar CSS depois, adicionar dentro de `@media` ou no fim do arquivo.
- `dateUtils.ts` listado nas exceções ESLint para evitar self-trigger.

---

## ✅ Onda 7 — Etapa 2-bis + Etapa 3 (P18 fechado + P19 idempotência)

### Etapa 2-bis (concluída)
- **`growth-metrics`** migrada para envelope: `okResponse`/`errorResponse` no entry, role check, sucesso e catch. Header `x-trace-id` propagado.
- **`admin-view-user-data`**: 5 retornos internos do switch (`quiz_detail`, `fix_duplicates`, `republish`, `send_message`, `save_quiz`) trocados de `JSON.stringify({error})` para `errorResponse('VALIDATION_FAILED', ...)`.
- **Cobertura envelope**: 7/64 → **8/64 edges** (~12,5%) com 100% dos retornos da função em formato envelope.

### Etapa 3 (concluída) — Idempotência de Webhooks (P19)
- **Migração `webhook_events`**: tabela nova com `UNIQUE(provider, event_id)`, RLS (master_admin SELECT, service_role INSERT/UPDATE), índices em `(provider, received_at DESC)` e em `status` parcial. Função `cleanup_old_webhook_events()` (retenção 90 dias).
- **Helper `supabase/functions/_shared/idempotency.ts`**: `claimEvent`, `markEventProcessed`, `markEventFailed`. `claimEvent` usa INSERT + fallback SELECT em conflito → devolve `{ id, alreadyProcessed, previousResult }`.
- **`kiwify-webhook` migrada**:
  - Extrai `eventId = webhook_event_id || order_id:evento` do payload (real ou teste).
  - Antes de processar chama `claimEvent('kiwify', eventId)`. Se duplicado → retorna 200 com `previous` sem reprocessar (zero cobrança duplicada).
  - No sucesso chama `markEventProcessed(claim.id, finalResult)`.
  - Header `x-trace-id` agora aceito e ecoado.
- **`evolution-webhook` migrada**:
  - `eventId = event:messages.upsert.key.id` (mensagens) ou `event:instance:state:bucket1min` (connection.update).
  - Reentregas da mesma mensagem WhatsApp são bloqueadas → não duplica resposta da IA, não duplica `recovery_contacts.responded`, não duplica forward para admin.
- **Resiliência**: erro em `claimEvent` é não-fatal (apenas warn) — webhook segue processando para evitar perda de eventos críticos durante manutenção da tabela.

### Pendências para próximas etapas
- **Etapa 4**: `dateUtils.ts` central + ESLint warn `new Date()` e `.single()` em mutations + `prefers-reduced-motion` global.
- **Etapa 5**: contract tests P18 (envelope-coverage), P19 (claimEvent obrigatório nos webhooks), P20 (useEdgeFunction propaga `x-trace-id`); atualizar `CODE_STANDARDS.md`.
- **Sub-ondas 7-B…7-E**: migrar 56 edges restantes (notificações → alto input → crons → chatbot).
- **Cron**: agendar `SELECT cleanup_old_webhook_events()` semanal via `pg_cron`.
- **Painel admin**: card mostrando contagem de duplicados bloqueados/24h em `Sistema → Saúde`.

## ✅ Onda 7 — Etapa 2 (P18 — Validação + envelope nas edges admin)

### Feature: helpers `_shared/validation.ts` + envelope nas edges admin
- **Novo `supabase/functions/_shared/validation.ts`**: `parseBody`, `parseBodyOptional`, `parseQuery` com Zod.
  - Em falha retorna `Response 400` já no formato envelope `{ ok:false, error:{code,message}, traceId }`.
  - Re-exporta `z` para consistência de versão entre edges.
- **Auto-detect de envelope** em `invokeEdgeFunction`: novo default `legacyMode: 'auto'` detecta `ok:boolean + traceId` e faz `unwrapEnvelope` automaticamente. Edges legadas continuam funcionando sem mudança no client.
- **5 edges migradas para envelope + parseBody**:
  - `admin-update-subscription` (trial activate/cancel + plan update; `.single()` → `.maybeSingle()`)
  - `admin-view-user-data` (entry, role check, body parse, saída final, catch)
  - `system-health-check` (body opcional via `parseBodyOptional`)
  - `export-table-data` (whitelist preservada)
  - `save-quiz-draft`
- **Testes**: `invokeEdgeFunction.test.ts` ampliado (9 testes verdes — auto-detect, legacy override, envelope erro com code/traceId).
- **Cobertura de envelope**: 2/64 → 7/64 edges (~11%).

### Pendências para próximas etapas da Onda 7
- Etapa 2-bis: migrar `growth-metrics` (745 linhas, hunks longos) e demais retornos internos do switch em `admin-view-user-data`.
- Etapa 3: tabela `webhook_events` + `claimEvent` (idempotência Kiwify/Evolution).
- Etapa 4: `dateUtils.ts` + lint warn `new Date()`/`.single()` + `prefers-reduced-motion` global.
- Etapa 5: contract tests P18/P19/P20 + `CODE_STANDARDS.md`.
- Sub-ondas 7-B…7-E: migrar 56 edges restantes (notificações → alto input → crons → chatbot).

## ✅ Onda 7 — Etapa 1 (P18 — Camada universal de chamadas)

### Feature: facade única `invokeEdgeFunction` + hook `useEdgeFunction`
- **Novo `src/lib/invokeEdgeFunction.ts`**: porta única para chamar Edge Functions.
  - Gera/propaga `traceId` automaticamente (header `x-trace-id`).
  - Reaproveita `invokeResilient` (P15: timeout + retry + circuit breaker).
  - `legacyMode` (padrão `true`) permite migrar edges para envelope P11 gradualmente.
  - Erros normalizados em `EdgeCallError { code, message, traceId, status }`.
  - `defaultErrorMessage()` mapeia códigos para PT-BR.
- **Novo `src/hooks/useEdgeFunction.ts`**: hook React com `loading/error/data/traceId`,
  toast automático em PT-BR (sonner) e logger central.
- **Migração inicial (5 chamadas críticas)**:
  - `src/pages/SupportDashboard.tsx` — `admin-view-user-data`
  - `src/components/admin/TrialModal.tsx` — `admin-update-subscription` (ativar e cancelar)
  - `src/pages/Settings.tsx` — `export-user-data`, `delete-user-complete` (schedule + cancel)
  - `src/pages/Login.tsx` — `migrate-imported-user`
- **Teste unitário**: `src/lib/__tests__/invokeEdgeFunction.test.ts` (6 testes verdes).

## ✅ v2.43.0 — Camada de proteções automáticas (Fases 1–3 — 18/04/2026)

### Feature: 10 escudos de regressão (P1–P10)
- **Contract tests** (Vitest com `import.meta.glob`):
  - P1 — `user-roles-security.test.ts`: bloqueia INSERT direto em `user_roles` e admin-check via localStorage
  - P8 — `blocks-catalog.test.ts`: valida 30+ `BlockType` ↔ `blockPaletteCatalog` ↔ renderer
  - P10 — `gtm-persistence.test.ts`: garante persistência de eventos via `pushGTMEvent`
  - P6 — smoke test de batch PostgREST `.in()` ≤150
- **Lint rules** em `eslint.config.js`:
  - P2 — `no-restricted-syntax`: `window.dataLayer.push` proibido (use `pushGTMEvent`)
  - P3 — `no-restricted-syntax`: UPDATE direto em ICP cols de `profiles` proibido
  - P4 — warning `supabase.auth.getUser()` (prefira `useCurrentUser`)
  - P5 — `navigator.sendBeacon` proibido (use `fetch keepalive`)
  - P7 — warning para cores hardcoded fora de tokens HSL
- **Comentários-trava** (P9) em `src/hooks/useQuizPersistence.ts` para qualquer novo evento de publicação.

### Feature: Documentação v2.43.0
- Novo `docs/KNOWLEDGE.md` (≤9500 chars) — resumo executivo para Knowledge Base
- Novo **ADR-013** em `docs/ADR.md` — "Proteções de regressão como código"
- Snapshot completo regenerado em `docs/MEMOCOPY.md`
- Seções dedicadas em `SECURITY.md`, `CODE_STANDARDS.md`, `SYSTEM_DESIGN.md`

### Arquivos Alterados / Criados
| Arquivo | Mudança |
|---------|---------|
| `src/__tests__/contracts/user-roles-security.test.ts` | (criado nas fases anteriores) |
| `src/__tests__/contracts/blocks-catalog.test.ts` | (criado nas fases anteriores) |
| `src/__tests__/regression/gtm-persistence.test.ts` | (criado nas fases anteriores) |
| `eslint.config.js` | Regras P2/P3/P4/P5/P7 (fases anteriores) |
| `src/hooks/useQuizPersistence.ts` | Comentários-trava P9 |
| `docs/KNOWLEDGE.md` | NOVO — resumo ≤9500 chars |
| `docs/ADR.md` | + ADR-013 |
| `docs/SECURITY.md` | + seção testes de contrato |
| `docs/CODE_STANDARDS.md` | + seção lint rules ativas |
| `docs/SYSTEM_DESIGN.md` | + seção proteções automáticas |
| `docs/MEMOCOPY.md` | Snapshot v2.43.0 |
| `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `ONBOARDING.md` | Bump versão |

### Próximos passos sugeridos (não críticos)
- Limpeza incremental dos 105 arquivos com `console.log` (warning ativo)
- Limpeza incremental das 120 cores hardcoded (warning ativo)
- Reduzir baselines P4 (auth.getUser=30) e P7 (cores=120) à medida que código for migrado

---

## ✅ v2.42.0 — Storybook + Memórias Reorganizadas (Etapa 5 — 17/04/2026)

### Feature: Storybook para UI Base
- 5 componentes core com stories CSF 3.0: **Button** (9), **Input** (4), **Card** (1), **Badge** (4), **Alert** (2) — total 20 stories
- Configs prontos: `.storybook/main.ts`, `.storybook/preview.ts` (Tailwind via index.css)
- Type shim local (`src/types/storybook-shim.d.ts`) para typecheck sem instalar Storybook
- Doc `STORYBOOK.md` com guia de setup e padrões

### Feature: Memórias Reorganizadas
- `mem://index.md` reescrito por categoria (Architecture, Features, Messaging, Integrations, Analytics, CRM, Marketing, Tracking, Database/Admin, UI, Preferences)
- Core rules consolidadas em 9 linhas (top: formato resposta, auth, GTM, logger, tokens HSL, fetch, ICP, RTE scope, toasts, text block lock)
- Knowledge block já compactado abaixo de 9500 chars

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `.storybook/main.ts` | NOVO — config Storybook + Vite |
| `.storybook/preview.ts` | NOVO — preview com Tailwind tokens |
| `src/components/ui/button.stories.tsx` | NOVO — 9 stories |
| `src/components/ui/input.stories.tsx` | NOVO — 4 stories |
| `src/components/ui/card.stories.tsx` | NOVO — story composta |
| `src/components/ui/badge.stories.tsx` | NOVO — 4 variantes |
| `src/components/ui/alert.stories.tsx` | NOVO — default + destructive |
| `src/types/storybook-shim.d.ts` | NOVO — shim de tipos para CSF 3.0 |
| `docs/STORYBOOK.md` | NOVO — guia de uso |
| `mem://index.md` | Reorganizado por categoria |

### Próximos passos sugeridos (não críticos)
- Instalar Storybook real quando necessário (`npx storybook init`) — shim de tipos pode ser removido
- Adicionar stories para mais componentes (Tabs, Dialog, Form, Select)
- Deploy do Storybook estático (storybook-static) em CDN

---

## ✅ v2.42.0 — `/compare` + JSDoc + TypeDoc + HOOKS.md (17/04/2026)

### Feature: Página `/compare` (SEO + A/B Test)
- Landing comparativa estática (hero + tabela 18 features × 4 colunas + FAQ + CTA)
- JSON-LD Schema.org (`Product` + `Offer`) para rich snippets do Google
- A/B test no CTA ("Criar conta" vs "Testar 7 dias") reusando `landing_ab_tests`
- Inclusão automática em `blog-sitemap.xml`
- ADR-015 (compare estático) + ADR-016 (reuso A/B)

### Feature: Documentação Técnica de Hooks (etapa 4)
- **JSDoc completo** nos 6 hooks core: `useCurrentUser`, `useEffectiveUser`, `useUserRole`, `useEditorLayout`, `useSiteMode`, `useRateLimit`
- Padrão JSDoc: descrição + `@returns` + `@example` + `@see`
- **TypeDoc** configurado (`typedoc.json`) — gera markdown navegável em `docs/api/`
- Novo script: `npm run docs:api`
- Novo script: `npm run docs:validate`
- Novo doc `HOOKS.md`: catálogo de 60+ hooks por categoria

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `typedoc.json` | NOVO — config TypeDoc + plugin markdown |
| `docs/HOOKS.md` | NOVO — catálogo de hooks por categoria |
| `src/hooks/useCurrentUser.ts` | JSDoc completo (PT-BR) |
| `src/hooks/useEffectiveUser.ts` | JSDoc completo (PT-BR) |
| `src/hooks/useUserRole.ts` | JSDoc completo (PT-BR) |
| `src/hooks/useEditorLayout.ts` | JSDoc completo (PT-BR) |
| `src/hooks/useSiteMode.ts` | JSDoc completo (PT-BR) |
| `src/hooks/useRateLimit.ts` | JSDoc completo (PT-BR) |
| `package.json` | +scripts `docs:api`, `docs:validate` |
| `docs/ROADMAP.md` | Entrada 17/04/2026 |
| `docs/ONBOARDING.md` | Mapa de docs atualizado (+HOOKS, +CHANGELOG, +SERVICES, +MEMOCOPY) |

### Pendentes para Etapa 5
- Storybook para componentes UI base (`src/components/ui/`)
- Memory reorganization + Knowledge block compacto (≤9500 chars)
- JSDoc para os hooks restantes (incremental)
- Diagrama Mermaid expandido em SYSTEM_DESIGN (sub-fluxos)

---

## ✅ v2.42.0 - Painel Admin Reorganizado + Sistema de Monitoramento + Docs Overhaul (16/04/2026)

### Feature: Reorganização do Painel Admin (6 abas funcionais)
- Admin reorganizado de 7 abas genéricas para 6 domínios funcionais
- Abas: 🏠 Início, 👥 Usuários, 📝 Conteúdo, 💰 Vendas, ⚙️ Sistema, 🛠️ Dev Tools
- Componente `AdminSubTabs` reutilizável para sub-navegação
- Max 2 níveis de profundidade (aba → sub-aba)

### Feature: Aba Sistema Expandida (5 sub-abas de monitoramento)
- **🩺 Saúde:** Health check do sistema (system-health-check EF)
- **📊 Observabilidade:** 7 painéis — SLA, Custos IA, Delivery Email, Erros 24h, P95/P99 Performance, Web Vitals, Health Check histórico
- **🗄️ Banco de Dados:** Catálogo de 68 tabelas com tamanhos reais via RPC `get_table_sizes()`, 13 triggers, 15 cron jobs, 64 Edge Functions
- **⚙️ Configurações:** Settings do sistema (system_settings, site_settings)
- **🔍 GTM/Diag:** Diagnóstico GTM em 3 etapas (ID configurado → Script no DOM → DataLayer ativo) com retry 3x

### Feature: Observabilidade Service Layer
- `observabilityService.ts`: 7 queries de observabilidade (SLA, AI costs, delivery, erros, performance, web vitals, health)
- `gtmDiagnosticService.ts`: Diagnóstico GTM automatizado com 3 verificações sequenciais

### Feature: RPC get_table_sizes()
- Função PostgreSQL `SECURITY DEFINER` que retorna tamanho real de tabelas via `pg_total_relation_size`
- Retorna: table_name, total_bytes, total_size (pretty), row_estimate
- Usado no DatabaseMonitorTab para métricas reais do banco

### Docs: Overhaul Completo v2.42.0
- 20+ docs atualizados para v2.42.0
- Novos docs: `MEMOCOPY.md` (backup de memórias), `SERVICES.md` (catálogo de services)
- ADR-013: Reorganização Admin por Domínio Funcional
- ADR-014: Catálogos Hardcoded no DatabaseMonitorTab
- Cross-references atualizados com novos docs

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/AdminDashboard.tsx` | Reorganizado em 6 abas funcionais com sub-abas |
| `src/components/admin/system/SystemHealthTab.tsx` | NOVO — sub-aba Saúde |
| `src/components/admin/system/ObservabilityTab.tsx` | NOVO — 7 painéis de observabilidade |
| `src/components/admin/system/DatabaseMonitorTab.tsx` | NOVO — catálogo de DB com tamanhos reais |
| `src/components/admin/system/SystemSettingsTab.tsx` | NOVO — configurações do sistema |
| `src/components/admin/system/GTMDiagnosticTab.tsx` | NOVO — diagnóstico GTM 3 etapas |
| `src/services/observabilityService.ts` | NOVO — service layer de observabilidade |
| `src/services/gtmDiagnosticService.ts` | NOVO — service de diagnóstico GTM |
| `supabase/migrations/*_get_table_sizes.sql` | NOVO — RPC get_table_sizes() |
| `docs/MEMOCOPY.md` | NOVO — backup de todas as memórias |
| `docs/SERVICES.md` | NOVO — catálogo de services |
| `docs/ADR.md` | +ADR-013, +ADR-014 |
| `docs/*.md` (20+ arquivos) | Bump para v2.42.0, cross-references |

---

## ✅ v2.41.0 - GTM Centralizado + Growth Dashboard + Docs Overhaul (15/04/2026)

### Feature: Migração GTM Centralizada (Etapa 1)
- Todos os eventos legados migrados para `pushGTMEvent()` de `lib/gtmLogger.ts`
- Eventos migrados: SignupStarted, PlanUpgraded, QuizShared, EditorAbandoned, LeadExported
- Persistência automática em `gtm_event_logs` para todos os eventos

### Feature: Novos Eventos Comportamentais (Etapa 2)
- 6 novos eventos: QuizDuplicated, TemplateUsed, FirstLeadReceived, IntegrationConnected, SettingsUpdated, ProfileCompleted
- Milestone `first_lead_received` com lógica de "somente uma vez por usuário"
- `AccountCreated` restaurado via `pushGTMEvent`; `AccountCreated2` virou no-op

### Feature: Growth Dashboard (Etapa 3)
- Dashboard com 3 seções: Métricas ICP, Análise de Paywall, Análise de Conversão
- Edge Function `growth-metrics` dedicada para cálculos pesados
- Métricas: ICP Score, usuários engajados, taxa de ativação, análise de paywall

### Feature: Dashboard GTM com Controles de Integração
- Tabela `gtm_event_integrations` para controle de integração por evento
- 40+ eventos mapeados com categorias (Onboarding, Criação, Engajamento, etc.)
- Filtros avançados: por categoria, status de disparo (7d), status de integração GTM
- Card "Pendentes GTM" mostrando eventos não integrados

### Fix: Gráfico de Usuários Cadastrados
- Corrigida ordenação cronológica dos meses (antes embaralhados via Object.entries)
- Agora gera 6 meses fixos em ordem do mais antigo ao mais recente

### Docs: Overhaul Completo v2.41.0
- DATABASE_SCHEMA.md: 45+ → 68 tabelas documentadas
- EDGE_FUNCTIONS.md: 61 → 64 funções (+growth-metrics, check-expired-trials, sync-plan-limits)
- Todos os docs atualizados para v2.41.0
- Cross-references atualizados

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/lib/gtmLogger.ts` | Centralização de todos os eventos |
| `src/hooks/useAccountCreatedEvent.ts` | Restaurado pushGTMEvent para AccountCreated |
| `src/hooks/useAccountCreated2Event.ts` | No-op (evento duplicado desligado) |
| `src/hooks/useGrowthMetrics.ts` | NOVO — hook do Growth Dashboard |
| `src/components/admin/GrowthDashboard.tsx` | NOVO — dashboard de métricas |
| `src/components/admin/GTMEventsDashboard.tsx` | +40 eventos, +filtros, +integração GTM |
| `src/pages/AdminDashboard.tsx` | +GrowthDashboard, fix gráfico cronológico |
| `supabase/functions/growth-metrics/index.ts` | NOVO — Edge Function |
| `supabase/functions/check-expired-trials/index.ts` | NOVO — expiração de trials |
| `supabase/functions/sync-plan-limits/index.ts` | NOVO — sync de limites |
| `docs/DATABASE_SCHEMA.md` | 45+ → 68 tabelas |
| `docs/EDGE_FUNCTIONS.md` | 61 → 64 funções |

---

## ✅ v2.40.0 - Suporte Avançado + Visual Diff + Block Editor + Notificações + Docs Overhaul (14/04/2026)

### Feature: Modo Suporte Avançado
- SupportDashboard com impersonação segura (SupportModeContext + useEffectiveUser)
- SupportQuizEditor com edição completa de metadados, perguntas e blocos
- Diff visual antes/depois no modal de confirmação
- CRUD de perguntas (adicionar/remover) com atualização do question_count
- Histórico de sessões de suporte (reconstrução via audit_logs)
- Relatório PDF profissional com branding MasterQuiz (jsPDF + jspdf-autotable)
- Banner de modo suporte com cronômetro (SupportModeBanner)

### Feature: Editor de Blocos Admin (SupportBlockEditor)
- Interfaces dedicadas para 26 tipos de blocos (question, countdown, loading, nps, price, etc.)
- Editor JSON de fallback para 9 tipos menos comuns (com validação em tempo real)
- 100% de editabilidade dos 34 tipos de blocos

### Feature: Notificações ao Usuário
- Tabela `admin_notifications` com RLS (usuário vê só suas notificações)
- Componente NotificationBell integrado ao DashboardLayout
- Polling a cada 60s + marcação de lidas (individual e em massa)
- Notificação automática ao salvar quiz via suporte

### Docs: Overhaul Completo v2.40.0
- 6 novos docs: DATABASE_SCHEMA, SECURITY, CODE_STANDARDS, EDGE_FUNCTIONS, ONBOARDING, ADR
- Todos os docs existentes atualizados para v2.40.0 (14 arquivos)
- Edge Functions: 57 → 61
- Cross-references atualizados com os 20 docs

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/SupportQuizEditor.tsx` | Editor completo com diff visual + CRUD perguntas |
| `src/pages/support/SupportBlockEditor.tsx` | NOVO — editor de blocos admin (34 tipos) |
| `src/components/notifications/NotificationBell.tsx` | NOVO — sino de notificações |
| `src/components/admin/SupportModeBanner.tsx` | Banner com cronômetro |
| `src/contexts/SupportModeContext.tsx` | Context de impersonação + tracking |
| `src/components/DashboardLayout.tsx` | +NotificationBell no header |
| `src/lib/supportPdfReport.ts` | NOVO — geração de PDF de sessão |
| `supabase/functions/admin-view-user-data/index.ts` | +save_quiz, +session_history, +questions_to_add/delete, +notifications |
| `supabase/functions/admin-update-subscription/index.ts` | Atualização de plano pelo admin |
| Migration admin_notifications | NOVA tabela com RLS |
| `README.md` | v2.40.0, 61 EFs, +6 docs |
| `docs/*.md` (14 arquivos) | Versão 2.40.0 |
| `docs/DATABASE_SCHEMA.md` | NOVO |
| `docs/SECURITY.md` | NOVO |
| `docs/CODE_STANDARDS.md` | NOVO |
| `docs/EDGE_FUNCTIONS.md` | NOVO |
| `docs/ONBOARDING.md` | NOVO |
| `docs/ADR.md` | NOVO |

---

### Feature: Aba Custos de Email Transacional
- Novo componente `EmailRecoveryCosts.tsx` com cálculo detalhado de custos por categoria
- Cards de saldo, custo total, custo por email, emails restantes
- Tabela por categoria com volume e custo individual
- Baseado em recarga de R$190 = 40.533 emails

### Feature: Preview de Email antes do Envio em Massa
- Fluxo compose→preview→enviar para automação "Novidades da Plataforma"
- Modal com preview do assunto + HTML renderizado + contagem de destinatários
- Botão "Enviar Agora" com confirmação

### Feature: Comparação A×B (Modos de Monetização)
- Novo componente `ModeComparison.tsx` com métricas históricas por modo
- Segmenta cadastros, quizzes e conversões pagas por período A vs B
- Tabela comparativa com diferenças percentuais

### Feature: Preços Diferenciados por Modo (A/B)
- Colunas `price_monthly_mode_b` e `kiwify_checkout_url_mode_b` em `subscription_plans`
- Checkout dinâmico: usa preço/URL do modo ativo
- Fallback para valores padrão quando modo B não configurado

### Feature: GTM Lifecycle Tracking Completo
- Novo hook `useQuizGTMTracking.ts` integrado ao estado real do quiz
- `quiz_view` independe de `gtm_container_id` — dispara para todos os quizzes
- `quiz_start`, `quiz_complete`, `lead_captured` disparados nos pontos reais do fluxo
- `AccountCreated` só marca como enviado após persistência confirmada no banco

### Fix: Batching na `list-all-users`
- Refatorada para buscar profiles, subscriptions, roles, quizzes e audit_logs em lotes de 100
- Corrige dados zerados (nome, WhatsApp, logins, quizzes, leads) com 400+ usuários
- Tratamento de erro em cada consulta

### Fix: Custos de Email — Cálculo Correto
- Corrigido cálculo do custo total que somava saldo ao invés de subtrair
- Custo por email agora reflete R$190/40.533 = R$0,00469

### Docs: Overhaul Completo v2.39.0
- Todos os docs atualizados para v2.39.0
- Novo: `docs/MONETIZATION.md` — guia de monetização A/B
- `src/__tests__/README.md` substituído por ponteiro para `docs/TESTING.md`
- Cross-references atualizados com BLOG.md, EGOI.md e MONETIZATION.md
- Knowledge prompt atualizado para v2.39.0

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/recovery/EmailRecoveryCosts.tsx` | NOVO — aba de custos |
| `src/components/admin/recovery/EmailAutomations.tsx` | +fluxo preview de novidades |
| `src/components/admin/ModeComparison.tsx` | NOVO — comparação A×B |
| `src/hooks/useQuizGTMTracking.ts` | NOVO — lifecycle tracking |
| `src/hooks/useAccountCreatedEvent.ts` | persistência confirmada |
| `src/hooks/useQuizTracking.ts` | quiz_view independente |
| `src/pages/QuizView.tsx` | integração GTM lifecycle |
| `supabase/functions/list-all-users/index.ts` | batching em lotes de 100 |
| `README.md` | v2.39.0, +features, +troubleshooting, +doc links |
| `docs/PRD.md` | +5 RFs, +1 épico |
| `docs/ROADMAP.md` | +itens H1 2026, +histórico |
| `docs/SYSTEM_DESIGN.md` | +hooks, +GTM events, +batching |
| `docs/API_DOCS.md` | +batching list-all-users |
| `docs/COMPONENTS.md` | +3 componentes |
| `docs/CHECKLIST.md` | +5 itens de validação |
| `docs/TESTING.md` | +merge conteúdo src/__tests__/README.md |
| `docs/MONETIZATION.md` | NOVO |

---

## ✅ v2.38.0 - Fix Automações Email + Vault Secrets + Tracking (07/04/2026)

### Fix: Vault secrets para pg_cron
- Inseridos `supabase_url` e `supabase_anon_key` no vault do Supabase
- Os 4 cron jobs de automação (Blog Digest, Weekly Tip, Success Story, Monthly Summary) agora conseguem chamar as Edge Functions corretamente
- **Antes**: cron jobs falhavam silenciosamente (URL=NULL)
- **Depois**: cron jobs executam normalmente nos horários configurados

### Fix: Logging nas automações de email
- Todas as 5 funções de automação agora gravam registros na tabela `email_automation_logs`
- O dashboard de automações passa a mostrar histórico real de execuções
- Atualizam `email_automation_config` com última execução, contagem e resultado

### Fix: Tracking de abertura/clique (webhookUrl)
- Adicionado `webhookUrl` em todos os envios E-goi (bulk e single) das 5 funções
- A E-goi agora notifica o webhook `egoi-email-webhook` sobre aberturas e cliques
- **Antes**: apenas `process-email-recovery-queue` tinha tracking
- **Depois**: Blog Digest, Weekly Tip, Success Story, Monthly Summary e Platform News todos com tracking

### Funções alteradas
| Função | Mudanças |
|--------|----------|
| `send-blog-digest` | +webhookUrl +logAutomation |
| `send-weekly-tip` | +webhookUrl +logAutomation |
| `send-success-story` | +webhookUrl +logAutomation |
| `send-monthly-summary` | +webhookUrl +logAutomation |
| `send-platform-news` | +webhookUrl +logAutomation |


> Documento centralizado de changelog, pendências e histórico de desenvolvimento.

---

## ✅ v2.37.0 - Documentation Overhaul + Thin Router + Test Fixes (21/03/2026)

## ✅ v2.37.1 - Fix Preview Inline + Remoção da Cor no Text Block (30/03/2026)

### Fix: saída real do preview inline na COL 3
- O preview lateral do editor Modern deixou de usar `mode="fullscreen"` dentro da COL 3 e passou a usar `mode="inline"`, evitando o overlay que prendia o usuário no preview.
- `UnifiedQuizPreview` inline agora exibe botão `X Sair do Preview` ao lado de `Reiniciar`, com retorno imediato para o modo edição.
- O botão do header da COL 3 também passou a mostrar `X Sair do Preview` enquanto o preview está ativo.

### Simplificação: remoção da cor customizada do bloco Text
- Removida a propriedade `Cor do Texto` do painel do bloco Text.
- O `TextBlock` voltou a usar apenas a cor padrão do tema no editor e no preview publicado.
- `RichTextEditor` deixou de aceitar `textColor` para esse fluxo, eliminando a inconsistência reportada.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/CreateQuizModern.tsx` | preview inline da COL 3 corrigido + botão `X Sair do Preview` |
| `src/components/quiz/UnifiedQuizPreview.tsx` | header inline com ação explícita de saída |
| `src/components/quiz/blocks/TextBlock.tsx` | remoção do repasse de `textColor` |
| `src/components/quiz/blocks/RichTextEditor.tsx` | remoção do `textColor` customizado |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | remoção do controle `Cor do Texto` no bloco Text |
| `src/components/quiz/preview/StaticBlockPreviews.tsx` | preview do Text volta a usar cor padrão do tema |
| `docs/PENDENCIAS.md` | changelog da correção |

### Fix: WYSIWYG final da Etapa 1/2 do editor Modern
- `RichTextEditor` agora respeita `textColor` no canvas do editor, corrigindo o caso em que o texto permanecia preto mesmo após escolha de cor.
- `ImageBlock` passou a respeitar `borderRadius` (`none` → `full`) e `shadow` (`none` → `large`) com os valores reais usados no painel.
- `CreateQuizModern` ganhou saída real do modo preview: botão no header, botão dentro do preview e atalho `Esc` para voltar à edição.

### Feature: Finalização da Etapa 2 dos blocos
- `AnimatedCounter` recebeu botão de reset do preview com reinício real da animação via `_previewKey`.
- `IconList` aplica a cor configurada ao texto dos itens (explicando a limitação técnica dos emojis).
- `Rating` agora suporta `halfStars`, permitindo seleção de 0.5 estrela no editor e no quiz.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/components/quiz/blocks/RichTextEditor.tsx` | suporte a `textColor` no editor |
| `src/components/quiz/blocks/TextBlock.tsx` | repassa `textColor` ao editor rico |
| `src/components/quiz/blocks/ImageBlock.tsx` | corrige shadow + borda arredondada inline |
| `src/components/quiz/blocks/AnimatedCounterBlock.tsx` | reinicia preview com `key` |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | reset do counter, ajuda do IconList, toggle de half-stars |
| `src/components/quiz/preview/VisualBlockPreviews.tsx` | cor do IconList aplicada ao texto |
| `src/components/quiz/preview/InteractiveBlockPreviews.tsx` | half-stars no Rating |
| `src/pages/CreateQuizModern.tsx` | botão sair do preview + atalho `Esc` |

### Feature: CreateQuiz Thin Router (Classic/Modern)
- `CreateQuiz.tsx` refatorado como thin router: só decide Classic vs Modern via `useEditorLayout`
- `CreateQuizClassic.tsx` e `CreateQuizModern.tsx` carregados via `React.lazy` + `Suspense`
- Elimina hooks duplicados que causavam freeze no editor Modern

### Feature: Imagens por Opção de Resposta no Quiz Publicado
- `optionImages`, `optionImageLayout`, `optionImageSize` suportados no `QuizViewQuestion`
- Layouts: acima do texto, ao lado (esquerda/direita), somente imagem
- Tamanhos: small, medium, large

### Feature: Templates Re-habilitados
- `disabledTemplateIds` removido — 14 templates ativos novamente
- Todos os templates renderizam corretamente no preview e no quiz público

### Fix: Estabilização da Suíte de Testes (~22 correções)
- `useUserRole.test.tsx`: `vi.unmock` para AuthContext e useUserRole, supabase mock expandido
- `Analytics.test.tsx`: Mock de DashboardLayout, AuthContext override com user autenticado
- `CRM.test.tsx`: Mock de DashboardLayout, useUserStage, useTrackPageView
- `Dashboard.test.tsx`: Mock de DashboardLayout com primaryCTA e stageLabel
- `UnifiedQuizPreview.test.tsx`: Assertions corrigidas (getByText vs getByLabelText, progress %)

### Fix: Label PQLAnalytics A/B
- "Primeiro Quiz Criado" → "Primeiro Quiz Editado Manualmente" (reflete condição `hasUserInteracted`)

### Docs: Overhaul Completo v2.37.0
- Todos os docs atualizados para v2.37.0, contagem de blocos 22→34
- `blocks.md` renomeado para `BLOCKS.md`
- Novo: `docs/TESTING.md` — guia de infraestrutura de testes
- Cross-references corrigidos entre documentos
- Knowledge prompt atualizado

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/CreateQuiz.tsx` | Thin router (lazy Classic/Modern) |
| `src/components/admin/PQLAnalytics.tsx` | Label A/B corrigido |
| `README.md` | v2.37.0, 34 blocos, BLOCKS.md, TESTING.md |
| `docs/PENDENCIAS.md` | +v2.37.0 entry |
| `docs/ROADMAP.md` | +H1 2026 items |
| `docs/PRD.md` | +RF02.13, RF02.14, 34 blocos |
| `docs/SYSTEM_DESIGN.md` | 34 blocos, thin router |
| `docs/COMPONENTS.md` | +CreateQuizClassic/Modern |
| `docs/STYLE_GUIDE.md` | +thin router pattern |
| `docs/CHECKLIST.md` | +image options, editor mode |
| `docs/BLOCKS.md` | Renomeado, v2.37.0 |
| `docs/TESTING.md` | NOVO |
| `docs/AUDIT_TEMPLATE.md` | +block coverage item |
| `docs/API_DOCS.md` | v2.37.0 |

---

## ✅ v2.36.0 - Fix Preview Atual + Bloco Calculadora (20/03/2026)

### Bug Fix: Preview Atual sempre mostrava pergunta 1
- **Causa**: `useQuizPreviewState` inicializava `internalQuestionIndex = 0` e o `useEffect` com ref não detectava mudança no mount.
- **Correção**: Inicializa com `externalQuestionIndex ?? 0`, força `currentStep = 'quiz'` quando `externalQuestionIndex` é fornecido, e `showIntroScreen={false}` no Preview Atual.

### Feature: Bloco Calculadora
- Novo tipo `calculator` registrado em `BlockType` com interface `CalculatorBlock`.
- Campos: fórmula, variáveis (com pergunta-fonte), unidade, prefixo, casas decimais, faixas de resultado.
- Adicionado ao catálogo (`blockPaletteCatalog.ts`), dropdown do editor, painel de propriedades, e preview.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQuizPreviewState.ts` | Fix init index + force quiz step |
| `src/pages/CreateQuizModern.tsx` | `showIntroScreen={false}` no Preview Atual |
| `src/types/blocks.ts` | +`calculator` type, +`CalculatorBlock` interface, +createBlock, +normalizeBlock |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +Calculadora na seção Avançado |
| `src/components/quiz/blocks/BlockEditor.tsx` | +calculator no dropdown, renderBlock, isBlockComplete |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +CalculatorProperties panel completo |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +calculator icon e label |
| `src/components/quiz/QuizBlockPreview.tsx` | +calculator case no preview |

---

## ✅ v2.35.0 - Seletor Inteligente de Perguntas nos Blocos (20/03/2026)

### Melhoria: Dropdown de Perguntas no Painel de Propriedades
- **QuestionSelector**: Dropdown reutilizável que lista todas as perguntas do quiz (P1, P2, P3...) com texto truncado. Substitui o campo manual "Cole o ID da pergunta".
- **QuestionMultiSelector**: Checkboxes para selecionar múltiplas perguntas (usado no Resumo de Respostas e Comparação Dinâmica). Mostra contagem de selecionadas, botão limpar.
- **Fallback automático**: Se `questions` não for passado (ex: editor Classic), mantém o input de texto manual.

### Blocos Atualizados
| Bloco | Antes | Depois |
|-------|-------|--------|
| Botão (personalização dinâmica) | Input "Cole o ID" | Select dropdown com perguntas |
| Texto Condicional | Input "Cole o ID" | Select dropdown com perguntas |
| CTA Personalizado | Input "Cole o ID" | Select dropdown com perguntas |
| Comparação Dinâmica | Input "IDs separados por vírgula" | Multi-select com checkboxes |
| Resumo de Respostas | Input "IDs separados por vírgula" | Multi-select com checkboxes |
| Recomendação (regras) | Input "ID pergunta" tiny | Select dropdown inline por regra |

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +2 componentes (QuestionSelector, QuestionMultiSelector), +`questions` prop, 6 blocos atualizados |
| `src/pages/CreateQuizModern.tsx` | Passa `questions` para BlockPropertiesPanel |

---

## ✅ v2.34.0 - Etapa 4: Motor de Recomendação (20/03/2026)

### Novo Bloco: Recommendation Engine
- **Recomendação (recommendation)**: Motor de recomendação baseado em regras que sugere produtos/serviços conforme respostas do quiz. Cada recomendação tem nome, descrição, imagem, badge, botão com URL, e regras de match (pergunta + respostas + peso). Sistema de pontuação automático com 3 modos: melhor match, top 3 ou todos com score. 3 estilos visuais (card/list/grid). Exibe pontuação de compatibilidade opcionalmente.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/types/blocks.ts` | +1 interface (RecommendationBlock), +1 createBlock, +1 normalizeBlock, +1 union type |
| `src/components/quiz/preview/RecommendationBlockPreview.tsx` | NOVO — motor de recomendação com scoring e 3 estilos |
| `src/components/quiz/QuizBlockPreview.tsx` | +1 case no switch, +1 import |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +1 item na seção "Dinâmico" |
| `src/components/quiz/blocks/BlockEditor.tsx` | +1 dropdown, blockTypeNames, isBlockComplete, renderBlock |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +1 painel de propriedades completo com editor de regras |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +1 item |

---

## ✅ v2.33.0 - Etapa 3: 3 Novos Blocos Dinâmicos com Respostas (20/03/2026)

### 3 Novos Blocos Dependentes de Respostas
- **Texto Condicional (conditionalText)**: Exibe texto diferente baseado na resposta de uma pergunta específica. Configurável com múltiplas condições (resposta → texto) e fallback. 3 estilos (default/highlighted/card).
- **Comparação Dinâmica (comparisonResult)**: Antes/depois personalizado com placeholders {resposta1}, {resposta2} substituídos por respostas reais. Grid lado a lado com ícones ✅/❌.
- **CTA Personalizado (personalizedCTA)**: Botão com texto dinâmico usando template {resposta}. Suporta condições avançadas (resposta → texto + URL), 4 variantes visuais, 3 tamanhos, abrir em nova aba.

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/types/blocks.ts` | +3 interfaces, +3 createBlock, +3 normalizeBlock |
| `src/components/quiz/preview/DynamicBlockPreviews.tsx` | +3 componentes (ConditionalText, ComparisonResult, PersonalizedCTA) |
| `src/components/quiz/QuizBlockPreview.tsx` | +3 cases no switch |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +3 itens na seção "Dinâmico" |
| `src/components/quiz/blocks/BlockEditor.tsx` | +3 dropdown, blockTypeNames, isBlockComplete, renderBlock |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +3 painéis de propriedades completos |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +3 itens |

---

## ✅ v2.32.0 - Etapa 2: 3 Novos Blocos Dinâmicos (20/03/2026)

### 3 Novos Blocos Dinâmicos (dependem de dados em runtime)
- **Resumo de Respostas (answerSummary)**: Exibe todas as respostas anteriores do usuário inline no quiz. No editor mostra preview placeholder; no quiz publicado mostra dados reais. 3 estilos (card/list/minimal), ícones opcionais.
- **Mensagem de Progresso (progressMessage)**: Mensagem motivacional que muda conforme % do quiz completado. Configurável com múltiplos thresholds. 3 estilos (card/inline/toast).
- **Grupo de Avatares (avatarGroup)**: Prova social visual com avatares + contador ("+1.234 pessoas já fizeram este quiz"). Avatares circulares ou quadrados, quantidade configurável.

### Fluxo de dados runtime
- `QuizBlockPreview` agora aceita props opcionais: `answers`, `questions`, `currentStep`, `totalQuestions`
- `QuizViewQuestion` passa dados runtime para blocos dinâmicos via `QuizBlockPreview`
- Blocos dinâmicos funcionam tanto no editor (com dados placeholder) quanto no quiz publicado (com dados reais)

### Arquivos Alterados
| Arquivo | Mudança |
|---------|---------|
| `src/types/blocks.ts` | +3 interfaces (AnswerSummaryBlock, ProgressMessageBlock, AvatarGroupBlock), createBlock, normalizeBlock |
| `src/components/quiz/preview/DynamicBlockPreviews.tsx` | NOVO — 3 componentes de preview dinâmicos |
| `src/components/quiz/QuizBlockPreview.tsx` | +4 props opcionais, +3 cases no switch, import DynamicBlockPreviews |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Passa answers/questions/currentStep/totalQuestions para QuizBlockPreview |
| `src/components/quiz/blocks/blockPaletteCatalog.ts` | +3 itens na nova seção "Dinâmico" |
| `src/components/quiz/blocks/BlockEditor.tsx` | +3 no dropdown, blockTypeNames, isBlockComplete, renderBlock |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | +3 painéis de propriedades, BLOCK_ICONS, BLOCK_NAMES |
| `src/components/quiz/blocks/CompactBlockPalette.tsx` | +3 itens no blockTypes, getBlockIcon, getBlockLabel |

---

## ✅ v2.31.0 - Etapa 1: Paridade de Blocos + 5 Novos Blocos Visuais (20/03/2026)

### Paridade de Blocos (6 blocos existentes adicionados ao catálogo e dropdown)
- `button`, `price`, `metrics`, `loading`, `progress`, `countdown` agora disponíveis no dropdown Classic e na paleta Modern
- Antes só existiam na sidebar Classic (CompactBlockPalette)

### 5 Novos Blocos Visuais
- **Callout/Alerta**: Caixa colorida com ícone, título, lista de itens e nota de rodapé (4 variantes: warning/info/success/error)
- **Lista com Ícones**: Lista com emojis/ícones customizáveis e texto (layout vertical ou horizontal)
- **Citação/Destaque**: Citação com aspas, borda lateral colorida e autor opcional (3 estilos)
- **Selos/Badges**: Linha de selos com ícone + texto (outline ou filled, 3 tamanhos)
- **Banner/Faixa**: Faixa colorida para destaque (4 variantes: promo/warning/success/info, dispensável)

### Arquivos Alterados
- `src/types/blocks.ts` — 5 novos tipos + interfaces + createBlock + normalizeBlock
- `src/components/quiz/blocks/blockPaletteCatalog.ts` — +11 itens (6 paridade + 5 novos) + nova seção "Visual"
- `src/components/quiz/blocks/BlockEditor.tsx` — dropdown com todos os 27 blocos + isBlockComplete + renderBlock
- `src/components/quiz/blocks/CompactBlockPalette.tsx` — labels e ícones dos 5 novos
- `src/components/quiz/blocks/BlockPropertiesPanel.tsx` — 5 novos painéis de propriedades
- `src/components/quiz/preview/VisualBlockPreviews.tsx` — 5 novos componentes de preview
- `src/components/quiz/QuizBlockPreview.tsx` — 5 novos cases no switch

---

## ✅ v2.29.0 - Rotação de Prompts de Imagem do Blog + Cooldown de Campanhas (15/03/2026)

### Sistema de Rotação de Prompts de Imagem
- **Tabela `blog_image_prompts`**: 5 estilos visuais pré-cadastrados com rotação automática
- **Estilos implementados**: Objetos 3D, Pessoa Real Pop, Flat Lay, Conceitual Hiper-Realista, Gradiente Abstrato
- **Lógica de rotação**: Seleção aleatória excluindo o último prompt usado (`last_used_at`)
- **Tracking de uso**: Campos `usage_count` e `last_used_at` atualizados a cada geração
- **Fallback**: Se nenhum prompt ativo, usa `image_prompt_template` do `blog_settings`

### Edge Functions Atualizadas
- **`generate-blog-post`**: Busca prompts ativos da tabela, seleciona aleatoriamente com anti-repetição
- **`regenerate-blog-asset`**: Mesma lógica de rotação para regeneração individual de imagens

### UI Admin (BlogPromptConfig)
- Cards por estilo com Switch de ativação, contagem de uso e data do último uso
- Edição inline de prompts (clique para expandir)
- CRUD completo: adicionar, editar, ativar/desativar, remover estilos
- Prompt fallback separado abaixo da lista de rotação

### Cooldown Global de Campanhas (RecoveryCampaigns)
- Card "Cooldown Entre Contatos" com Switch + Input numérico (dias)
- Persiste em `recovery_settings.user_cooldown_days`
- Botão "Atualizar Alvos" por campanha ativa (chama `check-inactive-users`)

### Arquivos Criados/Editados
| Arquivo | Ação |
|---------|------|
| `supabase/migrations/20260315*` | NOVO — tabela `blog_image_prompts` + seed 5 estilos |
| `src/components/admin/blog/BlogPromptConfig.tsx` | Reescrito — rotação + CRUD |
| `supabase/functions/generate-blog-post/index.ts` | Rotação de prompts |
| `supabase/functions/regenerate-blog-asset/index.ts` | Rotação de prompts |
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Cooldown global + refresh |

---

## ✅ v2.28.0 - Eventos GTM Completos + Dashboard de Observabilidade (09/03/2026)

### 5 Novos Eventos GTM
- **SignupStarted**: Disparado ao acessar aba "Criar Conta" (Login.tsx, 1x/sessão)
- **PlanUpgraded**: Hook detecta transição free→pago via localStorage (usePlanUpgradeEvent.ts)
- **QuizShared**: Disparado ao copiar link (CreateQuiz.tsx) ou embed (EmbedDialog.tsx)
- **EditorAbandoned**: Disparado via visibilitychange quando editor tem alterações não publicadas
- **LeadExported**: Disparado ao exportar Excel/CSV no CRM e Responses

### Infraestrutura de Tracking
- **gtmLogger.ts**: Helper centralizado — push dataLayer + persist em gtm_event_logs
- **Tabela gtm_event_logs**: Persistência de eventos com cleanup automático 30 dias
- **RLS**: INSERT para authenticated, SELECT para admins

### Dashboard GTM no Admin
- Sub-tab "Eventos GTM" na aba Observabilidade
- Cards: total 24h, total 7d, tipos únicos
- Tabela de contagem por evento com categoria
- Log dos últimos 100 disparos com filtro
- Auto-refresh (15s logs, 30s contagens)

### Re-disparo AccountCreated
- Reset de account_created_event_sent para perfis dos últimos 5 dias
- Correção de captura GTM que estava com evento divergente

### Arquivos Criados/Editados
| Arquivo | Ação |
|---------|------|
| src/lib/gtmLogger.ts | NOVO — helper centralizado |
| src/hooks/usePlanUpgradeEvent.ts | NOVO — detecta upgrade |
| src/components/admin/GTMEventsDashboard.tsx | NOVO — dashboard |
| src/pages/Login.tsx | SignupStarted |
| src/pages/CreateQuiz.tsx | QuizShared + EditorAbandoned |
| src/components/quiz/EmbedDialog.tsx | QuizShared (embed) |
| src/pages/CRM.tsx | LeadExported |
| src/pages/Responses.tsx | LeadExported (Excel + CSV) |
| src/App.tsx | Integrar usePlanUpgradeEvent |
| src/pages/AdminDashboard.tsx | Sub-tab GTM Events |
| Migration SQL | gtm_event_logs + cleanup |

---

## ✅ v2.27.0 - Correções de Banco + Refatoração QuestionsList (25/02/2026)

### Correções de Banco de Dados

#### Bug Crítico: `useFunnelData.ts` — query reescrita
- **Problema:** `.select('quizzes!inner(user_id, title)')` fazia JOIN via PostgREST, mas dependia de FK que não existia inicialmente. Mesmo após FK criada, a query era frágil.
- **Solução:** Reescrita para 2 queries separadas: 1) busca quiz_ids do usuário via `quizzes`, 2) filtra `quiz_step_analytics` com `.in('quiz_id', ids)`.
- **Impacto:** Elimina erro 400 em analytics de funil.

#### AdminDashboard: tratamento gracioso de `validation_requests`
- **Problema:** Query a tabela `validation_requests` retornava 400 quando role admin não estava resolvida.
- **Solução:** `try/catch` que retorna `{ data: [], error: null }` silenciosamente.
- **Impacto:** Elimina logs de erro desnecessários no console.

#### Análise completa dos 19 erros de banco
| Erro | Veredicto |
|------|-----------|
| quiz_step_analytics 400 | ✅ Corrigido (query reescrita) |
| validation_requests 400 | ✅ Corrigido (try/catch) |
| column "qual" 42703 | ⚪ Query manual externa |
| auth/token 400 | ⚪ Credenciais inválidas (normal) |
| user_roles 23505 | ⚪ ON CONFLICT trata |
| user_subscriptions 23505/409 | ⚪ ON CONFLICT trata |
| auth/user 403 | ⚪ Token expirado (normal) |

### Refatoração QuestionsList (Editor Sidebar)

#### Layout dos cards refatorado
- **Antes:** `flex items-center` com `truncate` (1 linha) — botões empurrados para fora
- **Depois:** `flex items-start` com `line-clamp-2 break-words` (2 linhas) — ícones fixos à direita
- Ícone de editar (lápis) + excluir (lixeira) sempre visíveis
- Duplo clique no texto ou clique no lápis para editar inline

### Arquivos Editados
| Arquivo | Alterações |
|---------|------------|
| `src/hooks/useFunnelData.ts` | Query reescrita sem JOIN, try/catch |
| `src/pages/AdminDashboard.tsx` | try/catch em validation_requests |
| `src/components/quiz/QuestionsList.tsx` | Layout cards refatorado |
| `.lovable/plan.md` | Análise documentada dos erros de banco |

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

#### Hooks Criados
| Hook | Descrição |
|------|-----------|
| `useUserStage.ts` | Gerencia nível PQL e CTAs dinâmicos |
| `useTestLead.ts` | Gera leads de teste para simulação |
| `useTrackPageView` | Rastreia visualização de CRM/Analytics |

---

## ✅ v2.25.0 - Paradigma Auto-Convencimento + i18n Completo (04/02/2025)

### Mudança Conceitual (MAJOR)
- **Antes:** Plataforma de qualificação e segmentação de leads
- **Depois:** Plataforma de funis de auto-convencimento via perguntas estratégicas

### Landing Page i18n (PT/EN/ES)
- 14 chaves `hero_*` atualizadas com novo paradigma
- Demo mockup internacionalizado

### Edge Function: generate-quiz-ai
- Prompts de IA atualizados para auto-convencimento
- Estrutura obrigatória: 5 fases de consciência

### Admin Dashboard Otimizado
- Lazy loading de 15+ componentes pesados
- TanStack Query com cache 5min

---

## ✅ v2.24.0 - Documentação e Correções (23/01/2025)

- Correção crítica: inicialização de perguntas no CreateQuiz.tsx
- Landing page: 6 novos feature cards
- `docs/SYSTEM_DESIGN.md` criado
- Documentação sincronizada (README, PRD, ROADMAP)

---

## ✅ v2.23.0 - Calculator Wizard + Correções UX (12/01/2025)

- Calculator Wizard (3 passos): VariableStep, FormulaStep, RangesStep
- Botão deletar sempre visível no QuestionsList
- Confirmação de deleção com AlertDialog
- CHECKLIST.md criado

---

## ✅ v2.22.0 - Performance (12/01/2025)

- Lazy loading agressivo (EditorComponentsBundle, AnalyticsChartsBundle)
- Hooks: useStableCallback, useDeferredValue
- Vite: 13 chunks separados, ES2020 target
- QuizView.tsx: 1146 → ~100 linhas

---

## ✅ v2.21.0 - QuizCard + Responsividade (12/01/2025)

- QuizCard: layout 4 linhas (mobile/tablet/desktop)
- CRM: kanban scroll horizontal
- Responses: filtros flex-wrap

---

## ✅ v2.20.0 - Refatoração + i18n (12/01/2025)

- QuizCard isolado como componente
- 40+ novas chaves i18n
- Edge Functions padronizadas (_shared/cors.ts, auth.ts)

---

## ✅ v2.19.0 - Segurança + Autosave + Testes (08/01/2025)

- RLS hardening (ab_test_sessions, landing_ab_sessions)
- View user_integrations_safe
- Hook useAutoSave (debounce 30s)
- ~430 testes automatizados

---

## ✅ v2.18.0 - Testes Automatizados (23/12/2024)

- Setup Vitest + Testing Library
- ~285 testes (validations, sanitize, calculator, auth, pages)
- CI/CD com cobertura mínima 50%

---

## ✅ v2.17.0 e anteriores

Consultar histórico detalhado nos commits e no ROADMAP.md.

---

## 🔄 Pendências Abertas

### Prioridade Alta
- [ ] Internacionalização: remover strings hardcoded do painel admin (51 arquivos, ~1160 strings — só PT-BR)
- [ ] 2FA implementation
- [x] ~~Migrar eventos GTM legados para pushGTMEvent~~ ✅ **Validado em 2026-04-17**: 100% migrado. Apenas `gtmLogger.ts` (helper), `gtmDiagnosticService.ts` (leitura) e `GTMDiagnosticTab.tsx` (UI) referenciam dataLayer. Proteção ESLint `no-restricted-syntax` adicionada.
- [x] ~~Testar rotação de prompts de imagem em produção~~ ✅ **Validado em 2026-04-17**: 6 estilos cadastrados, 4 já usados (Flat Lay 4×, Conceitual 4×, 3D 3×, Pessoa Real 3×), 2 virgens (Gradiente, Bold Flat). Anti-repetição funcionando, `usage_count` incrementando corretamente.

### Prioridade Média
- [ ] API pública v1
- [ ] Webhook documentation
- [ ] AI quiz optimization suggestions

### Prioridade Baixa
- [ ] White-label completo
- [ ] SSO (SAML/OIDC)
- [ ] Team workspaces

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup, stack e arquitetura |
| [PRD.md](./PRD.md) | Requisitos do produto e backlog |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Padrões de código |
| [CHECKLIST.md](./CHECKLIST.md) | Checklist de validação MVP |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [TESTING.md](./TESTING.md) | Guia de testes |
