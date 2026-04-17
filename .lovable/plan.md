# Plano — Página `/compare` (sem depoimentos)

Implementação dividida em **4 etapas seguras**. Cada etapa é independente, testável e não quebra o que já existe.

---

## 🔹 ETAPA 1 — Fundação: dados + helper SEO + i18n  *(esta etapa)*

**Objetivo:** Preparar todo o conteúdo e utilitários sem ainda renderizar nada na tela. Sem risco de regressão visual.

**Arquivos criados/editados:**
1. `src/data/compareContent.ts` — dados estáticos da tabela (18 linhas × 4 colunas) e dos blocos vs InLead
2. `src/lib/structuredData.ts` — helper `buildCompareJsonLd()` (Schema.org `Product` + `Offer`, **sem** aggregateRating/review)
3. `src/i18n/config.ts` — chaves `compare.*` e `landing.header.compare` em PT/EN/ES
4. `src/hooks/useDocumentMeta.ts` — hook simples (title + meta description + JSON-LD via `<script>` no `<head>`)

**Antes vs depois:** Nada visível muda. Apenas ganhamos infraestrutura reutilizável.

**Vantagens:** Conteúdo centralizado e versionado; helper SEO reutilizável; chaves i18n prontas.

**Desvantagens:** Nenhuma — código novo, isolado.

**Checklist manual:** Build OK; nenhuma página existente afetada.

**Pendências:** Nada — etapa autocontida.

---

## 🔹 ETAPA 2 — Página `/compare` + rota + item no header

**Objetivo:** Página visível e navegável.

**Arquivos:**
- `src/pages/Compare.tsx` (novo) — Hero, 3 cards, tabela, vs InLead, CTA final (sem A/B ainda — usa texto i18n direto)
- `src/App.tsx` — rota pública `<Route path="/compare" element={<Compare/>} />`
- `src/components/landing/LandingHeader.tsx` — item "Comparar" entre Preços e Blog

**Checklist:** `/compare` carrega deslogado; header mostra item; mobile com scroll horizontal na tabela; EN/ES sem chaves cruas.

---

## 🔹 ETAPA 3 — A/B test do CTA final

**Objetivo:** Alternar texto do botão CTA final entre "Criar conta grátis" e "Testar 7 dias grátis".

**Arquivos:**
- Migração SQL: insert em `landing_ab_tests` com `target_element='compare_cta_final'`, variantes A/B, 50/50, ativo
- `src/pages/Compare.tsx` — envolver CTA final com `<ABTestTracker>` + `<ABTestVariant>`

**Checklist:** Recarregar `/compare` em janelas anônimas alterna o texto; clique gera linha em `landing_ab_sessions`.

---

## 🔹 ETAPA 4 — Sitemap automático

**Objetivo:** `/compare` listado no sitemap XML.

**Arquivo:** `supabase/functions/blog-sitemap/index.ts` — adicionar entrada estática `/compare` (priority 0.9, weekly).

**Checklist:** GET `/functions/v1/blog-sitemap` retorna XML contendo `<loc>https://masterquiz.lovable.app/compare</loc>`.

---

## ⛔ Fora do escopo (decisão do usuário)

- ❌ TestimonialsCarousel customizado para `/compare`
- ❌ 7 depoimentos no `compareContent.ts`
- ❌ `aggregateRating` e `review` no JSON-LD

---

## Prevenção de regressão

- Etapa 1 não toca em nada renderizado.
- Etapa 2 só adiciona (rota nova + item de menu novo).
- Etapa 3 tem fallback: se A/B test falhar, mostra texto i18n padrão.
- Etapa 4 mantém estrutura existente do sitemap intacta.
