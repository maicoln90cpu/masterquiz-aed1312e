

## Diagnostico dos 2 Problemas

### Problema 1: Campanha "Feedback" com 0 alvos

**Causa raiz:** A edge function `check-inactive-users` OBRIGA que os usuarios estejam inativos (sem login ha X dias). O fluxo e:

1. Busca usuarios que NAO logaram nos ultimos `min_inactive_days` dias (default: 10 dias do `inactivity_days_trigger`)
2. SO DEPOIS aplica os filtros `no_leads`, `no_quizzes`, etc.

Resultado: se voce quer atingir usuarios sem leads/quizzes mas que logaram recentemente, eles sao filtrados ANTES dos criterios serem aplicados. O filtro de inatividade age como pre-requisito obrigatorio.

**Fix:** Quando `min_inactive_days` NAO e definido nos criterios E existem outros filtros (no_leads, no_quizzes, plans, stages, objectives), buscar TODOS os usuarios com WhatsApp — nao apenas inativos. O filtro de inatividade so deve ser obrigatorio quando explicitamente selecionado ou quando nenhum outro criterio e fornecido.

### Problema 2: "Recuperacao Clientes" presa em 21 alvos

**Causa raiz:** A tabela `recovery_contacts` tem constraint UNIQUE em `(user_id, template_id)`. Os 21 usuarios ja foram inseridos com o template `4ef644e7...`. Ao re-iniciar a campanha, o edge function tenta inserir novamente mas o `ON CONFLICT` nao existe — ele usa `.insert()` normal, que falha silenciosamente ou os mesmos usuarios sao filtrados pelo cooldown (contatados nos ultimos 10 dias).

**Fix:** Ao re-iniciar uma campanha existente, usar `ignoreCooldown: true` para campanhas ja com contatos, OU permitir criar novos contatos com `campaign_id` diferente ignorando o UNIQUE constraint (que e por user_id+template_id).

---

### Mudancas

**`supabase/functions/check-inactive-users/index.ts`:**
- Quando `targetCriteria` tem filtros ativos (no_leads, no_quizzes, plans, stages, objectives) MAS `min_inactive_days` nao foi definido explicitamente: buscar TODOS os usuarios com WhatsApp (nao filtrar por inatividade)
- Quando `min_inactive_days` e definido explicitamente OU nenhum filtro e fornecido: manter comportamento atual (filtrar por inatividade)
- Isso permite campanhas direcionadas por criterios sem exigir inatividade

**`src/components/admin/recovery/RecoveryCampaigns.tsx`:**
- No `startCampaign`, se campanha ja tem contatos (re-inicio), passar `ignoreCooldown: true`
- Mostrar aviso quando campanha nao tem filtros nem inatividade definida

