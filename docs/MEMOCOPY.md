# 📝 MEMOCOPY — Backup de Memórias do Projeto

> Cópia completa de todas as memórias persistidas na sessão de desenvolvimento.
> **Versão 2.42.0 | 17 de Abril de 2026**
>
> Este arquivo é regenerado a cada release importante para servir como backup
> caso a memória do projeto seja perdida ou precise ser auditada.

---

## 🧭 Como ler este arquivo

- **Core Rules**: regras aplicadas a TODA ação (sempre em contexto)
- **Memories por Categoria**: detalhes específicos consultados quando relevantes
- **Preferences**: configurações do usuário e do projeto sobre formato de resposta

---

## ⚡ Core Rules (aplicadas a TODA ação)

> Ordem reflete prioridade de consulta na hora de implementar.

1. **Formato de resposta obrigatório**: Sempre responda em linguagem leiga e por etapas seguras. Para cada etapa, informe: 1) o que mudou (antes vs depois), 2) o que melhorou, 3) vantagens e desvantagens, 4) checklist manual de validação, 5) o que ficou pendente agora ou só para o futuro. Se reportado um problema, além de corrigir, diga se vale criar proteção permanente (função, componente, teste ou monitoramento) para evitar regressão. Se houver próximos passos, explique como está hoje, como ficará depois e qual ganho isso traz.
2. **Idioma**: Respostas sempre em PT-BR leigo: antes/depois, checklist, pendências, prevenção de regressão.
3. **Auth**: Use `useCurrentUser` instead of `supabase.auth.getUser()`.
4. **Impersonation**: Use `useEffectiveUser()` to handle context for admin support impersonation.
5. **Network**: Use `fetch` with `keepalive: true` and `apikey` header instead of `navigator.sendBeacon`.
6. **PostgREST**: Batch `.in()` queries up to 150 IDs to avoid URL length limits.
7. **ICP counters**: ICP counters em `profiles` devem usar `src/lib/icpTracking.ts` (RPCs SECURITY DEFINER atômicas), nunca UPDATE direto.
8. **Editor CSS**: Scope `RichTextEditor` CSS with `useId()` (e.g., `.rte-r1`) to prevent style bleeding.
9. **Errors**: Persist detailed DB errors in toasts (not generic messages) to aid debugging.
10. **UI lock**: Text block color customizability is removed for visual consistency; do not re-add.

---

## 📚 Memories por Categoria

### 🏗️ Architecture

#### Infraestrutura de Parsing PDF (`mem://architecture/infra-parsing-pdf`)
A extração de texto de documentos PDF para geração de quizzes é processada pela Edge Function `parse-pdf-document` utilizando `unpdf` no Deno runtime. Limites: max 20MB, 50 páginas.

#### Histórico de Estado e Memória (`mem://architecture/historico-estado-e-memoria`)
O hook `useHistory` implementa um sistema de desfazer/refazer com gerenciamento ativo de memória para evitar degradação. Max 30 estados, limite de 5MB, auto-pruning quando excede.

#### Blog Engine Replicabilidade (`mem://architecture/blog-engine-replicabilidade`)
O sistema de blog utiliza uma arquitetura de 4 camadas: Frontend (React), Banco de Dados (Supabase/PostgreSQL), Lógica de Negócio (Edge Functions Deno), CDN (Bunny CDN), e IA (OpenAI/Gemini).

### 📊 Analytics

#### Webhooks por Campo e Captura Precoce (`mem://analytics/webhooks-por-campo-e-captura-precoce`)
O sistema suporta disparos de webhooks no nível de campos individuais (TextInput, NPS, Slider) antes da conclusão do quiz. `webhookOnSubmit` fires on individual field blur/select for early lead capture.

#### Redefinição de Conclusão do Funil (`mem://analytics/redefinicao-conclusao-funil`)
A métrica de conclusão para quizzes no modo funil foi redefinida: o evento `complete` de analytics é disparado assim que o respondente atinge a última pergunta, não no momento da submissão do formulário.

