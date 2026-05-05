# 📘 KNOWLEDGE — MasterQuiz (Resumo Executivo para Knowledge Base)

> Versão 2.44.0 | 5 de Maio de 2026
> Documento compacto (≤9500 chars) destinado ao campo "Knowledge" do projeto Lovable.
> Fonte de verdade canônica para qualquer agente IA atuando no codebase.

---

## 1) Produto
MasterQuiz — plataforma full-stack para criar **quizzes interativos de auto-convencimento** (não pesquisa neutra). Editor visual por blocos (34 tipos), qualifica leads, CRM kanban, analytics, email marketing (E-goi), WhatsApp recovery (Evolution API), monetização Modo A/B. Público-alvo: infoprodutores BR.

## 2) Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Framer Motion + React Router + TanStack Query + i18next (PT/EN/ES).
- **Backend:** Supabase externo (PostgreSQL + RLS + 65 Edge Functions Deno + Auth + Storage).
- **Integrações:** Kiwify (pagamento), GTM (`pushGTMEvent` centralizado), Facebook Pixel (por quiz), Gemini/OpenAI (IA), Evolution API (WhatsApp), E-goi Bulk API (email), Bunny CDN (vídeo).

## 3) Personas e Roles
visitor/respondent (público), user (cliente), admin, master_admin. Permissões via tabela `user_roles` + `has_role()` SECURITY DEFINER (jamais armazenar role em `profiles`).

## 4) Painel Admin — 6 abas (max 2 níveis de profundidade)
🏠 Início · 👥 Usuários (Gestão+PQL+Growth+Suporte) · 📝 Conteúdo (Quizzes+Leads+Blog+Templates+GTM) · 💰 Vendas · ⚙️ Sistema (Saúde+Observabilidade+DB+Configs+GTM Diag) · 🛠️ Dev Tools

## 5) Database — 68 tabelas (RLS em TODAS)
Core quiz: `quizzes`, `quiz_questions`, `quiz_results`, `quiz_responses`, `quiz_form_config`, `quiz_templates`, `quiz_tags`. Usuários: `profiles`, `user_subscriptions`, `user_roles`, `user_integrations`. Analytics: `quiz_analytics`, `quiz_step_analytics`, `quiz_cta_click_analytics`. GTM: `gtm_event_logs`, `gtm_event_integrations`. Admin: `audit_logs`, `admin_notifications`, `support_tickets`. Recovery WhatsApp: `recovery_*`. Email: `email_recovery_*`, `email_automation_*`. Blog: `blog_posts`, `blog_settings`. Vídeo: `bunny_videos`. A/B: `ab_test_sessions`, `landing_ab_tests`. i18n: `quiz_translations`. WhatsApp AI: `whatsapp_ai_*`.

## 6) Edge Functions — 64
Core(4), Pagamento/Usuários(10), Analytics(5), Integrações(2), Bunny CDN(8), WhatsApp(9), Email(11), Blog(4), Admin(6), Growth(3), Utils(2). Todas validam auth + corsHeaders + retornam JSON padronizado.

## 7) Convenções OBRIGATÓRIAS
1. **GTM:** SEMPRE `pushGTMEvent()` de `@/lib/gtmLogger` — NUNCA `window.dataLayer.push` direto (ADR-010).
2. **Auth:** SEMPRE `useCurrentUser()` em componentes — NUNCA `supabase.auth.getUser()` direto.
3. **Impersonação:** `useEffectiveUser()` em telas que suportam Modo Suporte.
4. **Network:** `fetch` com `keepalive:true` + header `apikey` — NUNCA `navigator.sendBeacon`.
5. **PostgREST:** batch `.in()` ≤150 IDs (URL length).
6. **ICP counters:** SEMPRE via RPCs SECURITY DEFINER em `src/lib/icpTracking.ts` — NUNCA UPDATE direto em `profiles`.
7. **Logger:** `@/lib/logger` — NUNCA `console.log`.
8. **Tokens:** apenas tokens HSL semânticos do design system (`bg-background`, `text-foreground`) — NUNCA cores hardcoded (`bg-white`, `bg-[#xyz]`).
9. **Roles:** verificação via `has_role()` server-side ou `useUserRole` hook — NUNCA via localStorage.
10. **Persistência de quiz:** ao adicionar evento de publicação em `useQuizPersistence.ts`, OBRIGATÓRIO incluir `creation_source`/`publish_source`/`editor_mode`, validar dedup via RPC `has_user_fired_event` e persistir com `{ persist: true }`.
11. **`is_icp_profile` imutável:** gravar com filtro `.is('is_icp_profile', null)` (ADR-014).
12. **Email ativação 24h:** `check-activation-24h` envia email + WhatsApp em blocos independentes (cron 4h), filtrando `institutional_email_domains` (ADR-015).

