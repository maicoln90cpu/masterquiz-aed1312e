

## Plano: Propriedades sempre visíveis (sticky no viewport)

### Diagnóstico

O problema é que `<main>` usa `min-h-screen` — permite crescer além do viewport. Quando COL 3 tem muitos blocos, o conteúdo empurra a altura total da página, e as 4 colunas crescem juntas em vez de scrollar independentemente. O `overflow-hidden` no container intermediário deveria prevenir isso, mas a cadeia `min-h-screen → flex-1 → h-full` não garante altura fixa em todos os browsers.

### Correção

**Arquivo: `src/pages/CreateQuizModern.tsx`**

1. No `<main>` (linha 405), quando `step === 3`, usar `h-screen overflow-hidden` em vez de `min-h-screen`:

```
<main className={cn(
  "bg-background flex flex-col",
  step === 3 && !isExpressMode ? "h-screen overflow-hidden" : "min-h-screen"
)}>
```

Isso garante que a página inteira tem altura fixa = viewport. Cada coluna com `overflow-y-auto` scrollará independentemente dentro desse espaço fixo. COL 4 (propriedades) SEMPRE estará visível no viewport, não importa quanto o usuário scrolle em COL 3.

2. Remover o `useEffect` de auto-scroll-to-top nas propriedades (linhas 275-283) — não faz mais sentido, pois as colunas são independentes.

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/CreateQuizModern.tsx` | `h-screen` condicional no main + remover useEffect de scroll |

### Resultado
- COL 4 (propriedades) sempre visível, independente do scroll em COL 3
- Cada coluna scrollará de forma 100% independente
- Sem JavaScript extra — solução puramente CSS