#### Email Costs Logic e Deduplication (`mem://analytics/email-costs-logic-deduplication`)
O dashboard de custos de email calcula despesas com base em um custo unitário de R$ 0,00469 (R$ 190 para 40.533 emails). Conta apenas envio inicial (`sent_at` not null) para evitar custos duplicados.

### 🔌 Integrations

#### E-goi Recuperação, Templates e IA (`mem://integrations/e-goi-recuperacao-templates-e-ia`)
O sistema de automação de e-mails utiliza pg_cron para disparos automáticos: Blog Digest a cada 10 dias (min 3 posts), Weekly Tip (segunda), Success Story (quinta), Platform News (mensal).

#### E-goi Tracking Transactional (`mem://integrations/e-goi-tracking-transactional`)
O rastreamento de aberturas e cliques para e-mails transacionais (Slingshot V2 da E-goi) exige a inclusão do campo `webhookUrl` no payload para tracking de opens/clicks.

#### Kiwify Webhook Arquitetura (`mem://integrations/kiwify-webhook-arquitetura`)
A Edge Function `kiwify-webhook` suporta payloads de produção (dados aninhados em `order`) e de teste (plano), mapeando nomes de plano para ativar subscriptions (e.g., 'Partner').

### 🚀 Features

#### Fluxo Quiz sem Resultado (`mem://features/fluxo-quiz-sem-resultado`)
O criador do quiz pode desativar a tela de resultados. Quando desativada, o botão de finalizar some e o quiz auto-submete ao responder o último campo.

#### Automação Blog e SEO (`mem://features/automacao-blog-e-seo`)
O sistema de blog gera conteúdo educativo focado no ecossistema de infoprodutos. Auto-publish, SEO JSON-LD, evita últimos 20 posts, 5 estilos visuais rotativos.

#### WhatsApp AI Agente, Sistema e Intervenção (`mem://features/whatsapp-ai-agente-sistema-e-intervencao`)
O agente de IA do WhatsApp (gpt-4o-mini) possui limite de 2 tentativas consecutivas (`max_agent_retries`). Pausa 30 minutos em intervenção humana.

#### Quiz Edição de Slug (`mem://features/quiz-edicao-slug`)
Usuários podem editar slug dos quizzes. Requer `company_slug` configurado, lowercase/numbers/hyphens only, verificação de unicidade global.

#### Blocos Lógica e Personalização (`mem://features/blocos-logica-e-personalizacao`)
Os blocos lógicos (`conditionalText`, `personalizedCTA`, `comparisonResult`) e dinâmicos (`answerSummary`, `progressMessage`) suportam placeholder `{resposta}` e lógica condicional dinâmica.

#### Express AI Mode Lock (`mem://features/express-ai-mode-lock`)
No fluxo Express, o AIQuizGenerator abre automaticamente fixado no modo `quiz_ia_form`. Usuário não pode trocar para PDF/educacional.

#### Site Mode B — Detalhes Arquiteturais (`mem://features/site-mode-b-detalhes-arquiteturais`)
O 'Modo B' (Apenas Pago) suporta precificação independente via `price_monthly_mode_b` e inclui dashboard de Comparação A×B com métricas históricas.

#### ICP Tracking System (`mem://features/icp-tracking`)
12 métricas em `profiles` para identificar ICP pagante antes do checkout. Etapas 1 + 2 concluídas (M02/04/05/06/07/08/11). Helper `icpTracking.ts` com RPCs atômicas SECURITY DEFINER.

#### Quiz Público Navegação Inteligente (`mem://features/quiz-publico-navegacao-inteligente`)
A navegação no quiz público é integrada ao renderizador de blocos de pergunta (`QuestionBlockRenderer`). Botão "próximo" visível conforme lógica de auto-advance e blocos de botão.

### 🎯 Tracking

#### Arquitetura GTM e Pixel Inteligente (`mem://tracking/arquitetura-gtm-e-pixel-inteligente`)
A estratégia de rastreamento distingue fluxo automático de intenção real. O evento `first_quiz_created` só dispara após edição manual (não template automático). Segmenta por objetivos.

