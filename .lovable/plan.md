
## Implementado: Coluna CTA, Dashboard CTA, Filtro Heatmap, Performance

### O que foi alterado

| Arquivo | Mudança |
|---------|---------|
| `src/components/responses/ResponsesSpreadsheet.tsx` | Coluna "CTA Clicado" na tabela + JOIN com `quiz_cta_click_analytics` por `session_id` + select específico (não mais `*`) |
| `src/components/analytics/PerQuizAnalytics.tsx` | Seção "Performance dos CTAs" com ranking, cliques, sessões únicas e CTR + fix hooks antes de early return |
| `src/components/analytics/ResponseHeatmap.tsx` | Removido seletor interno quando `externalQuizId` fornecido + fix hooks antes de early return |
| `src/pages/Responses.tsx` | `useMemo` em `filteredResponses` para evitar recálculo desnecessário |
| `src/components/quiz/preview/StaticBlockPreviews.tsx` | `loading="lazy"` em imagens de texto+imagem e galeria |
| `src/components/quiz/preview/InteractiveBlockPreviews.tsx` | `loading="lazy"` em imagens de testimonial |
| `src/components/quiz/preview/RecommendationBlockPreview.tsx` | `loading="lazy"` em imagens de recomendação |

### Próximas fases
- Migrar ResponseHeatmap para `useQuery` do react-query com `staleTime`
- Lazy-load `@dnd-kit/core` no CRM (~40KB)
- Separar query de quizzes da query de responses em Responses.tsx
- Centralizar `supabase.auth.getUser()` para evitar chamadas repetidas
