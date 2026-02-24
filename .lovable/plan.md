

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

## ✅ Etapa 2 — CONCLUÍDA

### 2.1 — Upload de vídeo na Etapa 5 (Resultados) ✅
- Tabs URL/Upload no `ResultsConfigStep.tsx`
- Suporte a Bunny (BunnyVideoUploader) e Supabase (VideoUploader)
- Renderização de vídeo em `QuizViewResult.tsx` (YouTube/Vimeo embed, mp4/webm native)
- Renderização de vídeo em `PreviewResultScreen.tsx`
- `video_url` adicionado ao tipo `QuizResult` em `useQuizPreviewState.ts`

### 2.2 — Persistência de IDs de perguntas (upsert) ✅
- `saveQuiz` refatorado para usar upsert por ID em vez de delete+insert
- `saveDraftToSupabase` também refatorado com a mesma lógica
- Apenas perguntas removidas pelo usuário são deletadas
- Novas perguntas (sem UUID válido) são inseridas normalmente
- IDs estáveis preservam analytics/heatmap/planilha

### 2.3 — Heatmap/Planilha: robustez ✅
- Corrigido pela raiz: IDs agora são estáveis (2.2)
- Heatmap e planilha usam `question.id` para mapear respostas — agora consistente

### 2.4 — Performance no quiz publicado ✅
- Injeção de FB Pixel e GTM deferida via `requestIdleCallback` (fallback setTimeout)
- Não bloqueia mais interação nas primeiras perguntas

---

## Arquivos NÃO tocados
- `parse-pdf-document/index.ts`
- `AIQuizGenerator.tsx` (normalização já funciona)
