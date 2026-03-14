

## Auditoria: Respostas e Analytics Quebrados

### Causa Raiz Identificada

O bug está na **linha 88 de `QuizViewForm.tsx`**:

```tsx
<Button onClick={onSubmit} className="...">
```

Quando `onSubmit` é `state.submitQuiz` (formulário "depois do quiz"), o `onClick` do Button passa o **React SyntheticEvent** como primeiro argumento. Na função `submitQuiz`:

```ts
const submitQuiz = async (overrideAnswers?, overrideScore?) => {
    const finalAnswers = overrideAnswers || answers;  // ← SyntheticEvent vira os "answers"!
```

O SyntheticEvent é um objeto plano com propriedades como `_reactName: "onClick"`, `clientX: 1051`, `type: "click"` -- todas string/number/boolean. O `sanitizeAnswers()` NÃO rejeita porque:
1. `instanceof Event` falha (SyntheticEvent ≠ Event nativo)
2. Todas as propriedades passam o filtro de tipo primitivo

**Resultado**: O banco armazena dados como `{_reactName: "onClick", clientX: 1051, type: "click", ...}` em vez de `{questionId: "resposta"}`. Por isso:
- Heatmap mostra 0 (nenhuma chave bate com IDs de pergunta)
- Planilha mostra "-" ou valores como "click", "1051" (propriedades do evento)
- Contagem de respostas funciona (a row existe), mas conteúdo é lixo

### Dados Corrompidos no Banco

Confirmado via query: as respostas recentes (maicoln, Rafael, christiny) têm o evento React inteiro como answers. Respostas mais antigas (Rilda, quiz 395073c1) têm dados corretos com UUIDs de pergunta.

### Correções Necessárias

#### 1. Fix principal: `QuizViewForm.tsx` (linha 88)
Envolver `onSubmit` para não passar o evento:
```tsx
<Button onClick={() => onSubmit()} ...>
```

#### 2. Fix defensivo: `submitQuiz` em `useQuizViewState.ts`
Adicionar guard no início de `submitQuiz` para rejeitar SyntheticEvent:
```ts
const submitQuiz = async (overrideAnswers?: ...) => {
    // Guard: if called from onClick, first arg is event
    if (overrideAnswers && ('_reactName' in overrideAnswers || 'nativeEvent' in overrideAnswers)) {
        overrideAnswers = undefined;
    }
```

#### 3. Fix defensivo: `sanitizeAnswers` em `useQuizViewState.ts`
Adicionar verificação de `_reactName` ou `nativeEvent` para rejeitar SyntheticEvents que passam pelo filtro de `instanceof Event`.

#### 4. Fix defensivo: `handleAnswer` guard (linha 212)
Adicionar checagem para `value?._reactName` além de `instanceof Event`.

#### 5. Verificar outros locais onde `submitQuiz`/`nextStep` são passados como onClick
- `QuizView.tsx` linha 115: `onSubmit={showFormBefore ? state.nextStep : state.submitQuiz}` -- mesmo bug quando `showFormBefore=true`, `nextStep` recebe o evento (menos grave pois `nextStep` não usa args para dados).
- Buscar qualquer `onClick={onSubmit}` ou `onClick={submitQuiz}` sem wrapper.

### Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/components/quiz/view/QuizViewForm.tsx` | Linha 88: `onClick={() => onSubmit()}` |
| `src/hooks/useQuizViewState.ts` | Guard no `submitQuiz` + melhorar `sanitizeAnswers` + melhorar guard do `handleAnswer` |

### Sobre os Dados Corrompidos

As respostas já salvas com dados de evento são irrecuperáveis -- os dados reais das respostas não foram gravados. Após o fix, novas respostas serão salvas corretamente. O heatmap e planilha funcionarão automaticamente para novas respostas.

### Impacto

Este bug afeta **todos os quizzes** que têm formulário de coleta configurado como "after" (após o quiz). Quizzes sem formulário de coleta provavelmente não são afetados (usam `handleNextClick` que chama `onSubmit()` sem args).

