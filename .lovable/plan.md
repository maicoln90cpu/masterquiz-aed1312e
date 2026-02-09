
# Plano: Fix Corte de Imagens + Erro no Template Enxoval

## Problema 1: Imagens cortadas no bloco de imagem

**Causa raiz**: No `ImageUploader.tsx` (linha 137), a imagem de preview tem `className="w-full h-48 object-cover"`. O `h-48` fixa a altura em 192px e o `object-cover` corta a imagem para caber nessa area. Isso faz com que imagens verticais ou mais altas percam partes importantes (topo e base).

**Correcao**: Trocar `h-48 object-cover` por `max-h-64 object-contain` para que a imagem inteira seja visivel sem corte, mantendo proporcoes originais.

### Arquivo: `src/components/ImageUploader.tsx`
- Linha 137: mudar de `"w-full h-48 object-cover rounded-lg border"` para `"w-full max-h-64 object-contain rounded-lg border bg-muted/20"`
- O `object-contain` garante que a imagem inteira aparece
- O `max-h-64` limita a altura maxima para nao ocupar espaco excessivo
- O `bg-muted/20` adiciona um fundo sutil nas areas vazias

---

## Problema 2: Erro "Objects are not valid as a React child" ao entrar no template Enxoval

**Causa raiz**: Os templates inseridos no banco armazenam as opcoes como objetos `{text: "...", score: 0}`, mas os componentes do editor e preview esperam strings simples no array `options`.

O erro ocorre em multiplos locais que tentam renderizar `option` diretamente como texto:
- `QuizBlockPreview.tsx` linhas 344, 358, 372, 386, 396, 409 - renderiza `{option}` no JSX
- `QuestionBlock.tsx` linha 195 - usa `value={option}` no Input
- `QuestionConfigStep.tsx` linha 70 - cast `options as string[]`

**Correcao**: Criar uma funcao utilitaria `normalizeOption` que extrai o texto de uma opcao, seja ela string ou objeto `{text, score}`. Aplicar nos pontos de renderizacao.

### Abordagem (mais segura e menos invasiva):

**A) Normalizar opcoes no momento de carregar o template** (em `useQuizTemplateSelection.ts`):

No `handleSelectTemplate`, ao processar as questions (linha 85), normalizar as opcoes para que objetos `{text, score}` virem strings separadas em `options[]` e `scores[]`:

```typescript
// Antes
options: Array.isArray(q.options) ? q.options : [],

// Depois  
options: Array.isArray(q.options) 
  ? q.options.map((opt: any) => typeof opt === 'object' && opt?.text ? opt.text : String(opt))
  : [],
```

E extrair scores na mesma transformacao.

**B) Adicionar protecao nos componentes de renderizacao** (defesa em profundidade):

Criar helper em `src/types/blocks.ts`:
```typescript
export const normalizeOption = (option: unknown): string => {
  if (typeof option === 'string') return option;
  if (option && typeof option === 'object' && 'text' in option) return String((option as any).text);
  return String(option);
};
```

Aplicar em:
- `QuizBlockPreview.tsx`: onde renderiza `{option}` como child ou value
- `QuestionBlock.tsx`: no `value={option}` do Input (linha 195)
- `QuestionConfigStep.tsx`: no cast de options (linha 70)

---

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---|---|
| `src/components/ImageUploader.tsx` | Trocar `h-48 object-cover` por `max-h-64 object-contain` |
| `src/types/blocks.ts` | Adicionar funcao `normalizeOption` |
| `src/hooks/useQuizTemplateSelection.ts` | Normalizar options ao carregar template (converter `{text,score}` para strings + scores separados) |
| `src/components/quiz/QuizBlockPreview.tsx` | Usar `normalizeOption` ao renderizar opcoes |
| `src/components/quiz/blocks/QuestionBlock.tsx` | Usar `normalizeOption` ao exibir value das opcoes |
| `src/components/quiz/QuestionConfigStep.tsx` | Usar `normalizeOption` no cast de options |

## Ordem de Execucao
1. Adicionar `normalizeOption` em `src/types/blocks.ts`
2. Corrigir `useQuizTemplateSelection.ts` para normalizar ao carregar
3. Aplicar protecao defensiva nos 3 componentes de renderizacao
4. Corrigir `ImageUploader.tsx` para nao cortar imagens
