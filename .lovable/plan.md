

## Plano: Melhorias em Campanhas + UNIQUE Constraint + Failed Contacts

### Diagnóstico

**1. "Erro ao iniciar campanha"**
A causa é a UNIQUE constraint `uq_recovery_user_template(user_id, template_id)`. Ao clicar "Retomar" ou "Recarregar Alvos", o `check-inactive-users` tenta inserir contacts que já existem (com o mesmo user_id + template_id), e o INSERT falha com `23505 duplicate key`. O fix é usar `upsert` com `ignoreDuplicates: true` em TODAS as campanhas (não só direct_campaign).

**2. Auto-regeneração de alvos**
Campanhas não-diretas devem regenerar alvos automaticamente. O `process-recovery-queue` (cron a cada 5 min) deve, quando não houver pendentes para uma campanha running, chamar `check-inactive-users` para aquela campanha. Isso substitui o botão "Recarregar Alvos".

**3. Substituir "Recarregar Alvos" por "Editar Campanha"**
Novo dialog para editar nome, descrição, critérios de audiência, agendamento. Template fica bloqueado (read-only).

**4. Failed contacts (retry_count >= 3) removidos da fila**
O `send-whatsapp-recovery` já marca como `failed` após 3 tentativas. Os 5 contacts com status `failed` já estão fora da fila (não são pegos pelo `SELECT ... WHERE status = 'pending'`). O card da campanha já mostra "Falhas: 5". Isso já funciona corretamente.

**5. Sobre Sara Narciso (5511967561784)**
Ela EXISTE no banco: `profiles` com id `24ea8f03-8447-45b4-b806-3f84c44d101a`, email `snarcizodesouza689@gmail.com`, `auth.users` ativa, `deleted_at = null`. Tem 2 recovery_contacts com status `sent`. Ela está no histórico. Se o admin não conseguiu encontrar, provavelmente usou formato diferente na busca (ex: com espaços/hífens). O fix de normalização de busca que fizemos na sessão anterior deve resolver isso. A blacklist foi adicionada manualmente (não pelo webhook) — o webhook realmente não está recebendo eventos da Evolution API.

### Correções

#### 1. `check-inactive-users`: usar `ignoreDuplicates` sempre
Mudar o bloco de insert (linhas 348-360) para sempre usar `upsert` com `ignoreDuplicates: true`, independente de `directCampaign`. Isso resolve o erro 23505.

#### 2. `process-recovery-queue`: auto-regenerar alvos
Após processar o batch, verificar se há campanhas `running` sem contacts `pending`. Para cada uma (exceto `direct_campaign`), chamar `check-inactive-users` para regenerar alvos.

#### 3. `RecoveryCampaigns.tsx`: substituir "Recarregar Alvos" por "Editar Campanha"
- Novo dialog com campos editáveis: nome, descrição, critérios de audiência, agendamento
- Template aparece como read-only (não editável)
- Salvar via `UPDATE recovery_campaigns`

#### 4. Mensagem de erro mais clara no `send-whatsapp-recovery`
O `error_message` mostra `[object Object]` em vez do texto real. O `errorDetail` precisa ser melhor stringificado quando `data` é um objeto complexo.

### Arquivos a modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/check-inactive-users/index.ts` | Usar `upsert ignoreDuplicates` sempre (não só direct_campaign) |
| `supabase/functions/process-recovery-queue/index.ts` | Após processar, auto-regenerar alvos para campanhas running sem pendentes |
| `supabase/functions/send-whatsapp-recovery/index.ts` | Fix `[object Object]` no error_message |
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Substituir "Recarregar Alvos" por "Editar Campanha" dialog |

### Resposta à pergunta 3

Sim, com a constraint UNIQUE `(user_id, template_id)`, cada usuário só recebe cada template **uma vez**. Se o usuário ficou 10 dias inativo e recebeu o template "Primeiro Contato", ele nunca mais entra na fila para esse mesmo template. Para recontatar, seria necessário criar uma nova campanha com um template diferente, ou usar "Disparo Direto" (que usa `upsert`). A auto-regeneração adicionará apenas novos usuários que atendam aos critérios e que ainda não tenham recebido aquele template.

