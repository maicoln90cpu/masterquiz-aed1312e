

# Plano: Refatoracao Completa do QuestionsList — Cards Compactos com Icones Visiveis

## Diagnostico

Existe apenas **1 componente** `QuestionsList` em `src/components/quiz/QuestionsList.tsx`, usado em 2 lugares no `CreateQuiz.tsx` (desktop sidebar e mobile drawer). Nao ha duplicacao de componente.

O problema real e que o layout interno dos cards usa `flex items-center` com texto `truncate` (1 linha), mas o `truncate` nao esta funcionando corretamente — o texto empurra o botao de delete para fora do container. Isso acontece porque:
1. O container do card nao tem largura maxima restrita (`w-full` dentro de uma sidebar fixa)
2. O `flex-1 min-w-0` no div do texto deveria funcionar, mas o `overflow-hidden` no card pai pode estar conflitando
3. Faltam os icones de **editar (lapis)** e **excluir (lixeira)** visiveis — o botao de delete esta la mas fica invisivel por ser empurrado

## Solucao: Reescrever o layout dos cards

Manter a largura da sidebar como esta (`w-56 xl:w-64`). Refatorar apenas o layout interno de cada card em `QuestionsList.tsx`:

### Layout final de cada card:

```text
+--------------------------------------+
| [1●] Qual eh a sua faixa       [✏][🗑] |
|      etaria?                         |
+--------------------------------------+
```

- Badge numerico (flex-shrink-0, w-6 h-6)
- Texto: `line-clamp-2` (max 2 linhas, ~20 chars/linha), `text-left`, sem `truncate`
- Icones: `flex-shrink-0` em um div fixo a direita com `gap-0.5`
- Container: `flex items-start` (nao `items-center`) para alinhar badge e icones ao topo quando texto quebra

### Mudancas especificas no `QuestionsList.tsx`:

1. **Linha 163**: Trocar `flex items-center gap-1.5` por `flex items-start gap-1.5`
2. **Linha 222**: Trocar `truncate` por `line-clamp-2 break-words` no `<p>` do texto
3. **Adicionar icone Edit3 (lapis)** ao lado do Trash2, ambos em um `div flex-shrink-0 flex items-center gap-0.5`
4. **Import**: Adicionar `Edit3` do lucide-react
5. **Clicar no lapis**: entra em modo edicao inline (mesmo comportamento do `onDoubleClick`)
6. **Manter onDoubleClick** no texto tambem

### Estrutura JSX refatorada do card:

```tsx
<div className="w-full text-left p-2 rounded-md border overflow-hidden">
  <div className="flex items-start gap-1.5">
    {/* Badge */}
    <button onClick={click} className="flex-shrink-0 relative mt-0.5">
      <div className="w-6 h-6 rounded-full ...">
        {index + 1}
      </div>
      {isComplete && <span className="absolute ..." />}
    </button>

    {/* Texto — 2 linhas max */}
    <div
      className="flex-1 min-w-0 cursor-pointer"
      onClick={click}
      onDoubleClick={startEdit}
    >
      {isEditing ? (
        <Input ... />
      ) : (
        <p className="text-xs font-medium text-left line-clamp-2 break-words">
          {displayText}
        </p>
      )}
    </div>

    {/* Icones fixos */}
    <div className="flex-shrink-0 flex items-center gap-0.5 mt-0.5">
      <Button size="sm" variant="ghost" onClick={startEdit}
        className="h-5 w-5 p-0">
        <Edit3 className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={delete}
        className="h-5 w-5 p-0" disabled={questions.length <= 1}>
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  </div>
</div>
```

### Arquivo unico a editar:
- `src/components/quiz/QuestionsList.tsx`

### O que NAO sera tocado:
- `src/pages/CreateQuiz.tsx` (sidebar width e margins permanecem)
- `src/index.css` (nenhuma mudanca em CSS global)
- Nenhum outro componente

### Impacto:
- Cards ficam com altura variavel (1-2 linhas) mas nunca ultrapassam 2 linhas
- Icones de lapis e lixeira sempre visiveis, alinhados ao topo direito
- Funciona tanto no editor normal quanto no express mode
- Funciona tanto para templates (texto longo) quanto para quiz manual (texto curto/vazio)

