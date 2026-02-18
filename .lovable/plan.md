
# Plano: Correcao de 3 Problemas (Welcome, N/A, Limites)

## Diagnostico

### Problema 1: Erro HTTP 400 ao enviar mensagens de boas-vindas

**Causa raiz (dupla):**

a) **Normalizacao de telefone duplica o codigo de pais.** O numero `55219886753` (11 digitos, ja com DDI 55) e tratado como numero sem DDI pela funcao `normalizePhoneNumber`, que adiciona `55` novamente, resultando em `5555219886753` — numero invalido rejeitado pela Evolution API com HTTP 400.

b) **Registros duplicados na fila.** O trigger `trigger_welcome_message` insere na `recovery_contacts` SEM `template_id`, e depois a funcao `send-welcome-message` (chamada via `pg_net`) insere OUTRO registro COM `template_id`. Isso gera duplicatas (um "pending" sem template e um "sent" ou "failed" com template).

### Problema 2: Nome do usuario aparecendo como "N/A"

**Causa raiz:** A politica RLS da tabela `profiles` so permite que o role `authenticated` veja **seu proprio perfil** (`id = auth.uid()`). A politica "Service can manage profiles" aplica-se exclusivamente ao role `service_role`. Quando o admin busca perfis de outros usuarios pelo frontend (que usa o client autenticado), a query retorna vazio para todos exceto o proprio admin.

### Problema 3: Novos usuarios criados com quiz_limit = 3

**Causa raiz:** A funcao trigger `handle_new_user_subscription()` esta com valores hardcoded:
```sql
VALUES (NEW.id, 'free', 'active', 3, 100)
```
O plano "Gratuito" na tabela `subscription_plans` define `quiz_limit = 1`, mas o trigger ignora essa tabela e usa o valor antigo `3`.

---

## Correcoes

### 1. Corrigir `normalizePhoneNumber` nas Edge Functions

Melhorar a logica para detectar quando o numero ja comeca com `55` (DDI Brasil):

```typescript
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  // Se ja comeca com 55 e tem 12-13 digitos, ja tem DDI
  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }
  // Numero brasileiro sem DDI (10-11 digitos)
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}
```

**Arquivos:** `supabase/functions/send-welcome-message/index.ts` e `supabase/functions/send-whatsapp-recovery/index.ts`

### 2. Corrigir triggers para evitar duplicatas e incluir template_id

Atualizar os 3 triggers (`trigger_welcome_message`, `trigger_welcome_on_whatsapp_update`, `trigger_first_quiz_message`) para:
- Buscar o `template_id` correto antes de inserir
- Usar `ON CONFLICT (user_id, phone_number)` ou verificar existencia antes de inserir
- Evitar que o `send-welcome-message` insira duplicata (ja que o trigger ja inseriu)

**Tipo:** SQL Migration

### 3. Adicionar politica RLS para admins verem perfis

```sql
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master_admin'::app_role)
  );
```

**Tipo:** SQL Migration

### 4. Corrigir `handle_new_user_subscription` para ler da tabela de planos

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  plan_record RECORD;
BEGIN
  SELECT quiz_limit, response_limit 
  INTO plan_record
  FROM subscription_plans 
  WHERE plan_type = 'free' 
  LIMIT 1;

  INSERT INTO public.user_subscriptions (
    user_id, plan_type, status, quiz_limit, response_limit
  ) VALUES (
    NEW.id, 'free', 'active', 
    COALESCE(plan_record.quiz_limit, 1), 
    COALESCE(plan_record.response_limit, 100)
  );
  RETURN NEW;
END;
$function$;
```

**Tipo:** SQL Migration

### 5. Corrigir subscricoes existentes com limites errados

```sql
UPDATE user_subscriptions us
SET quiz_limit = sp.quiz_limit,
    response_limit = sp.response_limit
FROM subscription_plans sp
WHERE us.plan_type = sp.plan_type
  AND us.plan_type = 'free'
  AND us.quiz_limit != sp.quiz_limit;
```

**Tipo:** SQL Migration (junto com item 4)

### 6. Limpar registros duplicados/orfaos na fila

Cancelar os registros pendentes sem template_id (criados pelos triggers antigos) que ja tem um correspondente "sent" ou "failed" com template_id.

**Tipo:** SQL Migration

---

## Ordem de Execucao

1. SQL Migration: RLS profiles para admins (corrige N/A)
2. SQL Migration: Corrigir `handle_new_user_subscription` + atualizar subscricoes existentes
3. SQL Migration: Atualizar triggers para incluir template_id e evitar duplicatas
4. SQL Migration: Limpar registros orfaos na fila
5. Edge Functions: Corrigir `normalizePhoneNumber` em ambas as funcoes
6. Deploy e testar

## Arquivos Alterados

| Recurso | Alteracao |
|---------|----------|
| SQL Migration | RLS policy "Admins can view all profiles" |
| SQL Migration | `handle_new_user_subscription()` le da tabela `subscription_plans` |
| SQL Migration | UPDATE `user_subscriptions` existentes para limites corretos |
| SQL Migration | Atualizar 3 triggers com `template_id` |
| SQL Migration | Limpar duplicatas na `recovery_contacts` |
| `supabase/functions/send-welcome-message/index.ts` | Fix `normalizePhoneNumber` |
| `supabase/functions/send-whatsapp-recovery/index.ts` | Fix `normalizePhoneNumber` |
