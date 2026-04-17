# EGOI.md — Guia de Replicação: Sistema de Email Marketing Automatizado

> **Objetivo**: Documentar toda a lógica, schema, edge functions e fluxos do sistema de recuperação e automação de emails via E-goi (API Slingshot / Transactional V2), para replicação em qualquer outro projeto Lovable.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO PRINCIPAL                          │
│                                                                 │
│  Triggers SQL ──► email_recovery_contacts (fila) ──► pg_cron   │
│                                                                 │
│  pg_cron (5min) ──► process-email-recovery-queue ──► E-goi API │
│                                                                 │
│  E-goi ──► egoi-email-webhook ──► atualiza status (open/click) │
│                                                                 │
│  Usuário ──► handle-email-unsubscribe ──► email_unsubscribes   │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Principais
1. **Tabelas de banco** — armazenam fila, configurações, templates, logs e unsubscribes
2. **Triggers SQL** — enfileiram emails automaticamente (welcome, tutorial, milestones)
3. **Edge Functions** — processam fila, enviam via API, recebem webhooks
4. **pg_cron** — executa `process-email-recovery-queue` a cada 5 minutos
5. **E-goi Slingshot API** — provedor de envio transacional

---

## 2. Schema do Banco de Dados

### 2.1 `email_recovery_settings` (configurações globais)
```sql
CREATE TABLE email_recovery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  sender_email TEXT DEFAULT 'noreply@seudominio.com',
  sender_name TEXT DEFAULT 'SeuApp',
  daily_email_limit INT DEFAULT 100,
  hourly_email_limit INT DEFAULT 30,
  batch_size INT DEFAULT 10,
  allowed_hours_start TEXT DEFAULT '09:00',
  allowed_hours_end TEXT DEFAULT '22:00',
  inactivity_days_trigger INT DEFAULT 7,
  user_cooldown_days INT DEFAULT 3,
  exclude_plan_types JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Campos-chave:**
- `is_active` — liga/desliga todo o sistema
- `daily_email_limit` / `hourly_email_limit` — rate limiting
- `batch_size` — quantos emails processar por execução do cron
- `allowed_hours_start/end` — janela horária (fuso do Brasil)
- `inactivity_days_trigger` — dias sem login para considerar inativo
- `user_cooldown_days` — intervalo mínimo entre emails para o mesmo usuário

### 2.2 `email_recovery_templates` (templates de email)
```sql
CREATE TABLE email_recovery_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'reengagement',
  subject TEXT NOT NULL,
  subject_b TEXT, -- para A/B testing
  html_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  trigger_days INT, -- dias de inatividade para disparar
  usage_count INT DEFAULT 0,
  open_rate NUMERIC,
  click_rate NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Categorias suportadas (13):**
- `welcome` — boas-vindas ao cadastro
- `tutorial` — tutorial após primeiro quiz
- `reengagement` — reengajamento de inativos
- `milestone` — marcos (10, 50, 100, 500 leads)
- `tip` — dicas semanais (gerado por IA)
- `blog_digest` — resumo de novos artigos
- `monthly_summary` — resumo mensal de performance
- `success_story` — casos de sucesso (gerado por IA)
- `platform_news` — novidades da plataforma (gerado por IA)
- `upgrade_prompt` — incentivo a upgrade de plano
- `feedback_request` — solicitação de feedback
- `feature_highlight` — destaque de funcionalidade
- `seasonal` — conteúdo sazonal

**Variáveis de template disponíveis:**
- `{name}` — nome completo
- `{first_name}` — primeiro nome
- `{days_inactive}` — dias inativos
- `{quiz_count}` — total de quizzes do usuário
- `{lead_count}` — total de leads
- `{plan_name}` — plano atual
- `{company_name}` — nome da plataforma
- `{login_link}` — URL de login
- `{support_link}` — URL de suporte/FAQ
- `{unsubscribe_link}` — link de cancelamento (obrigatório)

### 2.3 `email_recovery_contacts` (fila de envio)
```sql
CREATE TABLE email_recovery_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, opened, clicked, failed, cancelled
  template_id UUID REFERENCES email_recovery_templates(id),
  campaign_id UUID,
  priority INT DEFAULT 0,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  egoi_message_id TEXT, -- ID retornado pela API E-goi
  ab_variant TEXT, -- 'A' ou 'B'
  error_message TEXT,
  retry_count INT DEFAULT 0,
  days_inactive_at_contact INT DEFAULT 0,
  user_plan_at_contact TEXT,
  user_quiz_count INT DEFAULT 0,
  user_lead_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Status lifecycle:** `pending` → `sent` → `opened` → `clicked` (ou `failed`/`cancelled`)

### 2.4 `email_unsubscribes` (conformidade LGPD/CAN-SPAM)
```sql
CREATE TABLE email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID,
  reason TEXT DEFAULT 'user_request',
  unsubscribed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Edge Functions