### 🎨 UX / UI

#### Jornada PQL e Fluxo Onboarding v2 (`mem://ux/jornada-pql-e-fluxo-onboarding-v2`)
O sistema utiliza PQL de 8 estágios discretos (Explorador, Iniciado, Engajado, Construtor, Operador, Potencial Pagante, Ativado, Inativo). Estágios iniciais redirecionam para fluxo Express.

#### Icon List Color Logic (`mem://ui/editor/icon-list-color-logic`)
No bloco IconList, a propriedade `iconColor` é aplicada à tipografia dos itens, não ao ícone (emojis são imutáveis).

### 💬 Messaging

#### Janela de Horário de Disparos (`mem://messaging/janela-horario-disparos`)
O processamento automático da fila de recuperação respeita `allowed_hours_end` configurado na tabela `recovery_settings`.

#### WhatsApp Comunicação e Limpeza de Dados (`mem://messaging/whatsapp-comunicacao-e-limpeza-dados`)
O sistema garante idempotência via UNIQUE em `recovery_contacts`. Auto-blacklist ao receber 'SAIR'. Desbloqueio apenas manual.

#### Recovery Cooldown Period (`mem://messaging/cooldown-period-recovery`)
Cooldown global de 1 dia (fallback 14 dias) configurado em `recovery_settings` para evitar excesso de emails.

### 🏪 Marketing

#### Funil de Auto-Convencimento e Templates (`mem://marketing/funil-auto-convencimento-e-templates`)
Toda geração de conteúdo por IA e os 14 templates (9 base, 5 premium) seguem funil psicológico de 5 etapas: Espelhamento → Amplificação → Consequência → Solução → Ação.

### 🗄️ Database

#### Vault Secrets e PG Cron (`mem://database/vault-secrets-pg-cron`)
As tarefas via `pg_cron` dependem de secrets no Vault: `supabase_url` e `supabase_anon_key` devem existir para pg_net HTTP triggers.

### 🔧 CRM

#### Extração de Leads em Blocos de Texto (`mem://crm/extracao-leads-blocos-texto`)
O sistema realiza extração inteligente (`extractContactFromAnswers`) via regex de email/telefone em blocos `textInput`, populando CRM automaticamente.

### 🛡️ Admin

#### Suporte, Notificações, Auditoria e Relatórios (`mem://admin/suporte-notificacoes-auditoria-e-relatorios`)
Toda ação em Modo Suporte é registrada em `audit_logs` (prefixo 'support:') e gera notificações ao usuário afetado. Relatórios PDF com branding MasterQuiz.

### ⚙️ Preferences

#### Output Format Rules (`mem://preferences/output-format`)
Toda resposta deve seguir estrutura leiga com antes/depois, melhorias, vantagens/desvantagens, checklist, pendências e prevenção de regressão.

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [README.md](../README.md) | Setup, stack e visão geral |
| [CHANGELOG.md](../CHANGELOG.md) | Histórico oficial por versão |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema do banco (68 tabelas) |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo (64 funções) |
| [ADR.md](./ADR.md) | Decisões arquiteturais |
| [CODE_STANDARDS.md](./CODE_STANDARDS.md) | Padrões de código |
| [PRD.md](./PRD.md) | Product Requirements |
| [ROADMAP.md](./ROADMAP.md) | Planejamento estratégico |
| [PENDENCIAS.md](./PENDENCIAS.md) | Backlog e changelog detalhado |

---

## 🔄 Histórico de regeneração deste arquivo

| Versão | Data | Notas |
|--------|------|-------|
| 2.42.0 | 17/04/2026 | Reorganização Core por prioridade + adição de regra de formato obrigatório no topo |
| 2.41.0 | 16/04/2026 | Adicionado ICP Tracking + reorganização painel admin (6 abas) |
| 2.40.0 | 10/04/2026 | Adicionado Modo B + Express AI Mode Lock |
