# 📜 CHANGELOG — MasterQuiz

> Todas as mudanças notáveis deste projeto serão documentadas aqui.
>
> Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
> e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [2.43.0] — 2026-04-18

### ✨ Adicionado
- **Camada de proteções automáticas (P1–P10)** contra regressão, dividida em 3 fases:
  - **P1** — Contract test `src/__tests__/contracts/user-roles-security.test.ts` bloqueia INSERT direto em `user_roles` e check de admin via localStorage.
  - **P2** — ESLint rule bloqueia `window.dataLayer.push` direto (forçar `pushGTMEvent` de `@/lib/gtmLogger`) — ADR-010.
  - **P3** — ESLint rule bloqueia UPDATE direto em colunas ICP de `profiles` (forçar RPCs de `src/lib/icpTracking.ts`).
  - **P4** — ESLint warning para `supabase.auth.getUser()` direto (preferir `useCurrentUser`).
  - **P5** — ESLint rule bloqueia `navigator.sendBeacon` (usar `fetch` com `keepalive:true`).
  - **P6** — Smoke test de batch PostgREST `.in()` ≤150 IDs.
  - **P7** — ESLint warning para cores hardcoded fora dos tokens HSL semânticos.
  - **P8** — Contract test `blocks-catalog.test.ts` valida que todo `BlockType` tem entrada no `blockPaletteCatalog` e renderer no `BlockEditor`.
  - **P9** — Comentários-trava em `useQuizPersistence.ts` exigindo `creation_source`/`publish_source`/`editor_mode` + dedup global via RPC `has_user_fired_event` em qualquer novo evento de publicação.
  - **P10** — Smoke test `gtm-persistence.test.ts` garante que `pushGTMEvent` persiste em `gtm_event_logs` (ADR-010) respeitando override `{ persist: false }`.
- **`docs/KNOWLEDGE.md`** — resumo executivo do projeto (≤9500 caracteres) pronto para colar no campo Knowledge do Lovable.
- **ADR-013** em `docs/ADR.md` — "Proteções de regressão como código" (decisão, alternativas, consequências).

### 🔄 Alterado
- **`docs/MEMOCOPY.md`** regenerado como snapshot v2.43.0 com bloco "Proteções automáticas P1–P10".
- **`docs/SECURITY.md`** ganhou seção "🧪 Testes de contrato de segurança" referenciando P1.
- **`docs/CODE_STANDARDS.md`** ganhou seção "🚨 Lint rules ativas (regressão zero)" listando P2/P3/P4/P5/P7.
- **`docs/SYSTEM_DESIGN.md`** ganhou seção "🛡️ Camada de proteções automáticas".
- **Memória do projeto** reordenada: regra de formato de resposta agora é Core Rule #1 absoluta.

### 📝 Documentação
- README/PRD/ROADMAP/PENDENCIAS/EDGE_FUNCTIONS/DATABASE_SCHEMA/ONBOARDING — bump para v2.43.0.

---

## [2.42.0] — 2026-04-17

### ✨ Adicionado
- **Página `/compare`** pública com hero, 3 cards de proposta de valor, tabela comparativa (18 linhas × 4 colunas) e seção MasterQuiz vs InLead.
- **A/B test** no CTA final da página `/compare` ("Criar conta grátis" vs "Testar 7 dias grátis") via tabela `landing_ab_tests` com `target_element='compare_cta_final'`.
- **JSON-LD Schema.org** (`Product` + `Offer`) injetado no `<head>` da página `/compare` para SEO estruturado.
- **Helper `buildCompareJsonLd()`** em `src/lib/structuredData.ts` reutilizável.
- **Hook `useDocumentMeta`** em `src/hooks/useDocumentMeta.ts` para gerenciar `<title>`, `<meta description>` e injeção de JSON-LD.
- **Dados estáticos** centralizados em `src/data/compareContent.ts` (tabela e blocos vs InLead).
- **Item de menu "Comparar"** no `LandingHeader` entre "Preços" e "Blog".
- **Chaves i18n** `compare.*` e `landing.header.compare` em PT/EN/ES.
- **Entrada `/compare`** no sitemap automático (`supabase/functions/blog-sitemap/index.ts`) com priority 0.9 e changefreq monthly.

