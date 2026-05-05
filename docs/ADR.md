# 📋 ADR — Architecture Decision Records

> Registro de decisões arquiteturais do MasterQuiz
> Versão 2.44.0 | 5 de Maio de 2026

---

## ADR-001: Thin Router Pattern para Editor de Quiz

**Data:** Janeiro 2026  
**Status:** Aceito  
**Contexto:** O editor de quiz tem duas variantes (Classic e Modern) com hooks pesados. Colocar ambos no mesmo componente causava freeze por hooks duplicados.  
**Decisão:** `CreateQuiz.tsx` é um thin router — zero hooks pesados, apenas `React.lazy` + `Suspense` para carregar a variante escolhida.  
**Alternativas rejeitadas:** (1) Conditional rendering no mesmo arquivo — causava re-renders; (2) Feature flag com import estático — bundle gigante.  
**Consequências:** Bundle splitting eficiente, zero freezes, mas exige que toda lógica fique dentro de cada variante.

---

## ADR-002: Kiwify como Gateway de Pagamento (sem Stripe)

**Data:** Janeiro 2025  
**Status:** Aceito  
**Contexto:** Mercado brasileiro, público de infoprodutores. Stripe exige conta internacional e tem fees maiores para BRL.  
**Decisão:** Usar Kiwify exclusivamente, processando pagamentos via webhook (`kiwify-webhook`).  
**Alternativas rejeitadas:** Stripe (fees altos, complexidade de setup para público BR), Hotmart (API limitada).  
**Consequências:** Simplicidade para o público-alvo, mas lock-in no ecossistema Kiwify.

---

## ADR-003: E-goi Bulk API para Email Marketing

**Data:** Março 2026  
**Status:** Aceito  
**Contexto:** Precisávamos enviar emails em massa (recovery, automações) sem ultrapassar limites de API.  
**Decisão:** E-goi Slingshot API (transacional) com Bulk API em lotes de 100 emails.  
**Alternativas rejeitadas:** SendGrid (caro para volume BR), Amazon SES (setup complexo), Mailgun (sem suporte BR nativo).  
**Consequências:** Custo baixo (R$190/40.533 emails = R$0,00469/email), mas dependência de um provedor menos conhecido.

---

## ADR-004: Evolution API para WhatsApp Recovery

**Data:** Maio 2025  
**Status:** Aceito  
**Contexto:** Recuperação de usuários inativos via WhatsApp é mais efetiva que email no Brasil.  
**Decisão:** Evolution API (self-hosted) para envio de mensagens WhatsApp automatizadas.  
**Alternativas rejeitadas:** WhatsApp Business API oficial (caro, burocrático), Twilio (custo alto por mensagem).  
**Consequências:** Custo zero por mensagem, mas risco de bloqueio por spam e necessidade de manutenção do servidor.

---

## ADR-005: jsPDF Client-Side para Relatórios PDF

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Relatórios de sessão de suporte precisam de PDF com branding.  
**Decisão:** Gerar PDF no client com `jspdf` + `jspdf-autotable` ao invés de Edge Function.  
**Alternativas rejeitadas:** (1) Edge Function com puppeteer — timeout de 60s; (2) html2pdf — qualidade inconsistente.  
**Consequências:** Geração instantânea, sem custo de servidor, mas limitações de layout (sem CSS flexbox).

---

## ADR-006: has_role() SECURITY DEFINER para RLS

**Data:** 2024  
**Status:** Aceito  
**Contexto:** Verificar roles via subquery em RLS policies causa recursão infinita (tabela user_roles também tem RLS).  
**Decisão:** Função `has_role()` com `SECURITY DEFINER` executa com privilégios do owner, bypassando RLS.  
**Alternativas rejeitadas:** (1) Roles em profiles — privilege escalation; (2) Custom claims no JWT — complexo de manter.  
**Consequências:** Zero recursão, performance excelente, mas exige cuidado para não expor a função.

---

## ADR-007: Modo Suporte com Impersonação Frontend

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Admins precisam diagnosticar problemas no contexto do usuário sem acessar sua conta.  
**Decisão:** `SupportModeContext` altera o `user_id` usado nas queries frontend. Dados reais acessados via `admin-view-user-data` (Edge Function com service_role).  
**Alternativas rejeitadas:** (1) Login como usuário — inseguro, viola audit trail; (2) Panel separado — UX ruim, sem contexto real.  
**Consequências:** Audit trail completo, sem troca de credenciais, mas requer cuidado para não salvar dados errados.

---

## ADR-008: 34 Tipos de Blocos no Editor

