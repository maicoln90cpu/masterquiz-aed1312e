# 🗄️ DATABASE SCHEMA — MasterQuiz

> Schema completo do banco de dados PostgreSQL (Supabase)
> Versão 2.41.0 | 15 de Abril de 2026

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tabelas Core](#tabelas-core)
- [Tabelas de Usuários](#tabelas-de-usuários)
- [Tabelas de Analytics](#tabelas-de-analytics)
- [Tabelas de GTM/Tracking](#tabelas-de-gtmtracking)
- [Tabelas Admin](#tabelas-admin)
- [Tabelas de Recovery (WhatsApp)](#tabelas-de-recovery-whatsapp)
- [Tabelas de Email](#tabelas-de-email)
- [Tabelas de Blog](#tabelas-de-blog)
- [Tabelas de Vídeo](#tabelas-de-vídeo)
- [Tabelas de A/B Testing](#tabelas-de-ab-testing)
- [Tabelas de i18n](#tabelas-de-i18n)
- [Tabelas de Landing/Site](#tabelas-de-landingsite)
- [Tabelas de Compliance](#tabelas-de-compliance)
- [Tabelas de WhatsApp AI](#tabelas-de-whatsapp-ai)
- [Enums](#enums)
- [DB Functions](#db-functions)
- [Triggers](#triggers)
- [Diagrama ER](#diagrama-er)

---

## 🎯 Visão Geral

- **Total de tabelas:** 68
- **RLS:** Ativo em TODAS as tabelas
- **Enums:** 8 tipos customizados
- **DB Functions:** 16+ (incluindo SECURITY DEFINER)
- **Triggers:** 3 no signup (profile, role, subscription)

---

## 📦 Tabelas Core

### `quizzes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | ID único |
| user_id | uuid FK→profiles | Dono do quiz |
| title | text | Título do quiz |
| description | text | Descrição |
| slug | text UNIQUE | URL slug |
| template | text | Template visual |
| status | quiz_status enum | draft/active/archived |
| is_public | boolean | Publicado? |
| question_count | integer | Contagem de perguntas |
| logo_url, show_logo, show_title, show_description | configuração visual |
| global_font_family, global_font_size, global_text_align | tipografia |
| progress_style | text | Estilo da barra de progresso |
| hide_branding | boolean | Ocultar marca MasterQuiz |
| facebook_pixel_id | text | Pixel por quiz |
| ab_test_active | boolean | A/B test ativo |
| creation_source | text | manual/ai/template |
| show_question_number, show_results | boolean | Configurações de exibição |

### `quiz_questions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | ID |
| quiz_id | uuid FK→quizzes | Quiz pai |
| question_text | text | Texto da pergunta |
| custom_label | text | Label customizado |
| answer_format | answer_format enum | single_choice/multiple_choice/yes_no |
| options | jsonb | Array de opções {text, value, imageUrl?} |
| blocks | jsonb | Array de blocos (34 tipos) |
| conditions | jsonb | Lógica condicional (branching) |
| order_number | integer | Ordem |
| media_type | media_type enum | image/video/audio |
| media_url | text | URL da mídia |

### `quiz_results`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | ID |
| quiz_id | uuid FK→quizzes | Quiz pai |
| result_text | text | Texto do resultado |
| condition_type | result_condition enum | always/score_range/specific_answers |
| min_score, max_score | integer | Range de score |
| condition_config | jsonb | Configuração de condições |
| result_type | text | standard/calculator |
| formula | text | Fórmula matemática |
| variable_mapping | jsonb | Mapa de variáveis |
| calculator_ranges | jsonb | Faixas de resultado |
| decimal_places | integer | Casas decimais |
| display_format, result_unit | text | Formato de exibição |
| button_text, redirect_url | text | CTA |
| image_url, video_url | text | Mídia do resultado |

### `quiz_responses`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | ID |
| quiz_id | uuid FK→quizzes | Quiz |
| answers | jsonb | Respostas do visitante |
| respondent_name, respondent_email, respondent_whatsapp | text | Dados do lead |
| custom_field_data | jsonb | Campos customizados |
| result_id | uuid FK→quiz_results | Resultado obtido |
| session_id | text | ID da sessão |
| variant_id | uuid | Variante A/B |
| lead_status | text | Status CRM |
| ip_address, user_agent | text | Metadados |

### `quiz_form_config`
Configuração do formulário de coleta por quiz (collect_name, collect_email, collect_whatsapp, collection_timing, custom_fields).

### `custom_form_fields`
Campos customizados por quiz (field_name, field_type enum, field_options, is_required, order_number).

### `quiz_templates`
Templates de quiz pré-configurados (name, category, description, icon, full_config, preview_config, is_active, is_premium, display_order).

### `quiz_tags`
Tags para organização de quizzes (name, color, user_id).

### `quiz_tag_relations`
Relação N:N entre quizzes e tags (quiz_id FK→quizzes, tag_id FK→quiz_tags).

---

## 👤 Tabelas de Usuários

### `profiles`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK (= auth.users.id) | ID do usuário |
| email | text | Email |
| full_name | text | Nome completo |
| company_slug | text | Slug da empresa |
| whatsapp | text | WhatsApp |
| facebook_pixel_id, gtm_container_id | text | Tracking global |
| user_stage | text | Estágio PQL |
| user_objectives | text[] | Objetivos |
| login_count | integer | Contagem de logins |
| deleted_at | timestamptz | Soft delete |
| account_created_event_sent | boolean | Flag de evento GTM enviado |
| analytics_viewed_at, crm_viewed_at | timestamptz | Tracking de PQL |
| stage_updated_at | timestamptz | Última mudança de estágio |
| utm_source, utm_medium, utm_campaign | text | UTM tracking |

### `user_subscriptions`
Plano ativo do usuário (plan_type, quiz_limit, response_limit, features, kiwify_order_id, expires_at, payment_confirmed).

### `user_roles`
| Coluna | Tipo |
|--------|------|
| user_id | uuid FK→auth.users |
| role | app_role enum (admin/moderator/user) |
| UNIQUE(user_id, role) | |

### `subscription_plans`
Planos disponíveis com preços, limites, features, URLs de checkout (incluindo campos `_mode_b` para preços diferenciados).

### `user_integrations`
Integrações configuradas pelo usuário (provider, api_key criptografada, webhook_url, is_active).

### `user_webhooks`
Webhooks personalizados do usuário.

### `user_onboarding`
Estado de onboarding do usuário (steps completados, tour visto, etc.).

### `trial_logs`
Logs de trials de usuários (user_id, started_at, expires_at, plan_type, status).

### `validation_requests`
Pedidos de validação de dados (user_id, type, status, metadata).

---

## 📊 Tabelas de Analytics

- **`quiz_analytics`** — Métricas agregadas por dia (views, starts, completions, conversion_rate)
- **`quiz_step_analytics`** — Tracking de funil por step/sessão
- **`quiz_cta_click_analytics`** — Cliques em CTAs por quiz (block_id, cta_url, cta_text, step_number)

---

## 🎯 Tabelas de GTM/Tracking

- **`gtm_event_logs`** — Eventos GTM persistidos (event_name, user_id, metadata, created_at)
- **`gtm_event_integrations`** — Controle de integração GTM por evento (event_name, gtm_event_name, is_integrated)

---

## 🛡️ Tabelas Admin

- **`audit_logs`** — Log de ações (action, resource_type, resource_id, metadata, ip_address, user_agent)
- **`admin_notifications`** — Notificações para usuários geradas pelo admin
  - Colunas: user_id, type, title, message, metadata, read, created_at
  - RLS: Usuário lê/atualiza apenas suas notificações
- **`support_tickets` / `ticket_messages`** — Sistema de tickets
- **`system_settings`** — Configurações globais (site_mode, prompts, tokens)
- **`site_settings`** — Configurações do site (modo A/B, URLs, etc.)
- **`master_admin_emails`** — Emails com acesso master_admin
- **`system_health_metrics`** — Métricas de saúde do sistema
- **`rate_limit_tracker`** — Controle de rate limiting
- **`ai_quiz_generations`** — Log de gerações de quiz com IA (tokens, custo, modelo)

---

## 📱 Tabelas de Recovery (WhatsApp)

- **`recovery_settings`** — Configurações globais de recuperação
- **`recovery_templates`** — Templates de mensagem WhatsApp
- **`recovery_campaigns`** — Campanhas com status e métricas
- **`recovery_contacts`** — Fila de contatos para envio
- **`recovery_blacklist`** — Números bloqueados

---

## 📧 Tabelas de Email

- **`email_recovery_settings`** — Configuração global de email recovery
- **`email_recovery_templates`** — 13 categorias, A/B testing (subject_b), trigger_days
- **`email_recovery_contacts`** — Fila de envio com status e tracking
- **`email_automation_config`** — 5 automações (blog_digest, weekly_tip, etc.)
- **`email_automation_logs`** — Logs de execução de automações
- **`email_unsubscribes`** — Opt-outs (CAN-SPAM/LGPD)
- **`email_tips`** — Dicas semanais
- **`email_generation_logs`** — Custos de geração IA

---

## 📝 Tabelas de Blog

- **`blog_posts`** — Posts com SEO, FAQ schema, internal links
- **`blog_settings`** — Config de geração (model, schedule, topics)
- **`blog_image_prompts`** — 5 estilos de prompts com rotação
- **`blog_generation_logs`** — Custos de geração (texto + imagem)

---

## 🎥 Tabelas de Vídeo

- **`bunny_videos`** — Vídeos enviados via Bunny CDN (bunny_video_id, cdn_url, status, size_mb, duration_seconds)
- **`video_usage`** — Uso de vídeo por usuário
- **`video_analytics`** — Analytics de reprodução de vídeo

---

## 🔀 Tabelas de A/B Testing

- **`quiz_variants`** — Variantes de quiz para A/B testing (variant_letter, traffic_weight, is_control)
- **`ab_test_sessions`** — Sessões de teste A/B de quizzes
- **`landing_ab_tests`** — Testes A/B da landing page (variant_a_content, variant_b_content, traffic_split)
- **`landing_ab_sessions`** — Sessões de testes A/B da landing

---

## 🌐 Tabelas de i18n

- **`quiz_translations`** — Traduções de quizzes (title, description por language_code)
- **`quiz_question_translations`** — Traduções de perguntas (question_text, options por language_code)

---

## 🏠 Tabelas de Landing/Site

- **`landing_content`** — Conteúdo editável da landing page (key, value_pt, value_en, value_es, site_mode)

---

## ⚖️ Tabelas de Compliance

- **`cookie_consents`** — Consentimentos de cookies
- **`scheduled_deletions`** — Exclusões agendadas (LGPD)
- **`notification_preferences`** — Preferências de notificação

---

## 🤖 Tabelas de WhatsApp AI

- **`whatsapp_ai_settings`** — Configurações do agente IA (model, max_retries, system_prompt)
- **`whatsapp_ai_knowledge`** — Base de conhecimento para respostas IA
- **`whatsapp_conversations`** — Histórico de conversas WhatsApp

---

## 🏷️ Enums

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.quiz_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE public.answer_format AS ENUM ('single_choice', 'multiple_choice', 'yes_no');
CREATE TYPE public.media_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE public.result_condition AS ENUM ('always', 'score_range', 'specific_answers');
CREATE TYPE public.collection_timing AS ENUM ('before', 'after', 'both', 'none');
CREATE TYPE public.field_type AS ENUM ('text', 'email', 'phone', 'number', 'select', 'textarea');
CREATE TYPE public.recovery_campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled');
```

---

## ⚙️ DB Functions

| Função | Tipo | Descrição |
|--------|------|-----------|
| `has_role(uuid, app_role)` | SECURITY DEFINER | Verifica role sem recursão RLS |
| `handle_new_user_profile()` | TRIGGER | Cria profile no signup |
| `handle_new_user_role()` | TRIGGER | Atribui role admin |
| `handle_new_user_subscription()` | TRIGGER | Cria subscription free |
| `generate_slug(text)` | IMMUTABLE | Gera slug único |
| `get_quiz_for_display(slug)` | SECURITY DEFINER | Busca quiz público |
| `get_user_quiz_stats(uuid[])` | SECURITY DEFINER | Stats para admin |
| `increment_login_count(uuid)` | VOLATILE | Incrementa logins |
| `delete_user_by_id(uuid)` | SECURITY DEFINER | Deleção de conta |
| `cleanup_old_audit_logs()` | VOLATILE | Limpa logs > 90 dias |
| `cleanup_old_health_metrics()` | VOLATILE | Limpa métricas > 30 dias |
| `cleanup_expired_rate_limits()` | VOLATILE | Limpa rate limits expirados |
| `anonymize_old_ips()` | VOLATILE | LGPD: anonimiza IPs > 6 meses |
| `cleanup_old_gtm_events()` | VOLATILE | Limpa GTM > 30 dias |
| `trigger_welcome_message()` | TRIGGER | Welcome WhatsApp |
| `trigger_first_quiz_message()` | TRIGGER | Msg no 1º quiz ativo |

---

## 🔗 Diagrama ER (Simplificado)

```
auth.users ──┬── profiles (1:1)
             ├── user_roles (1:N)
             ├── user_subscriptions (1:1)
             ├── user_onboarding (1:1)
             ├── admin_notifications (1:N)
             └── trial_logs (1:N)

profiles ──── quizzes (1:N)
              ├── quiz_questions (1:N)
              │   └── quiz_question_translations (1:N)
              ├── quiz_results (1:N)
              ├── quiz_responses (1:N)
              ├── quiz_form_config (1:1)
              ├── custom_form_fields (1:N)
              ├── quiz_analytics (1:N)
              ├── quiz_step_analytics (1:N)
              ├── quiz_cta_click_analytics (1:N)
              ├── quiz_variants (1:N)
              ├── quiz_translations (1:N)
              └── quiz_tag_relations (N:N → quiz_tags)

profiles ──── user_integrations (1:N)
              └── integration_logs (1:N)

profiles ──── email_recovery_contacts (1:N)
profiles ──── bunny_videos (1:N)
profiles ──── whatsapp_conversations (1:N)

gtm_event_logs ──── gtm_event_integrations (referência por event_name)
```

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| [SECURITY.md](./SECURITY.md) | RLS policies e práticas de segurança |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Arquitetura técnica |
| [API_DOCS.md](./API_DOCS.md) | Edge Functions |
| [ADR.md](./ADR.md) | Decisões arquiteturais |
| [EDGE_FUNCTIONS.md](./EDGE_FUNCTIONS.md) | Catálogo das 64 Edge Functions |
