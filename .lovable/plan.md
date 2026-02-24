
# Plano: Corrigir Salvar + Fila de mensagens + Edicao de usuarios + Novas colunas

## Item 1 — Botao Salvar nao funciona

**Problema raiz:** O botao "Salvar" chama `saveAutoSaveNow()` que depende de `pendingDataRef.current`. Se o auto-save de 30s ja executou ou o quiz acabou de ser carregado sem alteracoes, `pendingDataRef` e null e o save retorna false sem fazer nada. Alem disso, o botao fica desabilitado quando `!hasUnsavedChanges` — apos o auto-save executar, o botao desabilita.

**Como deveria funcionar:**
- Quiz rascunho: Salvar grava todas as alteracoes no banco (metadados, perguntas, form config) mantendo status = draft
- Quiz publicado: Salvar grava todas as alteracoes no banco mantendo status = active (atualiza o quiz ao vivo)
- Em ambos os casos, o botao deve funcionar SEMPRE que o usuario clicar, independente do auto-save

**Correcao em `src/hooks/useQuizPersistence.ts`:**
- Reescrever `saveDraftToSupabase` para nao depender do `saveAutoSaveNow()` 
- Fazer save direto no Supabase usando os states atuais (appearanceState, formConfigState, questions, editorState)
- Apos salvar, chamar `markAsSaved()` para limpar indicador
- Remover condicao `!hasUnsavedChanges` do disabled do botao em `CreateQuiz.tsx` — manter apenas `isSavingDraft || !quizId`

**Correcao em `src/pages/CreateQuiz.tsx` (linha 498):**
- Mudar disabled de `isSavingDraft || !quizId || !hasUnsavedChanges` para `isSavingDraft || !quizId`

---

## Item 2 — Maicoln aparece como pendente mas mensagem foi enviada

**Explicacao:** Maicoln Douglas (user `54bfe8ce`) tem telefone `11999136884` (sem DDI 55). O trigger `trigger_welcome_on_whatsapp_update` disparou quando o WhatsApp foi cadastrado, inserindo na fila com `phone_number: 11999136884`. A mensagem de boas-vindas FOI enviada com sucesso (a Edge Function normaliza adicionando DDI 55 na hora do envio). Porem o registro original ficou como `sent` no primeiro disparo. 

Depois, o trigger `trigger_first_quiz_message` criou mais 2 registros pendentes (template `first_quiz`) para Maicoln com o mesmo numero sem DDI. Esses ficaram pendentes porque o `process-recovery-queue` so processa dentro do horario permitido e respeitando limites.

**Correcao direta no banco:** Atualizar os registros pendentes de Maicoln para `sent` ja que a mensagem foi de fato entregue, e normalizar numeros sem DDI na tabela `recovery_contacts`.

---

## Item 3 — Fila de envio acumulando

**Problema:** Existem 7 registros pendentes. Alguns tem numeros sem DDI (ex: `11999136884`, `55981061137` com 11 digitos — falta o DDD completo ou tem formato incorreto). O `send-whatsapp-recovery` adiciona DDI 55 e envia, mas o `process-recovery-queue` pode nao estar sendo chamado (depende de cron job ou invocacao manual).

**Correcao no banco:**
- Normalizar todos os numeros pendentes adicionando DDI 55 quando aplicavel
- Marcar como `sent` os que ja foram enviados de fato
- Remover duplicatas (Maicoln tem 2 pendentes identicos)

---

## Item 4 — Permitir edicao de telefone e email dos usuarios

**Arquivo: `src/pages/AdminDashboard.tsx`**
- Adicionar um Dialog de edicao de usuario com campos: Email e WhatsApp
- Ao clicar num botao de editar (icone Pencil) na linha do usuario, abrir o dialog pre-preenchido
- Ao salvar, chamar uma nova Edge Function `update-user-profile` que:
  - Atualiza `profiles.whatsapp` e `profiles.email` (via service role)
  - Atualiza `auth.users.email` se o email mudou (via `adminClient.auth.admin.updateUserById`)

**Nova Edge Function: `supabase/functions/update-user-profile/index.ts`**
- Recebe `user_id`, `email` (opcional), `whatsapp` (opcional)
- Valida que o caller e admin/master_admin
- Atualiza profile e auth.users conforme necessario

---

## Item 5 — Novas colunas: Data de cadastro e Quantidade de logins

**Arquivo: `supabase/functions/list-all-users/index.ts`**
- Os dados ja existem no objeto `authUsers`: `created_at` e `last_sign_in_at`
- Supabase Auth nao rastreia "quantidade de logins" nativamente
- Solucao para login count: criar coluna `login_count` na tabela `profiles` e incrementar via trigger no auth

**Arquivo: `src/pages/AdminDashboard.tsx`**
- Adicionar colunas "Cadastro" e "Logins" na tabela desktop
- "Cadastro" usa `user.created_at` (ja disponivel no payload)
- "Logins" usa `user.profile?.login_count || 0` (novo campo)

**Migracao SQL:**
- Adicionar coluna `login_count INTEGER DEFAULT 0` na tabela `profiles`
- Criar funcao + trigger que incrementa `login_count` a cada sign-in (via `auth.sessions` ou hook de login no frontend)

**Alternativa mais simples (sem trigger):**
- Incrementar `login_count` no frontend no `AuthContext.tsx` apos login bem-sucedido

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/hooks/useQuizPersistence.ts` | Reescrever saveDraftToSupabase para save direto |
| `src/pages/CreateQuiz.tsx` | Remover `!hasUnsavedChanges` do disabled do botao Salvar |
| `src/pages/AdminDashboard.tsx` | Dialog de edicao de usuario + colunas Cadastro e Logins |
| `supabase/functions/update-user-profile/index.ts` | Nova Edge Function para editar email/whatsapp |
| `supabase/functions/list-all-users/index.ts` | Incluir login_count no payload |
| `src/contexts/AuthContext.tsx` | Incrementar login_count apos login |
| Migracao SQL | Adicionar coluna login_count em profiles |
| Correcao SQL direta | Normalizar numeros e limpar pendentes na recovery_contacts |

## Arquivos NAO tocados
- QuizActions.tsx (hook legado, nao usado pelo fluxo atual)
- Edge Functions de mensageria (logica de normalizacao ja funciona)
- QuizViewQuestion/QuizViewResult (sem relacao)