### 📝 Documentação
- Criado `CHANGELOG.md` na raiz seguindo padrão Keep a Changelog.
- `docs/MEMOCOPY.md` atualizado com snapshot v2.42.0 da memória do projeto.

---

## [2.41.0] — 2026-04-15

### ✨ Adicionado
- **Sistema ICP Tracking** (Etapas 1 + 2): 12 métricas em `profiles` para identificar perfil pagante antes do checkout (M02, M04, M05, M06, M07, M08, M11).
- **Helper `src/lib/icpTracking.ts`** com RPCs SECURITY DEFINER atômicas para incrementar contadores (nunca UPDATE direto).
- **Script `scripts/validate-docs.cjs`** (v2.41.0) — valida contagens reais de edge functions e tabelas vs documentação.

### 🔄 Alterado
- Reorganização do painel Admin para **6 abas** (Início, Usuários, Conteúdo, Vendas, Sistema, Dev Tools) com no máximo 2 níveis de profundidade.

---

## [2.40.0] — 2026-04-10

### ✨ Adicionado
- **Modo B (Apenas Pago)** com precificação independente via `price_monthly_mode_b`.
- **Dashboard A×B** com métricas históricas comparativas.
- **Express AI Mode Lock** — `AIQuizGenerator` abre fixado em `quiz_ia_form` no fluxo Express.

---

## [2.30.0] — 2026-03-20

### ✨ Adicionado
- **Sistema Email Recovery** completo via E-goi Bulk API com tracking transacional (Slingshot V2).
- **Cooldown global** de 1 dia (fallback 14d) em `recovery_settings` para evitar excesso de emails.
- **Auto-blacklist** WhatsApp ao receber 'SAIR'.

### 🔄 Alterado
- Métrica de conclusão do funil redefinida: evento `complete` dispara ao alcançar última pergunta, não no submit.

---

## [2.20.0] — 2026-02-28

### ✨ Adicionado
- **Blog Engine** automatizado: 4 camadas (React + Supabase/Deno + Bunny CDN + OpenAI/Gemini).
- **5 estilos visuais** rotativos para imagens de capa.
- **JSON-LD SEO** automático em todos os posts.

---

## [2.10.0] — 2026-02-01

### ✨ Adicionado
- **WhatsApp AI Agent** (gpt-4o-mini) com max 2 retries e pausa 30min em intervenção humana.
- **Evolution API** para integração WhatsApp Business.

---

## [2.00.0] — 2026-01-15

### ✨ Adicionado
- **34 tipos de blocos** no editor visual.
- **PQL de 8 estágios** (Explorador → Inativo) com redirecionamento Express para iniciantes.
- **Funil psicológico de 5 etapas** em todos os 14 templates (9 base + 5 premium).

---

## [1.x.x] — Histórico anterior

Versões anteriores documentadas em `docs/PENDENCIAS.md`.

---

## Tipos de mudança

- `✨ Adicionado` — novas funcionalidades
- `🔄 Alterado` — mudanças em funcionalidades existentes
- `🗑️ Removido` — funcionalidades removidas
- `🐛 Corrigido` — correções de bugs
- `🔒 Segurança` — correções de segurança
- `📝 Documentação` — apenas mudanças em docs
- `⚡ Performance` — melhorias de performance
- `♻️ Refatoração` — mudanças internas sem alterar comportamento

## Como atualizar

A cada nova versão lançada:
1. Adicionar nova seção `## [X.Y.Z] — YYYY-MM-DD` no topo
2. Categorizar mudanças usando os tipos acima
3. Atualizar versão em `docs/MEMOCOPY.md` e cabeçalhos dos docs principais
4. Rodar `node scripts/validate-docs.cjs` para garantir consistência
