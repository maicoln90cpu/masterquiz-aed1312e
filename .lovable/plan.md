

# Correcao de variacoes de blocos nao aplicadas no quiz publicado

## Problema principal encontrado

### 1) Imagem: tamanho de exibicao ignorado (BUG CONFIRMADO)

**Causa raiz**: No arquivo `QuizBlockPreview.tsx` (linha 481), existe um `style={{ maxWidth: '100%' }}` inline que **sobrescreve** todas as classes CSS de tamanho (`max-w-xs`, `max-w-md`, `max-w-2xl`).

```text
Classe CSS aplicada:    max-w-xs  -> max-width: 20rem (320px)
Inline style aplicado:  maxWidth: '100%'  -> max-width: 100%

CSS inline SEMPRE vence -> imagem fica 100% em todos os tamanhos
```

**Correcao**: Remover o `style={{ maxWidth: '100%' }}` da linha 481. As classes Tailwind ja fazem o trabalho corretamente. Para o caso `full`, a classe `w-full` ja garante largura total.

---

### 2) Separador: espessura (thickness) nao funciona (BUG CONFIRMADO)

O componente `Separator` do shadcn/radix usa `height: 1px` + `background-color` para desenhar a linha. Porem, o codigo aplica classes de **borda** (`border-t`, `border-t-2`, `border-t-4`) que nao tem efeito visual porque o Separator nao usa bordas.

Alem disso, os estilos `dots`/`dashes` usam `border-dotted`/`border-dashed` que tambem nao funcionam pelo mesmo motivo.

**Correcao**: Substituir o `<Separator>` por uma `<div>` estilizada com as propriedades corretas:
- Espessura via `height` (1px / 2px / 4px)
- Estilo via `border-style` com `border-top` em vez de `background`
- Cor via `borderColor` ou `backgroundColor`

---

### 3) Varredura completa dos demais blocos

Apos analisar todos os 20+ tipos de blocos no `QuizBlockPreview.tsx`, os resultados:

| Bloco | Status | Problema |
|-------|--------|----------|
| **image** | BUG | `style={{ maxWidth: '100%' }}` sobrescreve classe de tamanho |
| **separator** | BUG | Usa classes de border em componente que nao usa border |
| **text** | OK | `fontSize` e `alignment` aplicados corretamente |
| **video** | OK | `size` aplicado sem inline style conflitante |
| **audio** | OK | Sem variacoes de tamanho |
| **button** | OK | `variant` e `size` passados corretamente ao componente `Button` |
| **gallery** | OK | `layout` (grid/carousel/masonry) aplicado corretamente |
| **price** | OK | `highlighted` aplica borda primaria corretamente |
| **metrics** | OK | `chartType` renderiza corretamente (bar/pie/line/donut) |
| **loading** | OK | `spinnerType` renderiza 4 variantes corretamente |
| **progress** | OK | `style` (bar/steps/circle/percentage) funciona, `height` funciona |
| **countdown** | OK | `style` (default/minimal/bold/card) funciona, cores aplicadas |
| **testimonial** | OK | `style` e `rating` renderizam corretamente |
| **slider** | OK | `min/max/step/unit` aplicados |
| **textInput** | OK | `multiline/placeholder` funciona |
| **nps** | OK | Labels renderizados |
| **accordion** | OK | `allowMultiple` e `style` aplicados |
| **comparison** | OK | `showIcons` e estilos left/right funcionam |
| **socialProof** | OK | Animacao e `style` aplicados |
| **embed** | OK | Sem variacoes de tamanho |

**Apenas 2 bugs encontrados**: imagem e separador.

---

## Detalhes tecnicos da correcao

### Arquivo: `src/components/quiz/QuizBlockPreview.tsx`

**Correcao 1 - Imagem (linhas 466-489)**
- Remover `style={{ maxWidth: '100%' }}` da tag `<img>`
- As classes Tailwind `max-w-xs` / `max-w-md` / `max-w-2xl` / `w-full` passam a funcionar corretamente

**Correcao 2 - Separador (linhas 443-463)**
- Substituir `<Separator>` por `<div>` com estilos adequados:
  - `style='line'`: borda solida
  - `style='dots'`: borda pontilhada
  - `style='dashes'`: borda tracejada
  - `style='space'`: sem borda visivel (apenas espacamento)
  - Espessura via `borderTopWidth`: thin=1px, medium=2px, thick=4px
  - Cor via `borderColor`

