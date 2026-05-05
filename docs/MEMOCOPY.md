# 📝 MEMOCOPY — Backup de Memórias do Projeto

> Cópia completa de todas as memórias persistidas na sessão de desenvolvimento.
> **Versão 2.44.0 | 5 de Maio de 2026**
>
> Este arquivo é regenerado a cada release importante para servir como backup
> caso a memória do projeto seja perdida ou precise ser auditada.

---

## 🧭 Como ler este arquivo

- **Core Rules**: regras aplicadas a TODA ação (sempre em contexto)
- **Memories por Categoria**: detalhes específicos consultados quando relevantes
- **Preferences**: configurações do usuário e do projeto sobre formato de resposta

---

## ⚡ Core Rules (aplicadas a TODA ação — ordem de prioridade)

1. **#1 ABSOLUTA — Formato de resposta obrigatório**: Sempre PT-BR leigo por etapas seguras. Para cada etapa: 1) o que mudou (antes vs depois), 2) o que melhorou, 3) vantagens/desvantagens, 4) checklist manual de validação, 5) pendências (agora ou futuro), 6) avaliar proteção permanente para evitar regressão, 7) próximos passos com ganho. Ver `mem://preferences/output-format`.
2. **Auth:** Use `useCurrentUser` instead of `supabase.auth.getUser()`.
3. **Impersonation:** Use `useEffectiveUser()` em telas com modo suporte admin.
4. **GTM (ADR-010):** Sempre `pushGTMEvent` de `@/lib/gtmLogger` — NUNCA `window.dataLayer.push` direto.
5. **Logger:** `@/lib/logger` — nunca `console.log`.
6. **Design tokens:** apenas tokens HSL semânticos — nunca cores hardcoded.
7. **Network:** Use `fetch` with `keepalive: true` and `apikey` header instead of `navigator.sendBeacon`.
8. **PostgREST:** Batch `.in()` queries up to 150 IDs to avoid URL length limits.
9. **ICP counters:** em `profiles` devem usar `src/lib/icpTracking.ts` (RPCs SECURITY DEFINER atômicas), nunca UPDATE direto.
10. **`is_icp_profile` imutável** após 1ª escrita — gravar com filtro `.is('is_icp_profile', null)` no client (ADR-014).
10. **Roles:** verificação via `has_role()` server-side ou `useUserRole` — nunca localStorage. INSERT direto em `user_roles` proibido (allowlist auditada em `SECURITY.md`).
11. **Editor CSS:** Scope `RichTextEditor` CSS with `useId()` (e.g., `.rte-r1`) to prevent style bleeding.
12. **Errors:** Persist detailed DB errors in toasts (not generic messages) to aid debugging.
13. **UI lock:** Text block color customizability is removed for visual consistency; do not re-add.
14. **Proteções P1-P10 ativas:** ver `mem://quality/regression-shields`. Quebra de qualquer escudo falha CI/CD.

---

## 🛡️ Proteções automáticas (Fases 1–3 — abr/2026, v2.44.0)

10 escudos contra regressão. Falham `npm run test` ou `npm run lint`.

| ID | Tipo | Local | Bloqueia |
|----|------|-------|----------|
| P1 | Contract test | `src/__tests__/contracts/user-roles-security.test.ts` | INSERT direto em `user_roles`; admin via localStorage |
| P2 | ESLint error | `eslint.config.js` | `window.dataLayer.push` direto |
| P3 | ESLint error | `eslint.config.js` | UPDATE direto em colunas ICP de `profiles` |
| P4 | ESLint warn | `eslint.config.js` | `supabase.auth.getUser()` (baseline ~30) |
| P5 | ESLint error | `eslint.config.js` | `navigator.sendBeacon` |
| P6 | Smoke test | `src/__tests__/regression/postgrest-batch.test.ts` | Batch `.in()` >150 IDs |
| P7 | ESLint warn | `eslint.config.js` | Cores hardcoded (baseline ~120) |
| P8 | Contract test | `src/__tests__/contracts/blocks-catalog.test.ts` | BlockType sem catálogo/renderer |
| P9 | Comentário-trava | `src/hooks/useQuizPersistence.ts` | Novo evento publicação sem source/dedup/persist |
| P10 | Smoke test | `src/__tests__/regression/gtm-persistence.test.ts` | `pushGTMEvent` sem persistir em `gtm_event_logs` |

Decisão registrada em **ADR-013** (`docs/ADR.md`).

---

## 📚 Memories por Categoria

### 🛡️ Quality
- **Regression Shields** (`mem://quality/regression-shields`) — 10 escudos automáticos P1-P10 (ver tabela acima).

### 🏗️ Architecture
- **Infra Parsing PDF** (`mem://architecture/infra-parsing-pdf`) — Edge Function `parse-pdf-document` com `unpdf` Deno; max 20MB/50 páginas.
- **Histórico de Estado** (`mem://architecture/historico-estado-e-memoria`) — `useHistory`: undo/redo max 30 estados, 5MB, auto-pruning.
- **Blog Engine** (`mem://architecture/blog-engine-replicabilidade`) — 4 camadas: React + Supabase/Deno + Bunny CDN + IA.

### 📊 Analytics
- **Webhooks por Campo** (`mem://analytics/webhooks-por-campo-e-captura-precoce`) — `webhookOnSubmit` em TextInput/NPS/Slider para captura precoce.
- **Conclusão do Funil** (`mem://analytics/redefinicao-conclusao-funil`) — Evento `complete` dispara ao chegar na última pergunta.
- **Email Costs** (`mem://analytics/email-costs-logic-deduplication`) — R$ 0,00469/email; conta só `sent_at` not null.

