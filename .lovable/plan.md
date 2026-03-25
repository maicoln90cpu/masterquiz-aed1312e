
## Implementado: CTA Tracking Deploy, Heatmap useQuery, DnD Lazy-load, Performance

### O que foi alterado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/track-cta-redirect/index.ts` | **Deployado** — edge function nunca havia sido deployada, causando 0 registros em quiz_cta_click_analytics |
| `src/components/analytics/ResponseHeatmap.tsx` | Migrado para `useQuery` com cache 5min; removido seletor interno de quiz (usa filtro global); removido import de Select; função parseOptions extraída como estática |
| `src/components/crm/CRMKanbanBoard.tsx` | **Novo** — componente extraído com DndContext, sensors, drag handlers e kanban grid |
| `src/pages/CRM.tsx` | @dnd-kit lazy-loaded via React.lazy(); drag handlers movidos para CRMKanbanBoard; auth centralizado via useAuth |
| `src/pages/Responses.tsx` | Query de quizzes separada (executa 1x) da query de responses (reage a filtros); useRef para evitar re-fetch |
| `src/hooks/useCurrentUser.ts` | **Novo** — hook centralizado para obter user do AuthContext sem chamar supabase.auth.getUser() |

### Próximas fases
- Substituir `supabase.auth.getUser()` por `useCurrentUser()` nos demais componentes (~50 arquivos)
- Adicionar coluna "CTA Clicado" na tabela de respostas individuais (dados agora disponíveis após deploy)
- Dashboard de conversão por CTA no Analytics (PerQuizAnalytics)
