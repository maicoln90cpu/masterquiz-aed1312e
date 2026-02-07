

# Plano: Edge Function de Merge + Fix de Types + AuthContext

## Problema
1. O arquivo `types.ts` do Supabase esta vazio (Tables = `never`), causando todos os erros de build. Ele precisa ser regenerado para refletir as tabelas reais do banco.
2. Voce precisa de uma Edge Function `merge-user-data` que, ao fazer login, vincula dados do perfil antigo (importado) ao novo usuario.
3. O `AuthContext.tsx` precisa chamar essa funcao automaticamente no login.

## Etapas

### 1. Regenerar types.ts
- Atualizar `src/integrations/supabase/types.ts` com as definicoes corretas de todas as tabelas existentes no banco (profiles, quizzes, quiz_questions, quiz_responses, etc.)
- Isso corrige todos os ~100+ erros de build de uma vez

### 2. Criar Edge Function `merge-user-data`
- Criar `supabase/functions/merge-user-data/index.ts` com o codigo que voce forneceu, adaptado com:
  - CORS headers corretos (incluindo headers extras do Supabase client)
  - Validacao JWT usando `getClaims()` ao inves de `getUser()` (mais eficiente)
  - Service role client para operacoes administrativas de merge
  - Logica de merge: buscar perfil antigo pelo email, atualizar user_id em todas as tabelas relacionadas, merge de campos do perfil, deletar perfil orfao

### 3. Atualizar config.toml
- Adicionar configuracao da funcao:
```toml
[functions.merge-user-data]
verify_jwt = false
```

### 4. Atualizar AuthContext.tsx
- Adicionar ref `mergeAttempted` para evitar chamadas duplicadas
- Adicionar funcao `attemptMerge` que invoca a edge function
- Chamar `attemptMerge` quando `event === 'SIGNED_IN'` no `onAuthStateChange`
- Mostrar toast de sucesso quando dados forem restaurados

## Detalhes Tecnicos

### Tabelas que serao atualizadas no merge:
- `quizzes` - user_id
- `user_subscriptions` - user_id
- `quiz_tags` - user_id
- `user_webhooks` - user_id
- `user_integrations` - user_id
- `notification_preferences` - user_id
- `support_tickets` - user_id
- `ai_quiz_generations` - user_id
- `bunny_videos` - user_id
- `audit_logs` - user_id
- `validation_requests` - user_id
- `user_roles` - tratamento especial (conflito de duplicatas)
- `profiles` - merge de campos + delete do antigo

### Fluxo do merge:
1. Usuario faz login com email
2. AuthContext detecta `SIGNED_IN`
3. Chama edge function `merge-user-data`
4. Edge function busca perfil com mesmo email mas ID diferente
5. Se encontrar, atualiza todos os registros para o novo user_id
6. Merge campos do perfil antigo para o novo
7. Deleta perfil orfao
8. Retorna resultado

### Nota sobre types.ts:
O arquivo sera regenerado automaticamente pelo sistema Lovable ao sincronizar com o Supabase. Os erros de build serao resolvidos com essa regeneracao.

