

# Diagnóstico e Correção — Bug Crítico no Webhook Kiwify

## O Problema (em linguagem simples)

Quando alguém paga pelo MasterQuizz, a Kiwify envia um aviso (webhook) dizendo "fulano pagou". O sistema então procura esse email na lista de usuários para ativar o plano.

**O bug**: O sistema pede a lista de usuários mas **só recebe os primeiros 50** (limite padrão da API do Supabase). Como o projeto já tem **449 usuários**, qualquer pessoa que não esteja nos 50 primeiros é tratada como "não encontrada" — mesmo estando cadastrada.

**Impacto**: Todo pagamento de usuários fora dos 50 primeiros falha silenciosamente. O cliente paga, não recebe acesso, pede reembolso.

## A Correção

### Mudança única no arquivo `supabase/functions/kiwify-webhook/index.ts`

**Antes (linha 78-79)**:
```typescript
const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
const user = authUsers?.users?.find(u => u.email?.toLowerCase() === buyerEmail);
```
Busca só 50 usuários e tenta achar o email nessa lista parcial.

**Depois**:
```typescript
// Buscar diretamente por email — sem limite de paginação
const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 1,
  filter: buyerEmail  // filtra direto no servidor
});
const user = users?.[0] ?? null;

// Fallback: buscar na tabela profiles se o filtro não funcionar
if (!user) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', buyerEmail)
    .maybeSingle();
  if (profile) {
    // Usar o profile.id como user.id
  }
}
```

A API `listUsers` com `filter` não é 100% confiável (filtro parcial por email). A solução mais robusta é **não usar `listUsers` de jeito nenhum** e buscar direto na tabela `profiles`:

```typescript
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('id, email')
  .eq('email', buyerEmail)
  .maybeSingle();

if (!profile) {
  // User not found — log como pending
}
// Usar profile.id para todas as operações
```

### Ação adicional: Reprocessar webhooks pendentes

Após o deploy da correção, reprocessar os 5 webhooks pendentes do `tvemanuel342@gmail.com`:
- O mais recente relevante é `order_approved` (14:50) — ativar plano `paid`
- Os `subscription_canceled` e `order_refunded` vieram depois — manter como `free`
- Na prática: o usuário já pediu reembolso, então o plano deve ficar `free`
- Mas a correção garante que **o próximo cliente não terá o mesmo problema**

### Verificar se há outros usuários afetados

Consultar `webhook_logs` com `status = 'pending'` e `error_message = 'User not found'` para encontrar outros clientes que pagaram mas não receberam acesso.

## Resumo da Correção

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Busca de usuário | `listUsers()` — max 50 | Query direta na tabela `profiles` — sem limite |
| Usuários afetados | Todos após os 50 primeiros | Nenhum |
| Risco | Perda de clientes | Zero |

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/kiwify-webhook/index.ts` | Trocar `listUsers()` por query em `profiles` |

## Checklist pós-implementação
- [ ] Deploy da Edge Function
- [ ] Testar com curl simulando um webhook com email existente
- [ ] Verificar logs para confirmar que encontra o usuário
- [ ] Consultar webhook_logs pendentes para identificar outros clientes afetados

## Melhoria futura sugerida
- Criar um **cron job** que reprocessa automaticamente webhooks com `status = 'pending'` e `error_message = 'User not found'`, verificando periodicamente se o usuário já se cadastrou

