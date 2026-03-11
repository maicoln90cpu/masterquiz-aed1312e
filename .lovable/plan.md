

## Plano: Re-disparar AccountCreated dos últimos 5 dias

### Problema
O GTM estava configurado com evento divergente e não capturou os disparos de `AccountCreated` dos últimos 5 dias.

### Solução
Resetar a flag `account_created_event_sent = false` nos perfis criados nos últimos 5 dias. O hook `useAccountCreatedEvent` já possui lógica retroativa — ao detectar `account_created_event_sent = false`, re-dispara o evento automaticamente no próximo login do usuário.

### Execução
Uma única query SQL via insert tool:

```sql
UPDATE profiles
SET account_created_event_sent = false
WHERE created_at >= now() - interval '5 days';
```

### Comportamento esperado
- Cada usuário dos últimos 5 dias, ao logar novamente, terá o evento `AccountCreated` re-disparado no dataLayer
- O hook marca `account_created_event_sent = true` após o disparo, evitando duplicação futura
- O `sessionStorage` guard é por sessão, então basta o usuário abrir uma nova sessão

### Arquivos modificados
Nenhum arquivo de código precisa ser alterado — apenas o UPDATE no banco.

