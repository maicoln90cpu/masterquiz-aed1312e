# 🔌 API Docs - Edge Functions (65 funções)

> MasterQuiz — Documentação das Edge Functions (Supabase/Deno)
> Versão 2.42.0 | 17 de Abril de 2026

> **Novidades v2.42.0:** A função `blog-sitemap` agora inclui `/compare` no XML retornado (priority 0.9, weekly). Nenhuma EF nova foi criada — a página `/compare` é totalmente client-side e usa apenas o hook `useDocumentMeta` + helper `buildCompareJsonLd()` para injetar JSON-LD Schema.org. O A/B test do CTA final consome as tabelas `landing_ab_tests` / `landing_ab_sessions` via cliente Supabase direto (sem Edge Function).

---

## Convenções

### Autenticação

| Tipo | Header | Uso |
|------|--------|-----|
| **JWT** | `Authorization: Bearer <token>` | Endpoints autenticados |
| **Anon** | Nenhum ou anon key | Tracking, responses, webhooks |
| **Service** | `SUPABASE_SERVICE_ROLE_KEY` (interno) | Crons, webhooks externos |

### Padrão de Resposta

```json
// Sucesso
{ "success": true, "data": { ... } }

// Erro
{ "error": "Mensagem descritiva", "details": "..." }
```

### CORS

Todas as funções incluem:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 📦 Core

### `generate-quiz-ai`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Gera quiz completo via IA (Gemini) com modo auto-convencimento
- **Payload:** `{ mode, productName, targetAudience, numberOfQuestions, desiredAction, pdfContent? }`
- **Response:** `{ success, quiz: { title, questions[] }, tokens: { prompt, completion } }`

### `parse-pdf-document`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Extrai texto de PDF para usar na geração de quiz
- **Payload:** FormData com arquivo PDF
- **Response:** `{ success, content: string }`

### `save-quiz-draft`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Salva rascunho do quiz (autosave)
- **Payload:** `{ quizId, questions[], results[], formConfig }`
- **Response:** `{ success: true }`

### `generate-pdf-report`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Gera relatório PDF de analytics
- **Payload:** `{ quizId, dateRange }`
- **Response:** PDF binary

---

## 👤 Pagamento & Usuários

### `kiwify-webhook`
- **Método:** POST
- **Auth:** Token (query param ou body)
- **Descrição:** Processa eventos de pagamento Kiwify
- **Eventos:** `order_approved`, `subscription_renewed`, `subscription_canceled`
- **Idempotência:** Verifica duplicatas via order_id

### `list-all-users`
- **Método:** GET
- **Auth:** JWT (admin)
- **Descrição:** Lista usuários via Supabase Admin API com agregação de dados
- **Query:** `?page=1&per_page=20&search=email`
- **Batching interno:** Busca `profiles`, `user_subscriptions`, `user_roles`, `quizzes` e `audit_logs` em lotes de 100 IDs para evitar estouro de URL no PostgREST (>400 UUIDs)
- **Response:** `{ users: [{ id, email, profile, subscription, roles, stats }] }`

### `list-all-respondents`
- **Método:** GET
- **Auth:** JWT (admin)
- **Descrição:** Lista respondentes de quizzes

### `delete-user` / `delete-user-complete`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Exclusão de conta (cascade)
- **Payload:** `{ userId }`

### `export-user-data`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Exportação LGPD de todos os dados do usuário
- **Response:** JSON com todos os dados

### `update-user-profile`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Atualiza dados do perfil
- **Payload:** `{ full_name?, whatsapp?, company_slug? }`

### `merge-user-data` / `migrate-imported-user`
- **Método:** POST
- **Auth:** JWT (admin)
- **Descrição:** Migração/merge de dados entre contas

### `check-imported-user`
- **Método:** POST
- **Auth:** JWT
- **Descrição:** Verifica se usuário foi importado

---

## 📊 Analytics & Tracking

### `track-quiz-analytics`
- **Método:** POST
- **Auth:** Anon
- **Descrição:** Registra view/start/completion de quiz
- **Payload:** `{ quiz_id, event_type, session_id }`
- **Rate Limit:** Sim

