
# Plano: Correcao de Erros + Tour + Indexes

## Problema 1: Erros no Admin (Observabilidade) e CRM

### Causa raiz
- **Nenhuma foreign key existe no banco** (confirmado: 0 FKs). Sem FKs, o Supabase client nao consegue fazer joins automaticos como `quizzes!inner(...)` ou `quiz_results(result_text)`.
- O **CRM** crasha porque a query faz `quiz_results(result_text)` sem FK entre `quiz_responses.result_id` e `quiz_results.id`.
- O **AdminDashboard** chama `supabase.functions.invoke('list-all-users')` que **nao existe** como Edge Function.
- A aba **Observabilidade** chama `supabase.functions.invoke('system-health-check')` que tambem **nao existe**.

### Solucao
1. **Criar foreign keys** para todas as relacoes usadas em joins do Supabase client:
   - `quiz_responses.quiz_id -> quizzes.id`
   - `quiz_responses.result_id -> quiz_results.id`
   - `quiz_questions.quiz_id -> quizzes.id`
   - `quiz_results.quiz_id -> quizzes.id`
   - `quiz_form_config.quiz_id -> quizzes.id`
   - `custom_form_fields.quiz_id -> quizzes.id`
   - `quiz_translations.quiz_id -> quizzes.id`
   - `quiz_tag_relations.quiz_id -> quizzes.id`
   - `quiz_tag_relations.tag_id -> quiz_tags.id`
   - `quiz_analytics.quiz_id -> quizzes.id`
   - `quiz_step_analytics.quiz_id -> quizzes.id`
   - `quiz_variants.quiz_id -> quizzes.id`
   - `ticket_messages.ticket_id -> support_tickets.id`
   - `integration_logs.integration_id -> user_integrations.id`
   - `webhook_logs.webhook_id -> user_webhooks.id`
   - `quiz_question_translations.question_id -> quiz_questions.id`

2. **Criar Edge Function `list-all-users`**: Usa Admin API do Supabase para listar todos os usuarios (auth.users + profiles + subscriptions + roles). Requer autenticacao e role admin/master_admin.

3. **Criar Edge Function `system-health-check`**: Coleta metricas de saude do sistema e salva em `system_health_metrics`. Retorna relatorio consolidado.

---

## Problema 2: Tour do Dashboard reinicia sempre

### Causa raiz
No `DashboardTour.tsx`, o `onDestroyStarted` so marca como concluido se `!driverObj.hasNextStep()` (usuario completou todos os passos). Se o usuario fecha/pula, apenas `onSkip` eh chamado (que nao faz nada). Resultado: `dashboard_tour_completed` fica `false` para sempre.

Confirmado no banco: `dashboard_tour_completed: false` para o usuario `maicoln90@hotmail.com`.

### Solucao
- Modificar `DashboardTour.tsx`: **sempre** marcar `dashboard_tour_completed = true` no `onDestroyStarted`, independente se completou ou pulou.
- Aplicar a mesma correcao em `IntegrationsTour.tsx` (mesmo padrao de bug).
- Os outros tours (Analytics, CRM, Settings) precisam da mesma verificacao.

---

## Problema 3: Indexes para performance

### Analise
A maioria das tabelas ja tem indexes adequados. Tabelas que precisam de indexes adicionais:

| Tabela | Index faltante | Justificativa |
|--------|---------------|---------------|
| `profiles` | `email` | Busca por email no merge e login |
| `bunny_videos` | `user_id` | Filtro por usuario |
| `custom_form_fields` | `quiz_id` | Filtro por quiz |
| `quiz_results` | `quiz_id` | Join com quiz_responses |
| `validation_requests` | `user_id` | Filtro por usuario |
| `quiz_responses` | `result_id` | Join com quiz_results |
| `quiz_variants` | `quiz_id` | Filtro por quiz |

---

## Arquivos a criar/modificar

1. **Nova migracao SQL**: Foreign keys + indexes
2. `src/components/onboarding/DashboardTour.tsx`: Marcar como completo ao fechar
3. `src/components/onboarding/IntegrationsTour.tsx`: Mesma correcao
4. `supabase/functions/list-all-users/index.ts`: Nova edge function
5. `supabase/functions/system-health-check/index.ts`: Nova edge function
6. `supabase/config.toml`: Registrar novas funcoes

## Ordem de execucao
1. Migracao SQL (FKs + indexes) -- resolve CRM e queries com joins
2. Edge functions (list-all-users + system-health-check) -- resolve Admin
3. Fix dos tours -- resolve onboarding
4. Regenerar types.ts -- refletir novas FKs
