

# Plano: Melhorias no Quiz (Etapas 1 e 2)

## ✅ Etapa 1 — CONCLUÍDA

### 1.1 — Migration `show_results` ✅
- Adicionada coluna `show_results boolean DEFAULT true` na tabela `quizzes`

### 1.2 — UI toggle na Etapa 2 (Aparência) ✅
- Switch "Exibir tela de resultados" em `AppearanceConfigStep.tsx`
- Estado `showResults` adicionado em `QuizAppearanceState` (`useQuizState.ts`)
- Persistência load/save em `useQuizPersistence.ts`
- Props passados via `CreateQuiz.tsx`

### 1.3 — Fluxo publicado sem resultados ✅
- `QuizViewQuestion.tsx`: botão "Finalizar" oculto quando `show_results=false`
- `useQuizViewState.ts`: auto-submit silencioso ao responder última pergunta (single_choice/yes_no)
- `QuizView.tsx`: pula tela de resultado quando `show_results=false`
- Toast discreto "Resposta salva! Obrigado por participar."

### 1.4 — Fix tracking P10 ✅
- `submitQuiz()` agora registra `track-quiz-step` para o último step antes de salvar a resposta
- Resolve o problema de 0% na retenção da última pergunta

---

## 🔲 Etapa 2 — PENDENTE

### 2.1 — Upload de vídeo na Etapa 5 (Resultados)
**Arquivos:** `ResultsConfigStep.tsx`, `QuizViewResult.tsx`, `PreviewResultScreen.tsx`
- Adicionar uploader direto (Bunny/Supabase) ao lado do campo de URL
- Renderizar vídeo no resultado publicado (mp4/webm → `<video>`, YouTube/Vimeo → iframe)

### 2.2 — Persistência de IDs de perguntas (evitar delete+insert)
**Arquivos:** `useQuizPersistence.ts`
- Refatorar `saveQuiz` para usar upsert por ID em vez de deletar tudo e reinserir
- Mapear IDs temporários para existentes por `order_number`
- Preservar `question_id` para analytics/heatmap/planilha

### 2.3 — Heatmap/Planilha: ajustes de robustez
**Arquivos:** `ResponseHeatmap.tsx`, `ResponsesSpreadsheet.tsx`
- Garantir que todas as perguntas apareçam (incluindo última)
- Mensagem de aviso quando IDs antigos não batem com respostas

### 2.4 — Performance no quiz publicado
**Arquivos:** `useQuizTracking.ts`, `QuizBlockPreview.tsx`
- Deferir injeção de scripts de tracking (FB Pixel/GTM) com `requestIdleCallback`
- Code-splitting de blocos pesados (metrics/chart) no `QuizBlockPreview`

---

## Arquivos NÃO tocados
- `parse-pdf-document/index.ts`
- `AIQuizGenerator.tsx` (normalização já funciona)