### `track-quiz-step`
- **Método:** POST
- **Auth:** Anon
- **Descrição:** Registra progresso por step do funil
- **Payload:** `{ quiz_id, step_number, question_id, session_id }`

### `track-video-analytics`
- **Método:** POST
- **Auth:** Anon
- **Descrição:** Registra eventos de vídeo (play, pause, complete)
- **Payload:** `{ video_id, event_type, watch_time }`

### `track-blog-view`
- **Método:** POST
- **Auth:** Anon
- **Descrição:** Registra view de blog post
- **Payload:** `{ post_id }`

### `rate-limiter`
- **Método:** POST
- **Auth:** Anon
- **Descrição:** Verifica e registra rate limit
- **Payload:** `{ action, identifier }`
- **Response:** `{ allowed: boolean, remaining: number }`

---

## 📹 Bunny CDN (8 funções)

### `bunny-upload-video`
- **Auth:** JWT
- **Descrição:** Upload simples de vídeo para Bunny CDN

### `bunny-upload-video-multipart`
- **Auth:** JWT
- **Descrição:** Upload multipart para vídeos grandes

### `bunny-chunked-init` / `bunny-chunked-complete`
- **Auth:** JWT
- **Descrição:** Upload chunked (init → chunks → complete)

### `bunny-tus-create` / `bunny-tus-confirm`
- **Auth:** JWT
- **Descrição:** Upload via protocolo TUS (resumable)

### `bunny-confirm-upload`
- **Auth:** JWT
- **Descrição:** Confirma upload e atualiza status

### `bunny-delete-video`
- **Auth:** JWT
- **Descrição:** Remove vídeo do Bunny CDN e da tabela `bunny_videos`

### `bunny-generate-thumbnail`
- **Auth:** JWT
- **Descrição:** Gera thumbnail para vídeo

---

## 📱 WhatsApp Recovery (9 funções)

### `evolution-connect`
- **Auth:** JWT (admin)
- **Descrição:** Estabelece conexão com Evolution API

### `evolution-webhook`
- **Auth:** Anon (webhook)
- **Descrição:** Recebe eventos do WhatsApp (delivered, read, response)

### `send-welcome-message`
- **Auth:** Service
- **Descrição:** Envia mensagem de boas-vindas via WhatsApp

### `send-whatsapp-recovery`
- **Auth:** JWT (admin)
- **Descrição:** Envia mensagem de recuperação

### `send-test-message`
- **Auth:** JWT (admin)
- **Descrição:** Testa conexão WhatsApp com mensagem de teste

### `process-recovery-queue`
- **Auth:** Service (cron)
- **Descrição:** Processa fila de envio de mensagens WhatsApp

### `check-inactive-users`
- **Auth:** Service (cron)
- **Descrição:** Detecta usuários inativos para campanha WhatsApp

### `check-activation-24h`
- **Auth:** Service (cron)
- **Descrição:** Verifica ativação nas primeiras 24h

### `whatsapp-ai-reply`
- **Auth:** Service
- **Descrição:** Gera resposta automática via IA para mensagens WhatsApp

---

## 📧 Email Recovery & Automações (11 funções)

### `generate-email-content`
- **Auth:** JWT (admin) ou Service
- **Descrição:** Gera conteúdo HTML de email via IA (Gemini)
- **Payload:** `{ type: 'blog_digest'|'weekly_tip'|'success_story'|'platform_news'|'monthly_summary', context }`
- **Response:** `{ success, html, subject, tokens }`

### `check-inactive-users-email`
- **Auth:** Service (cron)
- **Descrição:** Detecta usuários inativos e agenda emails de recuperação

### `process-email-recovery-queue`
- **Auth:** Service (cron)
- **Descrição:** Processa fila de emails pendentes via E-goi

### `send-blog-digest`
- **Auth:** Service (cron) ou JWT (admin teste)
- **Descrição:** Envia digest semanal de blog posts via Bulk API
- **Bulk:** Até 100 destinatários por lote

### `send-weekly-tip`
- **Auth:** Service (cron) ou JWT (admin teste)
- **Descrição:** Envia dica semanal gerada por IA via Bulk API

