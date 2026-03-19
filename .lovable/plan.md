

## Diagnóstico: Browser Freeze ao Adicionar Blocos pela Paleta (Coluna 2)

### Problema Identificado

Após análise extensiva do código, o problema mais provável é uma **cascata de re-renders instáveis** causada por:

1. **Callbacks inline no `useAutoSave`** (em `useQuizPersistence.ts` linhas 81-86): `onSaveComplete` e `onSaveError` são arrow functions inline, recriadas a cada render. Isso faz `performSave` → `scheduleAutoSave` mudarem de identidade a cada render, causando re-fires desnecessários do useEffect de persistência (linha 90-129).

2. **Closures recriadas a cada render no `CreateQuizModern`** (linhas 681-730): Os handlers `onAddBlock` e `onAddTemplate` passados à `CompactBlockPalette` capturam `questions` e são recriados a cada render. Combinado com o ponto 1, a paleta dispara um update → re-render → novo `scheduleAutoSave` → useEffect re-fire → `JSON.stringify` do quiz inteiro → `setStatus`/`setHasUnsavedChanges` → mais re-renders.

3. **A diferença chave**: O handler da paleta chama `handleQuestionsUpdate` **E** `updateEditor({ selectedBlockIndex })`, enquanto o dropdown do BlockEditor só chama `onChange`. O `selectedBlockIndex` muda → `BlockPropertiesPanel` re-render com novo bloco → `onChange` inline do painel (linha 806) recria closure → componentes pesados remontam. Isso amplifica a cascata.

### Plano de Correção

**Arquivo 1: `src/hooks/useQuizPersistence.ts`**
- Estabilizar os callbacks `onSaveComplete` e `onSaveError` usando `useCallback` ou refs, impedindo que `scheduleAutoSave` mude de identidade a cada render.

**Arquivo 2: `src/pages/CreateQuizModern.tsx`**
- Extrair `onAddBlock` e `onAddTemplate` da paleta como `useCallback` estáveis (usando refs para `questions` e `currentQuestionIndex`).
- Memoizar a `CompactBlockPalette` com `React.memo` para evitar re-renders desnecessários quando apenas `questions` muda internamente.

**Arquivo 3: `src/components/quiz/blocks/CompactBlockPalette.tsx`**
- Envolver o export com `React.memo` para evitar re-renders quando props não mudam.
- Memoizar os arrays `blockTypes` e `templates` com `useMemo`.

**Arquivo 4: `src/hooks/useAutoSave.ts`**
- Usar `useRef` para armazenar `onSaveComplete`, `onSaveError`, `onSaveStart` ao invés de incluí-los como dependências dos callbacks. Isso estabiliza `performSave` e consequentemente `scheduleAutoSave`.

### Impacto Esperado
- Eliminar a cascata de re-renders que congela o browser
- Estabilizar identidade de funções para evitar re-fires de useEffects
- Sem mudança de funcionalidade — apenas otimização de performance

### Checklist Manual Pós-Implementação
- [ ] Adicionar bloco pela paleta (coluna 2) sem travamento
- [ ] Adicionar bloco pelo dropdown do BlockEditor (deve continuar funcionando)
- [ ] AutoSave continua funcionando normalmente
- [ ] Undo/Redo não afetado
- [ ] Properties Panel atualiza ao selecionar blocos

### Próximas Fases
- **Fase 16**: Otimização de `framer-motion` imports (tree-shaking)
- **Fase 17**: Memoização do `BlockPropertiesPanel` e sub-componentes pesados