**Data:** Março 2026  
**Status:** Aceito  
**Contexto:** Quizzes precisam de mais do que perguntas — elementos visuais, dinâmicos e interativos.  
**Decisão:** Sistema extensível de blocos com tipos declarados em `src/types/blocks.ts`, cada um com createBlock, normalizeBlock, e componentes de editor/preview.  
**Alternativas rejeitadas:** (1) Rich text editor genérico (TipTap) — muito genérico para quiz; (2) Plugins externos — difícil de manter.  
**Consequências:** Flexibilidade máxima, mas cada novo bloco exige 5-7 arquivos (tipo, editor, preview, palette, properties).

---

## ADR-009: Notificações via Polling (não Realtime)

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Admin_notifications precisam chegar ao usuário, mas a frequência é baixa (1-2 por sessão de suporte).  
**Decisão:** Polling a cada 60s via `NotificationBell` ao invés de Supabase Realtime.  
**Alternativas rejeitadas:** Supabase Realtime — overhead de conexão WebSocket para notificações raras.  
**Consequências:** Simplicidade, mas delay de até 60s na entrega. Aceitável dado o caso de uso.

---

## ADR-010: Centralização GTM via pushGTMEvent

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Eventos GTM estavam espalhados entre `dataLayer.push` direto, hooks dedicados e chamadas inconsistentes. Manutenção era difícil e eventos não eram persistidos.  
**Decisão:** Centralizar todos os eventos via `pushGTMEvent()` de `lib/gtmLogger.ts`, que faz push no dataLayer E persiste em `gtm_event_logs`. Tabela `gtm_event_integrations` controla quais eventos estão mapeados no GTM real.  
**Alternativas rejeitadas:** (1) GTM server-side — complexidade de infra; (2) Segment/Amplitude — custo mensal alto para o estágio atual.  
**Consequências:** Fonte única de verdade para todos os eventos, dashboard de observabilidade funcional, mas exige disciplina para nunca usar `dataLayer.push` diretamente.

---

## ADR-011: Growth Dashboard com Edge Function Dedicada

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Métricas de crescimento (ICP, paywall, conversão) exigem queries pesadas com JOINs complexos.  
**Decisão:** Edge Function `growth-metrics` centraliza cálculos pesados no servidor, retornando dados pré-processados para o dashboard.  
**Alternativas rejeitadas:** (1) Queries diretas no frontend — timeout em tabelas grandes; (2) Materialized views — custo de manutenção no Supabase.  
**Consequências:** Dashboard rápido, sem carga no cliente, mas requer manutenção da EF quando métricas mudam.

---

## ADR-012: Sistema de Trials com trial_logs

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** Período de trial precisava ser rastreável para análise de conversão.  
**Decisão:** Tabela `trial_logs` registra início, expiração e status de trials. EF `check-expired-trials` roda via cron para expirar trials vencidos.  
**Alternativas rejeitadas:** (1) Flag boolean em user_subscriptions — sem histórico; (2) Trigger automático — sem controle de edge cases.  
**Consequências:** Histórico completo de trials, análise de conversão por cohort, mas exige cron job ativo.

---

## ADR-013: Reorganização do Admin por Domínio Funcional

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** O painel admin tinha 7 abas genéricas sem agrupamento lógico. Funcionalidades relacionadas (ex: usuários e PQL) ficavam em abas separadas, dificultando a navegação.  
**Decisão:** Reorganizar em 6 domínios funcionais (Início, Usuários, Conteúdo, Vendas, Sistema, Dev Tools) com max 2 níveis de profundidade (aba → sub-aba via `AdminSubTabs`).  
**Alternativas rejeitadas:** (1) Sidebar lateral — ocupa espaço permanente; (2) Mega menu — complexidade de implementação sem ganho real; (3) Manter 7+ abas — escala mal conforme features crescem.  
**Consequências:** Navegação previsível, agrupamento por contexto, mas requer refatoração de imports e lazy loading para cada sub-aba.

---

## ADR-014: Catálogos Hardcoded no DatabaseMonitorTab

**Data:** Abril 2026  
**Status:** Aceito  
**Contexto:** O cliente Supabase (PostgREST) não permite acesso a `information_schema` ou `pg_catalog` para listar tabelas, triggers e cron jobs. Criar RPCs para cada catálogo seria over-engineering.  
**Decisão:** Manter catálogos de tabelas (68), triggers (13), cron jobs (15) e Edge Functions (65) como arrays hardcoded no componente. Tamanhos reais obtidos via RPC `get_table_sizes()` (SECURITY DEFINER).  
**Alternativas rejeitadas:** (1) RPCs para cada catálogo — manutenção alta para dados raramente alterados; (2) Edge Function de introspection — overhead para dados estáticos; (3) Dump do schema — complexo e frágil.  
**Consequências:** Zero overhead de queries, dados sempre consistentes com o schema real, mas exige atualização manual do catálogo quando tabelas/triggers mudam.

---

## ADR-015: Página `/compare` Estática para SEO + Ads

