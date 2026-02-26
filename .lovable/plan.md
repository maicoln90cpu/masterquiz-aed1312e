

## Todas as regras atuais do sistema de campanhas

### 1. Pré-requisitos globais (bloqueiam TUDO)
- **Sistema ativo**: `is_active = true` E `is_connected = true` (WhatsApp conectado)
- **Horário permitido**: só funciona entre 09:00 e 20:00 (horário de Brasília)
- **Limite diário**: máximo 50 mensagens/dia (conta TODAS as campanhas somadas). Hoje já foram enviadas 67 nos últimos 10 dias

### 2. Pool de usuários (quem entra na lista)
- Só usuários com **WhatsApp cadastrado** no perfil
- Se a campanha NÃO tem filtros de audiência: busca apenas **usuários inativos há 10+ dias** (padrão `inactivity_days_trigger`)
- Se a campanha TEM filtros (no_leads, no_quizzes, etc.) mas SEM `min_inactive_days`: busca **todos os usuários**

### 3. Exclusões automáticas (removem do pool)
- **Blacklist**: usuários ou telefones na tabela `recovery_blacklist`
- **Cooldown global**: usuários que receberam QUALQUER mensagem nos últimos **10 dias** (`user_cooldown_days = 10`) — de QUALQUER campanha
- **Planos excluídos**: `exclude_plan_types` (atualmente `null`, nenhum excluído)

### 4. UNIQUE constraint na tabela `recovery_contacts`
- Constraint: `UNIQUE (user_id, template_id)` — um usuário SÓ pode receber cada template UMA VEZ na vida toda
- Isso significa: se você usa o mesmo template em 2 campanhas diferentes, o segundo insert FALHA

### 5. Limite de fila
- Após todos os filtros, pega no máximo `remainingLimit` usuários (50 - já enviados hoje)

### 6. Resumo do que te bloqueou

| Problema | Causa |
|----------|-------|
| Campanha "sem leads" só pegou 11 | **67 usuários** já receberam mensagem nos últimos 10 dias (cooldown global). Sobraram ~11 |
| Campanha presa em 21 | UNIQUE constraint `(user_id, template_id)` impede re-inserir os mesmos usuários com mesmo template |

---

## Sua necessidade real vs. o que existe

Você quer: **criar campanhas sazonais/promocionais e disparar para todos os usuários com WhatsApp**, sem que regras de recuperação de inativos atrapalhem.

O sistema atual foi feito para **recuperação de clientes inativos** — com proteções anti-spam (cooldown, limite diário, horário). Essas proteções fazem sentido para recuperação automática, mas atrapalham campanhas manuais/sazonais.

## Proposta de solução

Criar um modo **"Campanha Manual / Sazonal"** dentro do mesmo sistema, com um checkbox no modal:

**"Campanha de disparo direto"** (quando marcado):
- Ignora cooldown global (não importa se o usuário recebeu outra mensagem recentemente)
- Ignora UNIQUE constraint — insere com `ON CONFLICT DO NOTHING` em vez de falhar
- Busca TODOS os usuários com WhatsApp (sem filtro de inatividade obrigatório)
- Mantém: blacklist, horário permitido, limite diário (proteções essenciais)

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Adicionar checkbox "Campanha de disparo direto" no modal. Quando ativo, passa `ignoreCooldown: true` e `directCampaign: true` ao edge function |
| `supabase/functions/check-inactive-users/index.ts` | Quando `directCampaign: true`: ignorar cooldown, usar `upsert` com `onConflict: 'user_id,template_id'` + `ignoreDuplicates: true` em vez de `insert` |

Isso resolve os 2 problemas sem criar uma nova aba — apenas um toggle no modal existente.

