

## Auditoria Completa - Causas Raiz Encontradas

### Bug 1: "Erro ao enviar resposta" - CAUSA RAIZ DEFINITIVA

**Evidencia do console do browser (reproduzido ao vivo):**
```
"Converting circular structure to JSON
    --> starting at object with constructor 'HTMLButtonElement'
    |     property '__reactFiber$...' -> object with constructor 'FiberNode'
    --- property 'stateNode' closes the circle"
```

**O que acontece:** Um elemento DOM (HTMLButtonElement) esta sendo armazenado no objeto `answers` em vez de um valor string. Quando o `submitQuiz` tenta fazer `.insert({ answers: finalAnswers })`, o Supabase JS chama `JSON.stringify(answers)` que falha porque DOM elements tem referencia circular.

**Onde o DOM element entra nos answers:** A questao de order_number 2 do quiz "teste" tem `answer_format: multiple_choice` mas seus blocos sao `[text, button]` - SEM bloco `question`. Quando o usuario clica no botao "Falar com especialista no WhatsApp", o evento pode estar sendo propagado para o `onAnswer` em algum ponto, armazenando o event target (HTMLButtonElement) como resposta.

**Fix (2 camadas de protecao):**

1. **Sanitizar answers antes do insert** em `useQuizViewState.ts` (linhas 414-424): Filtrar valores nao-serializaveis do objeto `answers` antes de enviar ao banco. Remover qualquer valor que nao seja string, number, boolean, array ou plain object.

2. **Garantir que handleAnswer so aceita valores serializaveis** em `useQuizViewState.ts` (linha 194): Adicionar guard na funcao `handleAnswer` para rejeitar DOM elements e event objects.

```typescript
// Sanitizacao defensiva
const sanitizeAnswers = (answers: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value.filter(v => typeof v === 'string' || typeof v === 'number');
    } else if (typeof value === 'object' && !(value instanceof Element) && !(value instanceof Event)) {
      try { JSON.stringify(value); clean[key] = value; } catch { /* skip */ }
    }
  }
  return clean;
};
```

### Bug 2: Botao "Proxima" - Logica ainda incompleta

**Situacao atual (linha 120):**
```typescript
const hasManualNavButton = hasQuestionBlock || hasButtonBlock;
```

Isso oculta o botao externo em TODOS os casos que tem question block ou button block. Mas:
- Para questoes COM question block: o botao interno (QuestionBlockRenderer) funciona
- Para questoes SEM question block e COM button block `next_question`: o button block avanca
- Para questoes SEM question block e SEM button block: **TRAVADO** - nenhum botao aparece

**Fix:** Mudar a logica para so ocultar o botao externo quando existe um mecanismo de avanco real:

```typescript
// Botao externo so fica oculto se:
// 1. Existe question block (tem botao interno) OU
// 2. Existe button block com action=next_question (funciona como nav)
const hasManualNavButton = hasQuestionBlock || hasButtonBlock;
// ↑ Isso ja esta correto DESDE QUE hasButtonBlock verifique action=next_question
```

Verificando linha 116: `const hasButtonBlock = question.blocks?.some((b: any) => b.type === 'button' && (b as any).action === 'next_question');` - isso JA filtra por next_question. Entao a logica ESTA correta.

O problema real do botao e que questoes SEM question block E SEM button block nao tem como avancar. Precisamos adicionar o botao externo para esses casos. Verificar se o bloco de navegacao externo (linhas 180+) aparece quando `!hasManualNavButton`.

**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx` linhas 170-230

### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useQuizViewState.ts` | Sanitizar `answers` antes do insert + guard no `handleAnswer` |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Verificar logica do botao externo para questoes sem question block |

### Checklist pos-implementacao

1. Quiz "teste" → responder tudo → preencher form → Finalizar → SEM ERRO, resposta salva
2. Questoes com question block + autoAdvance OFF → botao "Proxima" visivel
3. Questoes com question block + autoAdvance ON → sem botao, avanca ao clicar
4. Questoes sem question block com button next_question → button block avanca
5. Questoes sem question block sem button → botao externo visivel