### 3.1 `process-email-recovery-queue` (processador da fila)

**Executado por:** pg_cron a cada 5 minutos

**Fluxo:**
1. Verifica se `email_recovery_settings.is_active = true`
2. Verifica janela horária (fuso America/Sao_Paulo)
3. Checa limites diários e horários contra emails já enviados
4. Resolve `senderId` via `GET /api/v2/email/senders` da E-goi
5. Carrega emails descadastrados (`email_unsubscribes`)
6. Busca contatos pendentes (`status = 'pending'`, `scheduled_at <= now()`)
7. Para cada contato:
   - Verifica unsubscribe → cancela se descadastrado
   - Carrega template associado
   - Busca nome do usuário via `profiles`
   - Faz A/B split do subject (50/50) se `subject_b` existe
   - Substitui variáveis no HTML e subject
   - Injeta footer de unsubscribe se ausente
   - Envia via `POST /api/v2/email/messages/action/send/single`
   - Inclui `webhookUrl` para tracking automático
   - Atualiza status para `sent` com `egoi_message_id`
   - Delay de 1.5s entre envios

**Payload E-goi (Slingshot API):**
```json
{
  "senderId": "123",
  "senderName": "MeuApp",
  "to": "usuario@email.com",
  "subject": "Assunto do email",
  "htmlBody": "<html>...</html>",
  "openTracking": true,
  "clickTracking": true,
  "webhookUrl": "https://[PROJECT_REF].supabase.co/functions/v1/egoi-email-webhook",
  "customHeaders": {
    "List-Unsubscribe": "<https://...>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
  }
}
```

**Restrições importantes da API E-goi Slingshot:**
- Endpoint: `/v2/email/messages/action/send/single`
- Campo `to` deve ser string simples (não array/objeto)
- `senderId` deve ser resolvido dinamicamente via `/v2/email/senders`
- Tracking usa `openTracking` e `clickTracking` (booleanos)
- Header: `ApiKey: <sua-chave>`

### 3.2 `egoi-email-webhook` (receptor de eventos)

**Chamado por:** E-goi quando ocorre abertura, clique ou bounce

**Fluxo:**
1. Recebe evento(s) no body (pode ser array)
2. Extrai `messageId` e `event` type
3. Busca contato por `egoi_message_id`
4. Atualiza conforme tipo:
   - `open`/`opened` → `opened_at` + status `opened`
   - `click`/`clicked` → `clicked_at` + `opened_at` + status `clicked`
   - `bounce`/`complaint`/`spam` → status `failed`

**Configuração:**
- O `webhookUrl` é incluído automaticamente no payload de envio
- Não precisa configurar webhook manualmente no painel E-goi para emails enviados pela Slingshot API
- Para webhooks globais (Marketing API), registre manualmente no painel

### 3.3 `handle-email-unsubscribe` (cancelamento)

**Chamado por:** Link de unsubscribe nos emails

**Fluxo:**
1. Recebe `?email=...&uid=...` via GET
2. Upserta em `email_unsubscribes`
3. Cancela todos os emails pendentes do usuário
4. Exibe página HTML de confirmação

### 3.4 `check-inactive-users-email` (segmentação)

**Chamado por:** Cron ou manualmente pelo admin

**Fluxo:**
1. Verifica configurações ativas e janela horária
2. Busca usuários inativos (sem login há N dias)
3. Aplica filtros: cooldown, planos excluídos, descadastrados
4. Seleciona template apropriado (por `trigger_days` e `category`)
5. Insere na fila (`email_recovery_contacts`) com prioridade

### 3.5 `generate-email-content` (conteúdo por IA)

**Usado para:** Dicas semanais, resumos, digests

**Fluxo:**
1. Recebe tipo de conteúdo e dados do usuário
2. Gera HTML via OpenAI/Gemini com tom humano e conversacional
3. Retorna HTML pronto para uso como template dinâmico

### 3.6 `send-test-email` (teste individual)

**Usado por:** Admin para testar templates

**Fluxo:**
1. Recebe `templateId` e `testEmail`
2. Carrega template e substitui variáveis com dados fictícios
3. Envia via E-goi para o email de teste
4. Retorna resultado do envio

