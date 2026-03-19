

## Fix: Browser Freeze ao Deletar Bloco no Modo Modern

### Causa Raiz

No `SortableBlock` (dentro de `BlockEditor.tsx`), o botão de delete (linha 284) **não tem `e.stopPropagation()`**. Isso faz com que o click propague para o `div` pai (linha 218), que chama `onBlockSelect(blockIndex)`.

Resultado: ao clicar em deletar, **duas ações disparam simultaneamente**:
1. `onDelete()` → `deleteBlock()` → `onChange(reindexedBlocks)` → `updateCurrentQuestionBlocks`
2. `onBlockSelect(blockIndex)` → `updateEditor({ selectedBlockIndex })` → re-render do `BlockPropertiesPanel`

Isso cria a mesma cascata de re-renders que travava a paleta. O `selectedBlockIndex` aponta para um bloco que acabou de ser removido, e o `BlockPropertiesPanel` tenta renderizar com dados inconsistentes, amplificando o loop.

No Classic isso não causa freeze porque não existe `onBlockSelect` nem `BlockPropertiesPanel`.

### Correção (1 arquivo)

**`src/components/quiz/blocks/BlockEditor.tsx`** — Linha 284:

Adicionar `e.stopPropagation()` no `onClick` do botão de delete para impedir a propagação ao div pai:

```tsx
// Antes:
onClick={onDelete}

// Depois:
onClick={(e) => { e.stopPropagation(); onDelete(); }}
```

Opcionalmente, também resetar o `selectedBlockIndex` após deleção no `deleteBlock` (via um callback opcional), mas o `stopPropagation` sozinho já resolve o problema fundamental.

### Checklist
- [ ] Deletar bloco sem freeze
- [ ] Confirmar que clicar no bloco (sem deletar) ainda seleciona corretamente
- [ ] Adicionar bloco pela coluna 2 continua funcionando
- [ ] Dropdown "Adicionar" continua funcionando

