
# Plano: PQL v2, Tracking Inteligente, Copy/UX e Eventos

## STATUS: Etapa 1 — ✅ IMPLEMENTADA

### O que foi feito na Etapa 1:

1. **`src/hooks/useEditorInteractionTracker.ts`** (NOVO)
   - Hook para rastrear interações reais do usuário no editor
   - Idempotente por actionKey (Set<string>)
   - Reset automático ao mudar quizId

2. **`src/hooks/useUserStage.ts`** (REESCRITO)
   - Expandido de 3 para 8 estágios PQL
   - Novos: `iniciado`, `engajado`, `potencial_pagante`, `quase_upgrade`, `limite_atingido`
   - STAGE_INTENT_MATRIX 8×6 com headlines/CTAs específicos
   - STAGE_META com emojis e labels

3. **`src/hooks/useQuizPersistence.ts`** (ATUALIZADO)
   - `first_quiz_created` agora condicionado a `hasUserInteracted === true`
   - Novo evento `quiz_first_published` com `publish_source` (express_auto/manual)
   - Promoção PQL: explorador/iniciado/engajado → construtor ao publicar
   - Aceita params `hasUserInteracted` e `isExpressMode`

4. **`src/pages/Start.tsx`** (ATUALIZADO)
   - Eventos GTM segmentados: `objective_selectedON` (comercial) e `objective_selectedOFF` (educacional)
   - COMMERCIAL_OBJECTIVES array para segmentação

5. **`src/pages/CreateQuiz.tsx`** (ATUALIZADO)
   - Integrado `useEditorInteractionTracker`
   - Mecanismo `fireOnce` com `useRef<Set>` para eventos idempotentes
   - Evento `express_started` no mount do editor express
   - Props `isExpressMode`, `fireOnce`, `trackInteraction` propagados para QuestionConfigStep

6. **`src/components/quiz/QuestionConfigStep.tsx`** (ATUALIZADO)
   - Eventos express idempotentes: `express_q2_reached`, `express_halfway`, `express_completed`
   - Promoção PQL `explorador → iniciado` ao atingir pergunta 2
   - `trackInteraction` chamado em `updateCurrentQuestionBlocks`
   - Tab "Preview em Tempo Real" com gradiente roxo PERMANENTE

7. **`src/pages/Dashboard.tsx`** (ATUALIZADO)
   - Redirect inclui estágio `iniciado` além de `explorador`

---

## Etapa 2 — PENDENTE (Copy/UX)

### Mudanças planejadas:

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Start.tsx` | Ajuste de copy subtítulo |
| `src/components/quiz/ExpressProgressBar.tsx` | Texto motivacional abaixo da barra |
| `src/components/quiz/QuestionConfigStep.tsx` | Banners motivacionais metade/final no express |
| `src/components/quiz/ExpressCelebration.tsx` | Share expandido por default + bloco tráfego + 3 msgs WhatsApp prontas |

### Fase 2 (Backend — não implementada):
- Estágios 5-8 (operador → limite_atingido) via edge function/trigger
- Score numérico PQL
- Dashboard de métricas de funil interno
- Follow-up WhatsApp 24h