---

## 4. Triggers SQL (Automações)

### 4.1 Welcome Email (novo cadastro)
```sql
-- Trigger: AFTER INSERT ON profiles
-- Função: trigger_welcome_email_on_signup()
-- Lógica: busca template 'welcome' ativo e enfileira imediatamente
```

### 4.2 Tutorial (primeiro quiz criado)
```sql
-- Trigger: AFTER INSERT ON quizzes
-- Função: check_first_quiz_tutorial()
-- Lógica: se é o 1º quiz do user, agenda email tutorial para 3 dias depois
```

### 4.3 Milestones de Leads (10, 50, 100, 500)
```sql
-- Trigger: AFTER INSERT ON quiz_responses
-- Função: check_lead_milestone()
-- Lógica: conta total de leads, verifica milestones, enfileira se atingido
```

---

## 5. Automações Dinâmicas (IA)

5 tipos de email gerados por IA:
1. **Dica Semanal** (`send-weekly-tip`) — conteúdo educativo sobre marketing/quizzes
2. **Resumo Mensal** (`send-monthly-summary`) — performance do usuário no mês
3. **Digest de Blog** (`send-blog-digest`) — novos artigos publicados
4. **Case de Sucesso** (`send-success-story`) — história inspiracional
5. **Novidades** (`send-platform-news`) — updates da plataforma

Todas usam a mesma estrutura:
- Edge function dedicada
- Resolução de sender via API E-goi
- Envio em lote (Bulk API para até 100 destinatários)
- Tracking (openTracking + clickTracking)
- Conformidade (List-Unsubscribe headers)

---

## 6. A/B Testing

- Campo `subject_b` no template permite testar 2 assuntos
- Split 50/50 aleatório por contato
- Variante registrada em `email_recovery_contacts.ab_variant` ('A' ou 'B')
- Métricas de `open_rate` e `click_rate` no template para análise

---

## 7. Conformidade (LGPD/CAN-SPAM)

1. **Link de unsubscribe** obrigatório em todos os emails
2. **Header `List-Unsubscribe`** para one-click unsubscribe
3. **Verificação de unsubscribe** antes de cada envio
4. **Cooldown entre emails** (configurável, padrão 3 dias)
5. **Janela horária** respeitada (não envia de madrugada)
6. **Rate limiting** diário e horário

---

## 8. Como Replicar em Outro Projeto Lovable

### Passo 1: Criar tabelas
Execute as queries SQL da seção 2 para criar as 4 tabelas.

### Passo 2: Configurar secrets
- `EGOI_API_KEY` — chave da API E-goi (obtida em E-goi > Integrations > API Keys)

### Passo 3: Criar Edge Functions
Copie e adapte as 6 funções:
1. `process-email-recovery-queue/index.ts`
2. `egoi-email-webhook/index.ts`
3. `handle-email-unsubscribe/index.ts`
4. `check-inactive-users-email/index.ts`
5. `send-test-email/index.ts`
6. `generate-email-content/index.ts`

**Adapte:**
- URLs do projeto Supabase (`PROJECT_REF`)
- Nome da plataforma (ex: `MasterQuiz` → `SeuApp`)
- Links de login/suporte
- Variáveis de template conforme seu domínio

### Passo 4: Configurar pg_cron
```sql
SELECT cron.schedule(
  'process-email-recovery-queue',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/process-email-recovery-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
```

### Passo 5: Criar triggers SQL
Adapte os triggers da seção 4 para seu schema.

### Passo 6: Configurar sender na E-goi
1. Acesse E-goi > Settings > Senders
2. Verifique/adicione o email remetente
3. O `senderId` será resolvido automaticamente pela API

### Passo 7: Criar templates
Insira templates na tabela `email_recovery_templates` com HTML responsivo.

---

## 9. Considerações de Performance

- **Batch size**: 10 emails por execução (configurável)
- **Delay entre envios**: 1.5s (evitar rate limiting)
- **Cron interval**: 5 minutos
- **Throughput**: ~120 emails/hora com configuração padrão
- **Retry**: até 3 tentativas antes de marcar como `failed`

---

## 10. Dashboard Admin

O sistema inclui um painel admin com:
- Contadores de emails enviados/abertos/clicados
- Lista de contatos na fila
- Gestão de templates (visual + HTML)
- Automações (ativar/desativar, disparar teste)
- Logs de execução
- Performance por template (open/click rate)
