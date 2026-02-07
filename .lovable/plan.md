

# Plano: Login com Recuperacao de Conta + RLS + Auditoria do Banco

## Resumo do Diagnostico

Apos analise detalhada do banco de dados:

- **24 perfis importados, 0 usuarios no auth.users** -- todos os perfis sao orfaos (importados do projeto antigo sem auth)
- **maicoln90@hotmail.com** existe na tabela `profiles` mas NAO existe no `auth.users`, por isso o login falha
- **47 tabelas sem RLS** -- qualquer pessoa com a URL do Supabase pode ler/escrever dados
- **Nenhuma foreign key** entre tabelas (dados nao tem integridade referencial forcada)
- Dados consistentes: quiz_questions, quiz_results e quiz_responses todos referenciam quizzes validos

---

## Parte 1: Fluxo de Login para Usuarios Importados

### Problema
O usuario tenta logar com email/senha, mas como nao existe entrada no `auth.users`, recebe "Email ou senha incorretos". O usuario nao sabe que precisa se recadastrar.

### Solucao
Quando o login falhar com "Invalid login credentials":

1. Verificar no banco se existe um perfil com aquele email (via consulta publica ou edge function)
2. Se existir perfil orfao, abrir um modal especial dizendo: "Encontramos sua conta! Defina uma nova senha para continuar"
3. O modal coleta nova senha + confirmacao
4. Chamar `supabase.auth.signUp()` com o email e nova senha
5. Apos signup, o merge automatico (ja implementado) vincula os dados antigos ao novo auth user

### Mudancas no Login.tsx
- Adicionar estado `showMigrateModal` e `migrateEmail`
- No `handleLogin`, ao detectar erro de credenciais, chamar edge function `check-imported-user` para verificar se email existe em profiles
- Se existir, abrir modal de migracao ao inves do toast de erro
- Modal permite criar senha nova e chama `signUp`

### Nova Edge Function: `check-imported-user`
- Recebe email no body
- Usa service role para verificar se existe perfil com esse email SEM entrada correspondente no auth.users
- Retorna `{ exists: true/false }` (sem expor dados senssiveis)
- Rate limiting para evitar enumeracao de emails

---

## Parte 2: RLS (Row Level Security) em Todas as Tabelas

### Migracacao SQL que habilita RLS e cria politicas para todas as 47 tabelas

Categorias de politicas:

**Tabelas do usuario (user_id = auth.uid()):**
- `profiles` -- SELECT/UPDATE proprio perfil (id = auth.uid())
- `quizzes` -- CRUD pelo dono
- `quiz_questions` -- CRUD via join com quizzes
- `quiz_results` -- CRUD via join com quizzes
- `quiz_form_config` -- CRUD via join com quizzes
- `custom_form_fields` -- CRUD via join com quizzes
- `quiz_translations` -- CRUD via join com quizzes
- `quiz_question_translations` -- CRUD via join com quizzes
- `quiz_variants` -- CRUD via join com quizzes
- `quiz_analytics` -- SELECT via join com quizzes
- `quiz_step_analytics` -- SELECT via join com quizzes
- `quiz_responses` -- SELECT via join com quizzes
- `quiz_tags` -- CRUD pelo dono
- `quiz_tag_relations` -- CRUD via join com quizzes
- `user_subscriptions` -- SELECT proprio
- `user_roles` -- SELECT proprio
- `user_webhooks` -- CRUD proprio
- `user_integrations` -- CRUD proprio
- `notification_preferences` -- CRUD proprio
- `support_tickets` -- CRUD proprio
- `ticket_messages` -- CRUD via join com tickets
- `ai_quiz_generations` -- SELECT proprio
- `bunny_videos` -- CRUD proprio
- `validation_requests` -- CRUD proprio
- `audit_logs` -- INSERT proprio, SELECT para admins
- `user_onboarding` -- CRUD proprio
- `video_analytics` -- SELECT proprio
- `video_usage` -- SELECT proprio
- `scheduled_deletions` -- SELECT proprio
- `integration_logs` -- SELECT proprio
- `webhook_logs` -- SELECT proprio

**Tabelas publicas (leitura para todos):**
- `subscription_plans` -- SELECT para todos (catalogo de planos)
- `quiz_templates` -- SELECT para todos (templates publicos)
- `landing_content` -- SELECT para todos
- `landing_ab_tests` -- SELECT para todos

**Tabelas publicas (escrita anonima controlada):**
- `quiz_responses` -- INSERT anonimo (respondentes de quiz)
- `quiz_step_analytics` -- INSERT anonimo
- `ab_test_sessions` -- INSERT anonimo
- `landing_ab_sessions` -- INSERT/UPDATE anonimo
- `cookie_consents` -- INSERT anonimo
- `rate_limit_tracker` -- INSERT/UPDATE anonimo

**Tabelas admin-only:**
- `master_admin_emails` -- SELECT/INSERT/DELETE para master_admin
- `recovery_settings` -- CRUD para admin
- `recovery_templates` -- CRUD para admin
- `recovery_campaigns` -- CRUD para admin
- `recovery_contacts` -- CRUD para admin
- `recovery_blacklist` -- CRUD para admin
- `system_health_metrics` -- INSERT/SELECT para admin
- `system_settings` -- CRUD para admin

Usa a funcao `has_role()` ja existente para verificar roles de admin.

---

## Parte 3: Integridade do Banco de Dados

### Problemas encontrados
1. **24 perfis orfaos** (sem auth.users correspondente) -- esperado, serao resolvidos pelo merge na Parte 1
2. **Sem foreign keys** -- os dados estao consistentes mas sem protecao de integridade referencial

### Acoes
- Adicionar foreign keys criticas:
  - `quizzes.user_id -> auth.users(id) ON DELETE CASCADE`
  - `quiz_questions.quiz_id -> quizzes(id) ON DELETE CASCADE`
  - `quiz_results.quiz_id -> quizzes(id) ON DELETE CASCADE`
  - `quiz_form_config.quiz_id -> quizzes(id) ON DELETE CASCADE`
  - `quiz_responses.quiz_id -> quizzes(id) ON DELETE CASCADE`
  - `user_subscriptions.user_id -> auth.users(id) ON DELETE CASCADE`
  - `user_roles.user_id -> auth.users(id) ON DELETE CASCADE`
  - E demais tabelas com user_id/quiz_id

**NOTA**: As foreign keys para `auth.users` NAO podem ser adicionadas agora porque existem 24 perfis orfaos. Primeiro os usuarios precisam migrar (Parte 1), depois podemos adicionar as FKs. As FKs entre tabelas publicas (quiz_id etc) podem ser adicionadas imediatamente.

---

## Detalhes Tecnicos

### Arquivos a criar/modificar:
1. `supabase/functions/check-imported-user/index.ts` -- nova edge function
2. `src/pages/Login.tsx` -- adicionar modal de migracao
3. `supabase/config.toml` -- registrar nova funcao
4. Nova migracao SQL -- RLS + politicas para todas as tabelas
5. Nova migracao SQL -- foreign keys entre tabelas (quiz_id refs)

### Ordem de execucao:
1. Migracao RLS (prioridade maxima -- seguranca)
2. Edge function check-imported-user
3. Modal de migracao no Login.tsx
4. Migracao de foreign keys (somente quiz_id, nao user_id por enquanto)