### `send-success-story`
- **Auth:** Service (cron) ou JWT (admin teste)
- **Descrição:** Envia case de sucesso via Bulk API

### `send-platform-news`
- **Auth:** Service (cron) ou JWT (admin teste)
- **Descrição:** Envia novidades da plataforma via Bulk API

### `send-monthly-summary`
- **Auth:** Service (cron)
- **Descrição:** Envia resumo mensal personalizado (individual, não bulk)

### `send-test-email`
- **Auth:** JWT (admin)
- **Descrição:** Envia email de teste para validar template/configuração
- **Payload:** `{ templateId?, type?, email }`

### `egoi-email-webhook`
- **Auth:** Anon (webhook E-goi)
- **Descrição:** Processa eventos de email (open, click, bounce, complaint)
- **Atualiza:** `email_recovery_contacts` com status e timestamps

### `handle-email-unsubscribe`
- **Auth:** Anon
- **Descrição:** Processa unsubscribe via link no email
- **Query:** `?email=...&token=...`
- **Response:** Página HTML de confirmação

---

## 📝 Blog (4 funções)

### `generate-blog-post`
- **Auth:** Service (cron) ou JWT (admin)
- **Descrição:** Gera post completo com IA (texto + imagem) usando rotação de prompts

### `regenerate-blog-asset`
- **Auth:** JWT (admin)
- **Descrição:** Regenera imagem de post existente com rotação de prompts

### `blog-cron-trigger`
- **Auth:** Service (cron)
- **Descrição:** Trigger periódico para geração automática de posts

### `blog-sitemap`
- **Auth:** Anon
- **Descrição:** Gera sitemap XML dos posts publicados

---

## 🔧 Admin (3 funções)

### `system-health-check`
- **Auth:** JWT (admin)
- **Descrição:** Verifica saúde do sistema (DB, storage, auth)
- **Response:** `{ status, checks: { database, storage, auth, functions } }`

### `export-schema-sql` / `export-table-data`
- **Auth:** JWT (master_admin)
- **Descrição:** Exporta schema SQL ou dados de tabela específica

### `anonymize-ips`
- **Auth:** Service (cron)
- **Descrição:** Anonimiza IPs com mais de 6 meses (LGPD)

---

## 📈 Growth & Métricas (3 funções) — NOVO v2.41.0

### `growth-metrics`
- **Método:** POST
- **Auth:** JWT (admin)
- **Descrição:** Calcula métricas avançadas de crescimento (ICP Score, ativação, paywall, conversão)
- **Payload:** `{ period?: '7d' | '30d' | '90d' }`
- **Response:** `{ success, metrics: { icp, paywall, conversion, engagement } }`

### `check-expired-trials`
- **Método:** POST
- **Auth:** Service (cron)
- **Descrição:** Verifica e expira trials vencidos, atualiza user_subscriptions
- **Response:** `{ success, expired_count: number }`

### `sync-plan-limits`
- **Método:** POST
- **Auth:** JWT (admin)
- **Descrição:** Sincroniza limites de plano entre subscription_plans e user_subscriptions
- **Payload:** `{ userId?: string }` (se vazio, sincroniza todos)
- **Response:** `{ success, synced_count: number }`

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [../README.md](../README.md) | Setup e visão geral |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [COMPONENTS.md](./COMPONENTS.md) | Componentes frontend |
| [PENDENCIAS.md](./PENDENCIAS.md) | Changelog |
| [BLOCKS.md](./BLOCKS.md) | Catálogo dos 34 tipos de blocos |
| [TESTING.md](./TESTING.md) | Guia de testes |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo das 65 Edge Functions |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema completo (68 tabelas) |
| [SERVICES.md](./SERVICES.md) | Catálogo de services |

### RPC `get_table_sizes()` (v2.42.0)

- **Tipo:** SECURITY DEFINER (SQL)
- **Auth:** Autenticado (via Supabase client)
- **Parâmetros:** Nenhum
- **Retorno:** `table_name text, total_bytes bigint, total_size text, row_estimate bigint`
- **Descrição:** Retorna tamanhos reais de todas as tabelas públicas via `pg_total_relation_size`. Usado no DatabaseMonitorTab.