## 8) 🛡️ 10 Proteções automáticas ativas (P1–P10) — falham build/test
- **P1** Contract `user-roles-security.test.ts` — bloqueia INSERT direto em `user_roles` + admin via localStorage.
- **P2** Lint — proíbe `window.dataLayer.push`.
- **P3** Lint — proíbe UPDATE direto em colunas ICP de `profiles`.
- **P4** Lint warning — `supabase.auth.getUser()` direto.
- **P5** Lint — proíbe `navigator.sendBeacon`.
- **P6** Smoke test — batch PostgREST `.in()` ≤150 IDs.
- **P7** Lint warning — cores hardcoded.
- **P8** Contract `blocks-catalog.test.ts` — `BlockType` ↔ catálogo ↔ renderer.
- **P9** Comentários-trava em `useQuizPersistence.ts` para novos eventos de publicação.
- **P10** Smoke `gtm-persistence.test.ts` — garante persistência via `pushGTMEvent`.

## 9) 📐 Arquitetura — padrões críticos
- **Thin Router Pattern** (ADR-001): `CreateQuiz.tsx` zero hooks pesados, apenas `React.lazy` + `Suspense`.
- **State management:** server state via TanStack Query; auth via `AuthContext`; URL state via React Router; form via `react-hook-form + zod`.
- **Service layer:** lógica admin pesada em `src/services/*` (ex.: `observabilityService`, `gtmDiagnosticService`).
- **i18n:** zero strings UI hardcoded. Chaves em `src/i18n/locales/{pt,en,es}.json`.

## 10) RLS — padrões obrigatórios
- Dados do usuário: `USING (auth.uid() = user_id)`.
- Admin: `USING (public.has_role(auth.uid(), 'admin'))` via SECURITY DEFINER (nunca subquery recursiva).
- INSERT anônimo (analytics/responses): `WITH CHECK (true)` em policy `TO anon`.
- Roles SEMPRE em tabela separada (`user_roles`).

## 11) Eventos GTM críticos (dedup global obrigatório)
`first_quiz_created` (só após edição manual real), `quiz_published`, `quiz_first_publishedB`, `quiz_real_published` — todos via RPC `has_user_fired_event` para garantir disparo único por usuário.

## 12) Pagamentos
Apenas Kiwify (ADR-002). Webhook `kiwify-webhook` aceita payload de produção (`order` aninhado) e teste, mapeando nomes de plano para `user_subscriptions`.

## 13) Tracking de regressão (warnings com baseline)
- ~30 ocorrências legadas de `supabase.auth.getUser()` (P4) — meta: decrescer.
- ~120 ocorrências legadas de cores hardcoded (P7) — meta: decrescer.
- ~105 arquivos com `console.log` — meta: substituir por logger.

## 14) 🗣️ FORMATO DE RESPOSTA OBRIGATÓRIO (Core Rule #1 absoluta)
TODA resposta deve seguir esta estrutura, em PT-BR leigo, por etapas seguras:
1. **O que mudou** — antes vs depois (concreto)
2. **O que melhorou** — ganho real para o usuário/negócio
3. **Vantagens e desvantagens**
4. **Checklist manual de validação** (passos clicáveis)
5. **Pendências** — agora ou só futuro
6. **Prevenção de regressão** — se vale criar função/teste/monitoramento permanente
7. **Próximos passos** — como está hoje vs como ficará, qual ganho

Quando reportado problema: além de corrigir, sempre avaliar proteção permanente.

## 15) Documentação detalhada
| Arquivo | Conteúdo |
|---------|----------|
| `README.md` | Setup + comandos |
| `CHANGELOG.md` | Histórico oficial por versão |
| `docs/SYSTEM_DESIGN.md` | Arquitetura + 🛡️ camada de proteções |
| `docs/DATABASE_SCHEMA.md` | 68 tabelas + RLS |
| `docs/EDGE_FUNCTIONS.md` | 65 funções catalogadas |
| `docs/SECURITY.md` | RLS + testes de contrato P1 |
| `docs/CODE_STANDARDS.md` | Padrões + lint rules ativas |
| `docs/ADR.md` | Decisões arquiteturais (ADR-001 a ADR-013) |
| `docs/PENDENCIAS.md` | Backlog + changelog detalhado |
| `docs/MEMOCOPY.md` | Snapshot de memórias |
| `docs/PRD.md` | Requisitos de produto |
| `docs/ROADMAP.md` | Planejamento estratégico |

## 16) Ferramentas de validação
- `npm run test` — Vitest (inclui contract tests P1/P6/P8/P10)
- `npm run lint` — ESLint (inclui regras P2/P3/P4/P5/P7)
- `node scripts/validate-docs.cjs` — valida contagens de Edge Functions e tabelas vs documentação

---

> Em caso de conflito entre este KNOWLEDGE e qualquer outro doc, **este vence** (até próxima atualização).