### 🔌 Integrations
- **E-Goi Schedules** (`mem://integrations/e-goi-recuperacao-templates-e-ia`) — pg_cron: Blog Digest 10d, Tip seg, Story qui.
- **E-Goi Tracking** (`mem://integrations/e-goi-tracking-transactional`) — `webhookUrl` em Slingshot V2 para opens/clicks.
- **Kiwify Webhook** (`mem://integrations/kiwify-webhook-arquitetura`) — Mapeia plano de payload prod/teste para subscriptions.

### 🚀 Features
- **No Results Flow** (`mem://features/fluxo-quiz-sem-resultado`) — Desativar tela auto-submete no último campo.
- **Blog Automation** (`mem://features/automacao-blog-e-seo`) — Auto-publish, JSON-LD, evita últimos 20 posts, 5 estilos.
- **WhatsApp AI Limits** (`mem://features/whatsapp-ai-agente-sistema-e-intervencao`) — Max 2 retries, pausa 30m.
- **Slug Edit Rules** (`mem://features/quiz-edicao-slug`) — Requer `company_slug`, lowercase/numbers/hyphens, unicidade global.
- **Block Personalization** (`mem://features/blocos-logica-e-personalizacao`) — Placeholder `{resposta}` + condicionais.
- **Express AI Lock** (`mem://features/express-ai-mode-lock`) — AIQuizGenerator fixado em `quiz_ia_form`.
- **Mode B Pricing** (`mem://features/site-mode-b-detalhes-arquiteturais`) — `price_monthly_mode_b` + dashboard A/B.
- **ICP Tracking** (`mem://features/icp-tracking`) — 12 métricas em profiles via `icpTracking.ts` (RPCs SECURITY DEFINER).
- **Smart Public Nav** (`mem://features/quiz-publico-navegacao-inteligente`) — Botão Próximo via auto-advance e blocos botão.

### 🎯 Tracking
- **GTM Smart Pixel** (`mem://tracking/arquitetura-gtm-e-pixel-inteligente`) — `first_quiz_created` só após edição manual real.
- **Quiz Publish Events** (`mem://tracking/quiz-publish-events`) — Dedup global via RPC `has_user_fired_event`.

### 🎨 UX / UI
- **PQL & Onboarding** (`mem://ux/jornada-pql-e-fluxo-onboarding-v2`) — 8 estágios; iniciais redirecionam para Express.
- **Icon List Color** (`mem://ui/editor/icon-list-color-logic`) — `iconColor` aplica em texto, não em emojis.

### 💬 Messaging
- **Allowed Hours** (`mem://messaging/janela-horario-disparos`) — Fila respeita `allowed_hours_end`.
- **WhatsApp Blacklist** (`mem://messaging/whatsapp-comunicacao-e-limpeza-dados`) — Blacklist em 'SAIR', unblock manual.
- **Recovery Cooldown** (`mem://messaging/cooldown-period-recovery`) — Cooldown global 1d (fallback 14d).

### 🏪 Marketing
- **Funil Auto-Convencimento** (`mem://marketing/funil-auto-convencimento-e-templates`) — 14 templates seguem 5 etapas.

### 🗄️ Database
- **Vault pg_cron** (`mem://database/vault-secrets-pg-cron`) — `supabase_url` + `supabase_anon_key` no Vault.

### 🔧 CRM
- **Lead Extraction** (`mem://crm/extracao-leads-blocos-texto`) — Regex em textInput vai direto para CRM.

### 🛡️ Admin
- **Support Audit** (`mem://admin/suporte-notificacoes-auditoria-e-relatorios`) — Ações suporte → `audit_logs` + PDF.

### 🔍 Observability / Lifecycle
- **Error Capture Filters** (`mem://observability/error-capture-filters`) — Ignora extensões/HMR/ResizeObserver.
- **Welcome Trigger Unified** (`mem://lifecycle/welcome-trigger-unified`) — 1 trigger único.

### ⚙️ Preferences
- **Output Format** (`mem://preferences/output-format`) — Core Rule #1 absoluta.

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [README.md](../README.md) | Setup, stack e visão geral |
| [CHANGELOG.md](../CHANGELOG.md) | Histórico oficial por versão |
| [KNOWLEDGE.md](./KNOWLEDGE.md) | Resumo executivo (≤9500 chars) |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica + camada de proteções |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema do banco (68 tabelas) |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo (65 funções) |
| [ADR.md](./ADR.md) | Decisões arquiteturais (ADR-001 a ADR-013) |
| [SECURITY.md](./SECURITY.md) | Práticas de segurança + testes contrato P1 |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões + lint rules ativas |
| [PRD.md](./PRD.md) | Product Requirements |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [PENDENCIAS.md](./PENDENCIAS.md) | Backlog e changelog detalhado |

---

## 🔄 Histórico de regeneração deste arquivo

| Versão | Data | Notas |
|--------|------|-------|
| 2.43.0 | 18/04/2026 | Camada de proteções P1-P10 documentada + KNOWLEDGE.md + ADR-013 + Output Format reforçado como #1 absoluta |
| 2.42.0 | 17/04/2026 | Reorganização Core por prioridade + adição de regra de formato obrigatório no topo |
| 2.41.0 | 16/04/2026 | Adicionado ICP Tracking + reorganização painel admin (6 abas) |
| 2.40.0 | 10/04/2026 | Adicionado Modo B + Express AI Mode Lock |
