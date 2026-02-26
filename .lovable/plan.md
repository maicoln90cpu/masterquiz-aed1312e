

# Plano: 4 Correções de Layout e Funcionalidade

## 1. Remover bordas de todos os blocos no quiz público
**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx` (linha 152)
- Passar `wrapInCard={false}` no `QuizBlockPreview` dentro de `renderQuestionBlocks()`
- Isso remove o `Card border-2` wrapper que envolve imagens, separadores, vídeos etc.
- Apenas os cards de resposta (SingleChoiceOptions/MultipleChoiceOptions) mantêm bordas

## 2. Vídeo sem aspect ratio forçado
**Arquivo:** `src/components/video/CustomVideoPlayer.tsx` (linhas 152-158, 542-545)
- Remover `aspectRatioClass` do container principal — deixar o vídeo usar sua proporção natural
- Remover `bg-muted` do container (causa a borda cinza)
- O vídeo respeitará `w-full` + proporção nativa dentro do container

**Arquivo:** `src/components/quiz/QuizBlockPreview.tsx` (linha 486)
- Remover `bg-muted` do wrapper do vídeo no QuizBlockPreview

## 3. Corrigir select de progresso (salvar progress_style no DB)
O problema: o select só altera `showQuestionNumber` (boolean), que mapeia counter=true, bar=true, none=false. O `progress_style` nunca é salvo.

**Arquivos afetados:**
- `src/components/quiz/QuizSettings.tsx`: Adicionar campo `progressStyle: 'bar' | 'counter' | 'none'` ao state, expor setter
- `src/components/quiz/AppearanceConfigStep.tsx`: Receber `progressStyle` + `onProgressStyleChange`, usar no select em vez de mapear para boolean
- `src/components/quiz/QuizActions.tsx` (linhas 93, 177, 219): Incluir `progress_style: settings.progressStyle` no payload de save/draft
- `src/hooks/useQuizPersistence.ts`: Carregar `progress_style` do quiz existente e mapear para o state
- `src/components/quiz/view/QuizViewQuestion.tsx` (linha 188): Priorizar `quiz.progress_style` diretamente (já faz, mas precisa que o dado chegue do DB)

## 4. Animação hover nas opções de resposta
**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx`
- Em `SingleChoiceOptions` e `MultipleChoiceOptions`, adicionar ao className das opções: `hover:shadow-md hover:scale-[1.02] transition-all duration-200`
- Efeito sutil de elevação + leve escala ao passar o mouse

---

## Resumo

| # | O que | Arquivos | Risco |
|---|-------|----------|-------|
| 1 | wrapInCard=false no quiz público | QuizViewQuestion.tsx | Baixo |
| 2 | Remover aspect ratio forçado do vídeo | CustomVideoPlayer.tsx, QuizBlockPreview.tsx | Baixo |
| 3 | Salvar progress_style corretamente | QuizSettings, AppearanceConfig, QuizActions, useQuizPersistence | Médio |
| 4 | Hover animation nas respostas | QuizViewQuestion.tsx | Baixo |