**Data:** Abril 2026 (v2.42.0)  
**Status:** Aceito  
**Contexto:** Usuários pesquisam por "MasterQuiz vs InLead" e variantes. Precisamos de uma página comparativa otimizada para SEO orgânico e como landing para campanhas pagas (Google Ads), sem dependência do CMS de blog.  
**Decisão:** Criar `/compare` como página React estática, com conteúdo hardcoded em `src/data/compareContent.ts` (tabela 18×4 + blocos vs InLead), JSON-LD Schema.org `Product`+`Offer` injetado via hook `useDocumentMeta`, e entrada no sitemap dinâmico (`blog-sitemap` Edge Function).  
**Alternativas rejeitadas:** (1) Post de blog comum — perde flexibilidade de layout (tabela complexa) e dilui autoridade do domínio em comparações; (2) CMS dedicado para landings — over-engineering para 1 página; (3) Página em landing externa (Unbounce/etc) — perde integração com auth/i18n e adiciona custo recorrente.  
**Consequências:** Controle total sobre layout/SEO, atualização via deploy (versionado em git), JSON-LD reutilizável via `buildCompareJsonLd()`, mas conteúdo da tabela exige PR para mudanças (não editável pelo admin).

---

## ADR-016: A/B Test no CTA da `/compare` via `landing_ab_tests`

**Data:** Abril 2026 (v2.42.0)  
**Status:** Aceito  
**Contexto:** O CTA final da página `/compare` é o ponto de conversão crítico. Precisamos validar empiricamente qual texto gera mais cliques: "Criar conta grátis" (foco no preço) vs "Testar 7 dias grátis" (foco no risco zero).  
**Decisão:** Reutilizar a infraestrutura existente de A/B test (`landing_ab_tests` + componentes `<ABTestTracker>`/`<ABTestVariant>`) com `target_element='compare_cta_final'`, traffic_split 50/50, conversion_type `signup`. Sessões registradas em `landing_ab_sessions` (UPDATE restrito a 24h via RLS).  
**Alternativas rejeitadas:** (1) Google Optimize — descontinuado; (2) PostHog Experiments — adiciona dependência externa para 1 teste; (3) A/B server-side via Edge Function — overhead desnecessário (decisão é puramente visual); (4) Hardcoded fallback sem teste — perde aprendizado contínuo.  
**Consequências:** Aproveitamento da infra existente (zero código novo de A/B), métricas no mesmo dashboard de outros testes de landing, fallback gracioso para texto i18n se a tabela estiver desativada, mas exige migração SQL para criar/desativar testes (não há UI admin ainda — ver pendências).

---

## ADR-013: Proteções de regressão como código (Lint + Contract Tests + Comentários-trava)

**Data:** Abril 2026 (v2.44.0)
**Status:** Aceito
**Contexto:** Após sucessivas regressões em áreas críticas (privilege escalation por INSERT direto em `user_roles`, eventos GTM duplicados por `dataLayer.push` direto, UPDATEs incorretos em colunas ICP, perda de eventos por `sendBeacon` cancelado, blocos novos sem renderer, eventos de publicação sem dedup), revisão manual mostrou-se insuficiente. Toda regressão tinha um padrão sintático identificável que poderia ser detectado automaticamente.
**Decisão:** Criar 10 proteções (P1–P10) divididas em três mecanismos:
1. **Contract tests** (Vitest + `import.meta.glob`) — varrem o codebase em build-time procurando padrões proibidos (P1, P6, P8, P10).
2. **ESLint rules** (`no-restricted-syntax` customizadas) — bloqueiam padrões sintáticos diretamente no editor e no CI (P2, P3, P4, P5, P7).
3. **Comentários-trava** em pontos sensíveis do código (`useQuizPersistence.ts`) listando requisitos obrigatórios para qualquer modificação (P9).
**Alternativas rejeitadas:**
- *Revisão manual / treinamento* — falhou na prática; novo dev sempre repete o mesmo erro.
- *Code review humano* — gargalo, não escala, depende de quem revisa.
- *Husky pre-commit hooks* — fáceis de pular com `--no-verify`; preferimos falhar no CI.
- *Sentry/observabilidade pós-deploy* — detecta tarde demais, com usuários afetados.
**Consequências:**
- ✅ Build/test falha antes do merge se qualquer regra quebrar.
- ✅ Documentação executável (a regra É o teste).
- ✅ Allowlists explícitas (P1) forçam justificativa em `SECURITY.md`.
- ⚠️ Custo de manutenção: cada nova proteção exige PR, baseline e doc.
- ⚠️ Warnings (P4/P7) acumulam dívida — controlados via baselines decrescentes em `PENDENCIAS.md`.

---


## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Contexto técnico das decisões |
| [SECURITY.md](./SECURITY.md) | ADR-006 detalhado |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões derivados das ADRs |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema referenciado (68 tabelas) |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo das 65 Edge Functions |
| [SERVICES.md](./SERVICES.md) | Catálogo de services |
