# ⚡ EDGE FUNCTIONS — Catálogo Completo (64 funções)

> MasterQuiz — Todas as Edge Functions organizadas por domínio
> Versão 2.42.0 | 17 de Abril de 2026

> ℹ️ A função `blog-sitemap` agora inclui automaticamente a página `/compare` (priority 0.9, weekly) — v2.42.0.

---

## 📦 Core (4)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `generate-quiz-ai` | POST | JWT | 5/h/user | Geração de quiz via IA (Gemini) |
| `parse-pdf-document` | POST | JWT | 10/h/user | Extração de PDF para quiz |
| `save-quiz-draft` | POST | JWT | — | Autosave de rascunhos |
| `generate-pdf-report` | POST | JWT | — | Relatório PDF de analytics |

## 👤 Pagamento & Usuários (10)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `kiwify-webhook` | POST | Token | — | Webhook de pagamento Kiwify |
| `list-all-users` | POST | JWT+Admin | — | Lista usuários (batching 100) |
| `list-all-respondents` | POST | JWT | — | Lista respondentes |
| `delete-user` | POST | JWT | — | Exclusão parcial |
| `delete-user-complete` | POST | JWT | — | Exclusão completa (cascade) |
| `export-user-data` | POST | JWT | — | Exportação LGPD |
| `update-user-profile` | POST | JWT | — | Atualiza perfil |
| `merge-user-data` | POST | JWT+Admin | — | Merge de contas |
| `migrate-imported-user` | POST | JWT+Admin | — | Migração de importados |
| `check-imported-user` | POST | JWT | — | Verificação de importado |

## 📊 Analytics & Tracking (5)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `track-quiz-analytics` | POST | Anon | 200/5m/IP | Views, starts, completions |
| `track-quiz-step` | POST | Anon | 200/5m/IP | Funil por step |
| `track-video-analytics` | POST | Anon | 100/5m/IP | Analytics de vídeo |
| `track-blog-view` | POST | Anon | 100/5m/IP | Views de blog |
| `track-cta-redirect` | POST | Anon | 100/5m/IP | Cliques em CTAs |

## 🔗 Integrações (2)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `sync-integration` | POST | JWT | — | Sincroniza com CRMs externos |
| `save-quiz-response` | POST | Anon | 100/15m/IP | Salva resposta pública |

## 🎥 Bunny CDN (8)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `bunny-upload-video` | POST | JWT | — | Upload simples |
| `bunny-upload-video-multipart` | POST | JWT | — | Upload multipart |
| `bunny-chunked-init` | POST | JWT | — | Inicia upload chunked |
| `bunny-chunked-complete` | POST | JWT | — | Completa upload chunked |
| `bunny-tus-create` | POST | JWT | — | Cria upload TUS |
| `bunny-tus-confirm` | POST | JWT | — | Confirma upload TUS |
| `bunny-confirm-upload` | POST | JWT | — | Confirmação geral |
| `bunny-delete-video` | POST | JWT | — | Exclusão de vídeo |

## 📱 WhatsApp Recovery (9)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `evolution-connect` | POST | JWT+Admin | — | Conecta Evolution API |
| `evolution-webhook` | POST | Anon | — | Webhook de eventos |
| `send-welcome-message` | POST | Service | — | Mensagem de boas-vindas |
| `send-whatsapp-recovery` | POST | JWT+Admin | — | Mensagem de recuperação |
| `send-test-message` | POST | JWT+Admin | — | Teste de conexão |
| `process-recovery-queue` | POST | Service | — | Processamento da fila |
| `check-inactive-users` | POST | Service | — | Detecção de inativos |
| `check-activation-24h` | POST | Service | — | Check de ativação 24h |
| `whatsapp-ai-reply` | POST | Anon | — | Resposta IA via WhatsApp |

## 📧 Email Recovery & Automações (11)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `generate-email-content` | POST | JWT+Admin | — | Geração de conteúdo IA |
| `check-inactive-users-email` | POST | Service | — | Detecção de inativos email |
| `process-email-recovery-queue` | POST | Service | — | Processamento da fila |
| `send-blog-digest` | POST | Service | — | Blog digest (Bulk API) |
| `send-weekly-tip` | POST | Service | — | Dica semanal (Bulk API) |
| `send-success-story` | POST | Service | — | Case de sucesso (Bulk API) |
| `send-platform-news` | POST | Service | — | Novidades (Bulk API) |
| `send-monthly-summary` | POST | Service | — | Resumo mensal |
| `send-test-email` | POST | JWT+Admin | — | Teste de envio |
| `egoi-email-webhook` | POST | Anon | — | Webhook E-goi |
| `handle-email-unsubscribe` | GET/POST | Anon | — | Unsubscribe |

## 📝 Blog (4)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `generate-blog-post` | POST | JWT+Admin | — | Geração de post IA |
| `regenerate-blog-asset` | POST | JWT+Admin | — | Regenera imagem |
| `blog-cron-trigger` | POST | Service | — | Trigger de cron |
| `blog-sitemap` | GET | Anon | — | Sitemap XML |

## 🛡️ Admin & Suporte (6)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `system-health-check` | POST | JWT+Admin | — | Saúde do sistema |
| `export-schema-sql` | POST | JWT+Admin | — | Exporta schema |
| `export-table-data` | POST | JWT+Admin | — | Exporta dados de tabela |
| `anonymize-ips` | POST | Service | — | Anonimização LGPD |
| `admin-view-user-data` | POST | JWT+Admin | — | Dados do usuário (quizzes, responses, session_history, save_quiz) |
| `admin-update-subscription` | POST | JWT+Admin | — | Atualiza plano do usuário |

## 📈 Growth & Métricas (3) — NOVO v2.41.0

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `growth-metrics` | POST | JWT+Admin | — | Métricas avançadas do Growth Dashboard |
| `check-expired-trials` | POST | Service | — | Verifica e expira trials vencidos |
| `sync-plan-limits` | POST | JWT+Admin | — | Sincroniza limites de plano |

## 🔧 Utilitários (2)

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|------------|-----------|
| `rate-limiter` | POST | Anon | — | Controle de rate limit |
| `bunny-generate-thumbnail` | POST | JWT | — | Gera thumbnail de vídeo |

---

## 📊 Resumo por Auth

| Tipo | Quantidade |
|------|-----------|
| JWT (autenticado) | 22 |
| JWT + Admin | 16 |
| Service (cron/interno) | 14 |
| Anon (público) | 12 |
| **Total** | **64** |

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [API_DOCS.md](./API_DOCS.md) | Payloads e responses detalhados |
| [SECURITY.md](./SECURITY.md) | Autenticação e rate limiting |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Fluxos de dados |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | Schema completo (68 tabelas) |
