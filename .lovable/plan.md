

# Plano: Corrigir Template Enxoval para seguir o padrao do Emagrecimento

## Diagnostico

Comparando os dois templates no banco, o Enxoval tem **3 problemas estruturais criticos** que o Emagrecimento nao tem:

### Problema 1: Nomes de campos diferentes (camelCase vs snake_case)

| Campo | Emagrecimento (correto) | Enxoval (errado) |
|---|---|---|
| Texto da pergunta | `question_text` | `questionText` |
| Formato da resposta | `answer_format` | `answerFormat` |
| Ordem | `order_number` | `orderNumber` |
| ID da pergunta | `emag-q-mirror1` | (sem id) |

O hook `useQuizTemplateSelection` (linha 83) usa `q.question_text` e `q.answer_format`. Como o Enxoval usa camelCase, esses campos retornam `undefined` -- por isso as perguntas aparecem vazias.

### Problema 2: Perguntas sem bloco `question` dentro dos `blocks`

No Emagrecimento, cada pergunta tem um bloco `{ type: "question", questionText, options, ... }` dentro do array `blocks`. No Enxoval, o array `blocks` contem apenas blocos visuais (image, slider, separator, etc) mas **nenhum bloco question**. Perguntas sem blocos ficam com `blocks: []`, o que faz o editor nao renderizar a pergunta.

### Problema 3: SocialProof com formato errado

O `SocialProofBlock` no codigo espera:
```
{ type: "socialProof", notifications: [{name, action, time}], interval: 5, style, position }
```

O Enxoval armazenou:
```
{ type: "socialProof", text: "...", author: "...", rating: 5, style: "toast" }
```

Faltam `notifications` e `interval`, causando o erro `Cannot read properties of undefined (reading 'length')` na linha 22 do `SocialProofBlock.tsx`.

---

## Correcao

### 1. SQL Migration: Reescrever o `full_config` do template Enxoval

Atualizar o JSON inteiro com:

- **Campos em snake_case**: `question_text`, `answer_format`, `order_number`
- **IDs unicos** para cada pergunta (ex: `enx-q1`, `enx-q2`, etc)
- **Bloco `question`** dentro do array `blocks` de cada pergunta (com `questionText`, `options` como strings, `autoAdvance`, `required`)
- **SocialProof corrigido** com `notifications[]` e `interval` (mesmo formato do Emagrecimento)
- **Opcoes como strings simples** (nao objetos `{text, score}`) para compatibilidade com o editor

### 2. Defesa no SocialProofBlock.tsx

Adicionar fallback para evitar crash quando `notifications` estiver undefined:

```typescript
const notifications = block.notifications || [];
// Usar notifications.length com guard
```

E no useEffect, nao criar interval se nao houver notifications.

### 3. Defesa no useQuizTemplateSelection.ts

Aceitar ambos os formatos de campo (camelCase e snake_case) para robustez:

```typescript
question_text: q.question_text || q.questionText || '',
answer_format: q.answer_format || q.answerFormat || 'single_choice',
```

---

## Estrutura correta do template (exemplo de 1 pergunta)

Baseado no padrao do Emagrecimento que funciona:

```json
{
  "id": "enx-q4",
  "question_text": "Quanto voce imagina gastar no enxoval completo?",
  "answer_format": "single_choice",
  "options": ["Menos de R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 5.000", "Mais de R$ 5.000"],
  "order_number": 3,
  "blocks": [
    { "id": "enx-b4-img", "type": "image", "url": "/templates/enxoval-bebe/quarto-bebe.jpg", "alt": "Quarto de bebe", "width": "100%", "order": 0 },
    { "id": "enx-b4-slider", "type": "slider", "min": 500, "max": 10000, "step": 100, "defaultValue": 3000, "unit": "R$", "label": "Orcamento estimado", "showValue": true, "required": true, "order": 1 },
    { "id": "enx-b4-q", "type": "question", "questionText": "Quanto voce imagina gastar no enxoval completo?", "answerFormat": "single_choice", "options": ["Menos de R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 5.000", "Mais de R$ 5.000"], "required": true, "autoAdvance": true, "order": 2 }
  ]
}
```

---

## Resumo de Alteracoes

| Arquivo | Acao |
|---|---|
| SQL Migration | UPDATE `quiz_templates` SET `full_config` com JSON corrigido (15 perguntas, snake_case, blocos question, socialProof correto) |
| `src/components/quiz/blocks/SocialProofBlock.tsx` | Guard contra `notifications` undefined |
| `src/hooks/useQuizTemplateSelection.ts` | Aceitar camelCase + snake_case nos campos |

## Ordem de Execucao
1. Corrigir `SocialProofBlock.tsx` (guard defensivo)
2. Corrigir `useQuizTemplateSelection.ts` (aceitar ambos formatos)
3. SQL Migration: reescrever full_config do Enxoval com estrutura correta
