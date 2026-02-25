

# Plano: Ajuste Horizontal dos Cards, Quebra de Texto e Edição por Duplo Clique

## Problema 1: Cards ocupam espaço horizontal demais
A sidebar tem `w-64 xl:w-72` (256px / 288px). Os cards dentro dela expandem horizontalmente com metadados (ícones de tipo, contador de blocos, indicador de completude) + texto + botões de ação, causando overflow que invade a coluna de edição de blocos adjacente.

**Correção**: Reduzir a sidebar para `w-56 xl:w-64` (224px / 256px). Simplificar os metadados dos cards — remover a linha de ícones de tipo/blocos e manter apenas o número, texto e botões. Isso libera ~32px horizontais.

Arquivo: `src/pages/CreateQuiz.tsx` — alterar `w-64 xl:w-72` para `w-56 xl:w-64` e ajustar `ml-64 xl:ml-72` correspondente.

## Problema 2: Texto longo empurra ícones
Quando o texto da pergunta é grande, ele empurra os botões de editar/excluir para fora do viewport.

**Correção**: No `QuestionsList.tsx`, o texto da pergunta já usa `truncate` (linha 246), mas o container pai `button` com `flex-1 min-w-0` pode não estar restringindo corretamente. A solução é:
- Adicionar `overflow-hidden` ao container do card
- Garantir que o texto use `break-all` ou `truncate` com `max-w` calculado
- Remover a linha inteira de metadados (tipo, blocos, completude) para economizar espaço — mover indicador de completude para o badge numérico

## Problema 3: Texto alinhado à esquerda
O texto já está em `text-left` no container, mas o `truncate` com `mt-0.5` pode dar impressão de desalinhamento. Garantir `text-left` explícito no div do texto.

## Problema 4: Duplo clique para editar
Substituir o botão de Edit3 por duplo clique (`onDoubleClick`) no texto da pergunta. Ao dar double-click, entrar no modo de edição inline (que já existe). Remover o botão de editar separado para economizar espaço horizontal.

---

## Implementação Detalhada

### `src/pages/CreateQuiz.tsx`
- Linha 396: `w-64 xl:w-72` → `w-56 xl:w-64`
- Linha 513 (margin-left do editor): `ml-64 xl:ml-72` → `ml-56 xl:ml-64`
- Qualquer outra referência a essas larguras no mesmo arquivo

### `src/components/quiz/QuestionsList.tsx`
Redesenhar cada card para layout ultra-compacto:

```
[1] Qual é o objetivo pr... [🗑]
```

Mudanças:
1. **Remover linha de metadados** (linhas 203-214) — ícone de tipo, indicador de completude, contador de blocos. Mover indicador de completude (bolinha verde) para dentro do badge numérico.
2. **Remover botão Edit3** (linhas 263-275) — substituir por `onDoubleClick` no texto
3. **Texto com truncate rigoroso** — `truncate` já existe, mas adicionar `max-w-[calc(100%-2rem)]` para garantir espaço para o botão de delete
4. **Adicionar `onDoubleClick`** no div do texto (linha 246): ao dar duplo clique, entrar em modo edição (setar `editingIndex` e `editingLabel`)
5. **Alinhar texto à esquerda**: garantir `text-left` no container de texto

Layout final de cada card:
```tsx
<div className="w-full p-1.5 rounded-md border overflow-hidden">
  <div className="flex items-center gap-1.5">
    {/* Badge número + completude */}
    <div className="flex-shrink-0 w-5 h-5 rounded-full ...">
      {index + 1}
      {isComplete && <span className="absolute ...green dot" />}
    </div>
    
    {/* Texto — duplo clique para editar */}
    <div 
      className="flex-1 min-w-0 text-xs text-left truncate"
      onDoubleClick={() => { setEditingIndex(index); setEditingLabel(...); }}
    >
      {isEditing ? <Input .../> : displayText}
    </div>
    
    {/* Apenas botão delete */}
    <Button className="flex-shrink-0 h-5 w-5 p-0" onClick={delete}>
      <Trash2 className="h-3 w-3" />
    </Button>
  </div>
</div>
```

---

## Resumo

| Arquivo | Mudança |
|---------|---------|
| `src/pages/CreateQuiz.tsx` | Sidebar `w-56 xl:w-64`, margin correspondente |
| `src/components/quiz/QuestionsList.tsx` | Cards compactos: remover metadados, remover botão edit, adicionar onDoubleClick, truncate rigoroso, text-left |

