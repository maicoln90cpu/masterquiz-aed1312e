
# Plano: 3 Correcoes Finais

## 1. Corrigir Timezone para America/Sao_Paulo no `process-recovery-queue`

O `process-recovery-queue` usa `now.toTimeString().slice(0, 5)` que retorna horario UTC. Isso faz com que a comparacao com `allowed_hours_start/end` (que estao em horario de Brasilia) falhe. Por exemplo, as 17:35 BRT o servidor esta em 20:35 UTC, que e maior que `20:00` e bloqueia o envio.

A funcao `check-inactive-users` ja faz a conversao correta para `America/Sao_Paulo`. Vamos aplicar o mesmo padrao.

**Arquivo:** `supabase/functions/process-recovery-queue/index.ts`

Substituir linhas 25-30:
```typescript
// De (UTC):
const now = new Date();
const currentTime = now.toTimeString().slice(0, 5);

// Para (BRT):
const now = new Date();
const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
const currentHour = brasilTime.getHours();
const currentMinute = brasilTime.getMinutes();
const currentTimeMinutes = currentHour * 60 + currentMinute;

const [startH, startM] = (settings.allowed_hours_start?.slice(0, 5) || '09:00').split(':').map(Number);
const [endH, endM] = (settings.allowed_hours_end?.slice(0, 5) || '18:00').split(':').map(Number);

if (currentTimeMinutes < startH * 60 + startM || currentTimeMinutes > endH * 60 + endM) {
  return new Response(JSON.stringify({ message: 'Fora do horario', processed: 0 }), ...);
}
```

Tambem corrigir a contagem de `sentToday` (linha 33-34) que usa `setHours(0,0,0,0)` em UTC. Converter para meia-noite BRT:
```typescript
const todayBrasil = new Date(brasilTime);
todayBrasil.setHours(0, 0, 0, 0);
```

## 2. Contador Historico de Quizzes na `list-all-users`

Adicionar uma query ao `audit_logs` para contar quizzes deletados, ou melhor, usar uma abordagem mais simples: criar uma query que conta quizzes existentes + quizzes referenciados em `quiz_responses` (que sobrevivem a delecao se o quiz for deletado via soft-delete ou se houve respostas antes).

Abordagem mais confiavel: usar a tabela `audit_logs` que registra acoes de delecao, OU adicionar `quiz_count_total` como campo historico.

Como a forma mais simples e robusta: adicionar a contagem de `recovery_contacts` com `days_inactive_at_contact = 0` e `template_id` de `first_quiz` como proxy de "quizzes ativados historicamente".

Na verdade, a abordagem mais direta: usar a funcao RPC `get_user_quiz_stats` que ja existe no banco, mas ela so conta quizzes existentes. Vamos alterar a edge function `list-all-users` para tambem buscar do `audit_logs` onde `action = 'quiz_deleted'` ou similar.

Melhor: adicionar uma coluna `total_quizzes_created` no perfil via trigger no INSERT de quizzes. Mas isso requer migration + trigger.

Abordagem pragmatica escolhida: Contar `quiz_responses` agrupados por `user_id` via quizzes (que ja usam CASCADE - respostas sao deletadas junto). Entao o unico registro que sobrevive e no `audit_logs`. Vamos buscar de la.

**Arquivo:** `supabase/functions/list-all-users/index.ts`

Adicionar query paralela:
```typescript
adminClient.from("audit_logs")
  .select("resource_id, user_id")
  .eq("action", "quiz_delete")
  .in("user_id", userIds)
```

E somar com quizzes existentes para `total_quizzes_ever`.

Alternativa mais robusta (sem depender de audit_logs que podem nao ter essa acao registrada): adicionar uma tabela ou campo. Mas para implementacao rapida, vamos adicionar ao response do `list-all-users` o campo `stats.quiz_count_historical` buscando de `recovery_contacts` onde existe template de `first_quiz` (indica que pelo menos 1 quiz foi ativado).

Decisao final: A forma mais simples e confiavel e criar um trigger que incrementa um contador no `profiles` toda vez que um quiz e criado. Mas para nao criar infraestrutura extra agora, vamos usar a informacao disponivel: `recovery_contacts` com category `first_quiz` indica que o usuario ativou pelo menos 1 quiz. E combinamos com a contagem atual.

## 3. Processar os 4 Pendentes

Apos o deploy da correcao de timezone, invocar `send-welcome-message` diretamente para cada um dos 4 pendentes (ja que o `process-recovery-queue` pode estar fora do horario novamente).

## 4. RecoveryQueue.tsx - Verificar Fix Anterior

O fix anterior ja foi aplicado na ultima implementacao (busca separada de profiles). Nenhuma alteracao adicional necessaria.

---

## Ordem de Execucao

1. Corrigir timezone em `process-recovery-queue/index.ts`
2. Adicionar campo `quiz_count_historical` em `list-all-users/index.ts`
3. Deploy das 2 edge functions
4. Disparar mensagens para os 4 pendentes via `send-welcome-message`
5. Testar `process-recovery-queue` para confirmar que timezone funciona

## Arquivos Alterados

| Recurso | Alteracao |
|---------|----------|
| `supabase/functions/process-recovery-queue/index.ts` | Converter comparacao de horario para America/Sao_Paulo |
| `supabase/functions/list-all-users/index.ts` | Adicionar contagem historica de quizzes via recovery_contacts |
| Nenhum SQL | Sem migrations necessarias |
