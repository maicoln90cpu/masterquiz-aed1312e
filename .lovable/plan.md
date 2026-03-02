

## Plano: Corrigir nome do evento para `AccountCreated` + resetar retroativos

### Problema
O hook `useAccountCreatedEvent.ts` dispara `event: 'account_created'` (snake_case) no dataLayer, mas o GTM/Google Ads espera `AccountCreated` (PascalCase). Resultado: 71 usuários já marcados como "enviados" dispararam o evento com nome errado — o Google Ads não reconheceu nenhum.

### Correção

**1. Corrigir nome do evento (`src/hooks/useAccountCreatedEvent.ts`)**
- Linha 28: `event: 'account_created'` → `event: 'AccountCreated'`
- Linha 32: Atualizar log para refletir o nome correto

**2. Resetar todos os perfis para re-disparar (`UPDATE via SQL`)**
```sql
UPDATE profiles SET account_created_event_sent = false;
```
Isso faz com que todos os 139 usuários (71 marcados + 68 pendentes) re-disparem o evento com o nome correto `AccountCreated` no próximo login via caminho retroativo.

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/hooks/useAccountCreatedEvent.ts` | `account_created` → `AccountCreated` no dataLayer push |
| SQL (UPDATE) | Reset `account_created_event_sent = false` em todos os profiles |

