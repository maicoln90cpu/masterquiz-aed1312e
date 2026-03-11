

## Plano: Cards Express/Manual, Teste Bot IA e Auto-Blacklist "SAIR"

---

### 1. Separar "Quizzes Criados" em dois cards: Express vs Manual

**Problema**: O card "Quizzes Criados" mostra um total único. O usuário quer distinguir quizzes criados via modo express (`creation_source = 'express_auto'`) dos criados manualmente.

**Solução**: A Edge Function `list-all-users` já retorna todos os quizzes com `user_id, id, is_public, status` (linha 73), mas **não** inclui `creation_source`. Precisamos:

1. **Modificar `list-all-users/index.ts`**: Adicionar `creation_source` ao select de quizzes (linha 73) e criar dois contadores separados: `express_quiz_count` e `manual_quiz_count` por usuário.

2. **Modificar `AdminDashboard.tsx`**:
   - Substituir o card "Quizzes Criados" por dois cards: "Quizzes Express" e "Quizzes Manuais"
   - Derivar os totais do `allUsersData` no `useEffect` existente (linhas 202-216)
   - Ajustar o grid para acomodar 5 cards (ou manter 4 substituindo o antigo por 2 novos)

---

### 2. Bot IA não responde ao teste

**Diagnóstico**: Os logs das Edge Functions `evolution-webhook` e `whatsapp-ai-reply` estão **vazios** — as funções **não foram deployed** no Supabase remoto. O código foi criado localmente mas precisa de deploy.

**Solução**:
1. **Deploy das funções**: `evolution-webhook` e `whatsapp-ai-reply` precisam ser deployadas
2. **Verificar tabelas**: As tabelas `whatsapp_conversations` e `whatsapp_ai_settings` precisam existir (migration criada mas pode não ter rodado)
3. **Inserir settings iniciais**: A tabela `whatsapp_ai_settings` precisa de pelo menos um registro com `is_enabled = true` para o bot funcionar
4. **Testar fluxo**: Após deploy, enviar mensagem respondendo a um template de recuperação já enviado (o bot só responde a quem já tem um `recovery_contact` com status `sent/delivered/read`)

**Nota para o usuário**: Para testar, é necessário que o número testado tenha um registro em `recovery_contacts` com status `sent`, `delivered` ou `read`. Se o teste foi feito sem esse contexto, o webhook não dispara a IA.

---

### 3. Auto-blacklist quando usuário envia "SAIR"

**Solução**: Modificar `evolution-webhook/index.ts` para detectar a palavra "SAIR" (case-insensitive) em mensagens recebidas e:

1. **Antes de qualquer processamento**: Checar se `messageText.trim().toUpperCase() === 'SAIR'`
2. **Se sim**:
   - Inserir na `recovery_blacklist` com `reason = 'opt_out'` e `notes = 'Auto opt-out via SAIR'`
   - Buscar `user_id` do `recovery_contacts` ou `profiles` pelo phone_number
   - Enviar mensagem de confirmação via Evolution API: "Você foi removido da nossa lista de mensagens. Para voltar a receber, envie uma nova mensagem."
   - **Não** disparar o bot IA
   - Atualizar o `recovery_contact` para status `opted_out`
3. **No `whatsapp-ai-reply`**: Adicionar check de blacklist no início (antes de processar)
4. **Reativação**: Quando o usuário enviar qualquer mensagem futura (que não seja "SAIR") e estiver na blacklist, **não** remover automaticamente — manter blacklist até remoção manual, conforme solicitado

**Arquivos a modificar/criar**:

| Arquivo | Ação |
|---|---|
| `supabase/functions/list-all-users/index.ts` | Adicionar `creation_source` ao select de quizzes + novos contadores |
| `src/pages/AdminDashboard.tsx` | Substituir card único por 2 cards (Express + Manual) |
| `supabase/functions/evolution-webhook/index.ts` | Detectar "SAIR", inserir blacklist, enviar confirmação |
| `supabase/functions/whatsapp-ai-reply/index.ts` | Check blacklist no início |
| Deploy | `evolution-webhook` + `whatsapp-ai-reply` |

