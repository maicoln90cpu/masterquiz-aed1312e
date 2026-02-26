

## Plano: Sincronizar Preview com Editor

### 3 problemas identificados

**1. Clique na pergunta esquerda não navega o preview**
- `CreateQuiz.tsx` linha 885: `UnifiedQuizPreview` é renderizado SEM `externalQuestionIndex`
- `editorState.currentQuestionIndex` existe e é atualizado por `handleQuestionClick`, mas não é passado ao preview

**Fix**: Passar `externalQuestionIndex={currentQuestionIndex}` ao `UnifiedQuizPreview` inline. Porém, o hook `useQuizPreviewState` precisa ser ajustado: quando `externalQuestionIndex` muda, sincronizar `internalQuestionIndex` mas permitir navegação interna livre (não travar no external).

**Mudança em `useQuizPreviewState.ts`**: Substituir a lógica de override por um `useEffect` que sincroniza `internalQuestionIndex` quando `externalQuestionIndex` muda, mas mantém `currentQuestionIndex = internalQuestionIndex` sempre (permitindo navegação livre no preview).

**Mudança em `CreateQuiz.tsx` linha 885**: Adicionar `externalQuestionIndex={currentQuestionIndex}`.

---

**2. Botão "Próxima" sempre visível no preview (ignora autoAdvance)**
- `PreviewNavigation` sempre renderiza os botões "Anterior/Próxima" sem considerar `autoAdvance`
- `UnifiedQuizPreview.renderQuizStep()` sempre renderiza `PreviewNavigation` (linha 176)

**Fix**: Passar `autoAdvance` e `hasButtonBlock` do `questionBlock` atual para controlar a visibilidade do `PreviewNavigation`. Se `autoAdvance === true` e formato é `single_choice`/`yes_no`, ocultar o botão "Próxima" (manter "Anterior"). Se há `buttonBlock` com `next_question`, ocultar "Próxima" também.

**Mudança em `UnifiedQuizPreview.tsx`**: Extrair `autoAdvance` e `hasButtonBlock` do `currentQuestion`, e condicionalmente ocultar `PreviewNavigation` ou passar props para esconder o botão "Next".

**Mudança em `PreviewNavigation.tsx`**: Adicionar prop `hideNextButton?: boolean` para ocultar apenas o "Próxima" quando auto-advance está ativo.

---

**3. Botão "Próximo" não funciona para `short_text` no preview**
- `isAnswered` em `useQuizPreviewState` (linha 227) usa `!!selectedAnswers[currentQuestion.id]`
- Para `short_text`, o `QuizBlockPreview` renderiza um `Input` mas o `onAnswerSelect` callback é para cliques em opções — texto digitado **não** é armazenado em `selectedAnswers`
- Logo `isAnswered = false` e o botão fica desabilitado permanentemente

**Fix em `PreviewQuizContent.tsx`**: Passar uma callback `onTextAnswer` para o `QuizBlockPreview` que armazene o texto em `selectedAnswers`. Alternativamente, fazer o `onAnswerSelect` funcionar para texto.

**Fix em `useQuizPreviewState.ts`**: Expor um `handleTextAnswer(questionId, text)` que atualiza `selectedAnswers`.

**Fix em `UnifiedQuizPreview.tsx`**: Conectar a callback de texto.

---

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQuizPreviewState.ts` | `useEffect` para sync `externalQuestionIndex` → `internalQuestionIndex`; expor `handleTextAnswer` |
| `src/pages/CreateQuiz.tsx` | Passar `externalQuestionIndex={currentQuestionIndex}` ao preview inline |
| `src/components/quiz/UnifiedQuizPreview.tsx` | Extrair autoAdvance/hasButtonBlock; controlar visibilidade do PreviewNavigation; conectar text answer |
| `src/components/quiz/preview/PreviewNavigation.tsx` | Adicionar prop `hideNextButton` |
| `src/components/quiz/preview/PreviewQuizContent.tsx` | Suportar callback de texto para `short_text` |

