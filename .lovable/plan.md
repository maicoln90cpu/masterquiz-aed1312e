

## Problema e Solução

### Bug: Templates novos não aparecem no dropdown
A query na linha 75 filtra `.eq('is_active', true)`. Templates criados pelo admin podem estar com `is_active = false`. Solução: mostrar TODOS os templates no dropdown de campanhas (campanhas são manuais, admin deve poder usar qualquer template), agrupados por categoria e mostrando a categoria no label.

### Nova feature: Filtros de audiência no modal de campanha
A tabela `recovery_campaigns` já tem coluna `target_criteria` (JSONB). Adicionar multi-select de filtros no modal e passar esses critérios para a edge function `check-inactive-users`.

**Filtros propostos (multi-select com checkboxes):**
- Sem leads (0 leads)
- Sem quiz publicado (0 quizzes ativos)
- Plano Free
- Plano Admin/Pro
- Por estágio: explorador, iniciado, construtor, operador
- Por objetivo: educational, lead_capture_launch, offer_validation, paid_traffic, vsl_conversion
- Inativos há 7+ dias
- Inativos há 15+ dias
- Inativos há 30+ dias

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/recovery/RecoveryCampaigns.tsx` | Mostrar todos templates (sem filtro is_active) com categoria; adicionar seção de filtros multi-select no modal; salvar filtros em `target_criteria`; passar filtros ao iniciar campanha |
| `supabase/functions/check-inactive-users/index.ts` | Ler `target_criteria` da campanha e aplicar filtros (leads=0, quiz=0, plano, estágio, objetivo, dias de inatividade) na seleção de usuários elegíveis |

### Detalhes da UI dos filtros
- Seção com accordion/collapsible no modal "Nova Campanha"
- Checkboxes agrupados: "Atividade" (sem leads, sem quiz), "Plano" (free, admin), "Estágio" (explorador, iniciado...), "Objetivo" (educational, lead_capture...), "Inatividade" (7+, 15+, 30+ dias)
- Salvar como `target_criteria: { no_leads: true, no_quizzes: true, plans: ['free'], stages: ['explorador'], objectives: ['educational'], min_inactive_days: 15 }`

