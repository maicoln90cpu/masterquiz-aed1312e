

## Plano: 5 Correções no Sistema de Recuperação

### Problemas Identificados

1. **Campanha não respeita delays** — O `process-recovery-queue` usa delays (`120-300s`), mas ao clicar "Processar Fila" manualmente, a Edge Function roda no servidor e aplica delays lá. O problema é que o `batch_size=15` e `message_delay_seconds=120` significam que a function roda por até 30 min (pode dar timeout). As 3 mensagens rápidas foram enviadas porque `send-whatsapp-recovery` é chamada em loop e os primeiros envios antes do delay são imediatos.

2. **Fila para de rodar ao sair da aba** — Não existe cron job para `process-recovery-queue`. O processamento só acontece quando o admin clica "Processar Fila". Precisa de um cron job automático.

3. **Contadores da campanha não atualizam** — Nenhuma Edge Function atualiza `sent_count`, `delivered_count`, `responded_count` na tabela `recovery_campaigns`. Os contadores ficam em 0 permanentemente.

4. **Mensagens "primeiro contato" não aparecem no histórico** — O histórico filtra `recovery_contacts` corretamente, mas os contatos `first_contact` têm status `sent` sem `message_sent` preenchido — o `send-whatsapp-recovery` preenche `message_sent` ao enviar, então os que foram enviados devem aparecer. Verificando os dados, os 4 `sent` da campanha atual aparecem sem `message_sent=nil` na query inicial — o campo só é preenchido após o envio. Se o histórico filtra por status que exclui `pending`, os enviados devem aparecer. Vou verificar se o join com `profiles` está quebrando.

5. **Bot IA não responde** — Os dados mostram que o bot respondeu em 11/03 às 02:56 ("Olá, teste do bot" → IA respondeu). Porém mensagens posteriores não foram processadas. O contact `8f2469eb` tem status `responded`. Quando uma nova mensagem chega, o webhook busca contacts com status `['sent', 'delivered', 'read', 'responded']` — isso está correto. MAS se o usuário tem **múltiplos** contacts com status `sent` (há 4 com status `sent` para esse número), o webhook pega o mais recente, que pode ser diferente do que o bot respondeu antes. O `user_id` pode estar null se o contact não tem user_id linkado.

   Investigação mais profunda: **não há logs do `evolution-webhook`** — o webhook pode não estar sendo chamado pela Evolution API, ou a function pode não estar deployed.

---

### Correções Propostas

#### 1. Cron Job para processamento automático da fila
- Criar cron job `process-recovery-queue` que roda a cada 5 minutos via `pg_cron` + `pg_net`
- O `process-recovery-queue` já tem todas as salvaguardas (horário, limites diários/hora)
- Isso resolve o problema de parar ao sair da aba

#### 2. Atualizar contadores da campanha automaticamente
- Modificar `send-whatsapp-recovery` para, após enviar com sucesso, incrementar `sent_count` na `recovery_campaigns` usando o `campaign_id` do contact
- Modificar `evolution-webhook` para atualizar `delivered_count`, `read_count` (messages.update) e `responded_count` (messages.upsert) na campanha associada
- Alternativa mais simples e robusta: criar uma query que conta dinamicamente os status dos contacts por campanha, e usar isso no frontend (evita inconsistências)

#### 3. Fix do bot IA — deploy + garantir continuidade
- O webhook precisa estar deployed. Verificar se `evolution-webhook` está na lista de Edge Functions deployadas
- O bot funcionou uma vez (02:56) mas depois parou — pode ser que mensagens subsequentes chegaram quando o `recovery_contact` mais recente já tinha status `responded`, e a busca `.limit(1)` pega um contact diferente. Corrigir para sempre disparar IA se existe **qualquer** contact com status válido para aquele número
- **Remover delays para respostas de IA** — o `whatsapp-ai-reply` não tem delay (responde direto), o problema é no webhook não disparar

#### 4. Contadores dinâmicos no frontend (RecoveryCampaigns)
- Em vez de depender de campos incrementais, fazer query `SELECT status, count(*) FROM recovery_contacts WHERE campaign_id = ? GROUP BY status` e exibir os contadores em tempo real

---

### Arquivos a modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/send-whatsapp-recovery/index.ts` | Após envio com sucesso, incrementar `sent_count` na campanha |
| `supabase/functions/evolution-webhook/index.ts` | Atualizar `delivered_count`/`responded_count` na campanha; garantir que IA dispara sempre que há contact válido |
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Buscar contadores dinâmicos via query aos `recovery_contacts` |
| `src/components/admin/recovery/RecoveryQueue.tsx` | Remover dependência de clique manual; mostrar status do cron |
| `src/components/admin/recovery/RecoveryHistory.tsx` | Fix no join com profiles (usar busca separada como no Queue) |
| SQL (via insert tool) | Criar cron job `process-recovery-queue` a cada 5 min |
| Deploy | Redeployar `evolution-webhook`, `send-whatsapp-recovery`, `process-recovery-queue`, `whatsapp-ai-reply` |

### Ordem de execução
1. Cron job automático (item mais urgente — fila para ao sair)
2. Contadores dinâmicos da campanha
3. Fix bot IA (verificar deploy + garantir disparo)
4. Fix histórico de mensagens
5. Deploy de todas as Edge Functions

