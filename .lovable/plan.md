

## Plano: 3 Correções no Editor de Quiz

---

### Diagnóstico Detalhado

**1) Blocos sumiram do quiz "Mãe Consciente" — CAUSA RAIZ IDENTIFICADA**

O `useEffect` de reconciliação em `CreateQuizModern.tsx` (linhas 283-313) é o culpado. O fluxo:

1. `loadExistingQuiz` seta `step: 3` e `isLoadingQuiz: false` quase simultaneamente
2. O `useEffect` dispara quando `step >= 3 && !isLoadingQuiz`
3. Nesse momento, `questions.length === 0` porque o `setQuestions` do hook `useHistory` tem **debounce de 500ms** — as perguntas carregadas ainda não chegaram ao estado
4. O effect chama `initializeEmptyQuestions(16)` → cria 16 perguntas vazias
5. As perguntas vazias sobrescrevem as reais quando o debounce resolve
6. O auto-save persiste as perguntas vazias no banco

Confirmação: a query no banco mostra todas as 16 perguntas com `blocks_count: 1` e `question_text: ""`. Os IDs antigos (com conteúdo real) foram deletados pelo upsert no saveQuiz.

**Restauração**: Os dados originais do quiz foram sobrescritos no banco. Não há backup automático das perguntas anteriores. A restauração precisa ser feita via o **Histórico do Lovable** (revert para uma versão anterior do projeto) ou re-inserção manual do conteúdo.

**2) Bloco Progresso sem campo de texto/frase**

Confirmado: `ProgressProperties` (linhas 751-788) NÃO tem um campo para editar `block.label`. O `ProgressBlockPreview` (linha 141) renderiza `{block.label && <p>...}` mas nunca há como definir esse valor.

**3) Propriedades não fazem scroll pro topo ao clicar em bloco**

O `useEffect` (linhas 272-280) faz `querySelector('.overflow-y-auto').scrollTo(0, 0)`. Porém, o container `overflow-y-auto` é um wrapper, e o scroll real acontece dentro do `<ScrollArea>` do RadixUI (que usa um viewport interno). O `scrollTo` está atuando no elemento errado — o viewport do ScrollArea tem sua própria estrutura DOM.

---

### Correções

#### 1. Corrigir race condition na reconciliação — CRÍTICO

**Arquivo: `src/pages/CreateQuizModern.tsx`**

No `useEffect` de reconciliação (linhas 283-313), adicionar guard: só executar se `questions` já foram carregadas pelo `loadExistingQuiz`. Duas mudanças:
- Adicionar um ref `quizLoadedRef` que é setado como `true` somente APÓS `loadExistingQuiz` completar com sucesso e as questions forem populadas
- No `useEffect` de reconciliação, verificar `quizLoadedRef.current` em modo de edição — se for `isEditMode && !quizLoadedRef.current`, não executar
- Na lógica do `loadExistingQuiz` callback (dentro do `useEffect` que chama `loadExistingQuiz`), setar o ref após a chamada

Isso previne que o reconciliation effect crie perguntas vazias antes das reais chegarem.

#### 2. Restaurar quiz "Mãe Consciente"

Como os dados foram sobrescritos no banco, a restauração via código não é possível sem um backup. O caminho mais seguro é usar o **Histórico do Lovable** para reverter a um ponto onde os dados estavam intactos, e então re-publicar o quiz.

Alternativamente, posso criar um script SQL para verificar se existe algum snapshot anterior ou se o conteúdo pode ser recuperado de outra tabela.

#### 3. Adicionar campo "Texto/Frase" no bloco Progresso

**Arquivo: `src/components/quiz/blocks/BlockPropertiesPanel.tsx`**

Dentro de `ProgressProperties` (após linha 753), adicionar:
```
<PropertySection title="Texto/Frase" tooltip="Texto exibido junto à barra de progresso">
  <Input value={block.label || ''} placeholder="Ex: Continue para ver seu resultado!" onChange={(e) => onChange(update(block, { label: e.target.value }))} />
</PropertySection>
```

#### 4. Corrigir auto-scroll do painel de propriedades

**Arquivo: `src/pages/CreateQuizModern.tsx`**

Substituir a lógica do `useEffect` (linhas 272-280). Em vez de `querySelector('.overflow-y-auto')`, buscar o viewport do `ScrollArea` do RadixUI usando `querySelector('[data-radix-scroll-area-viewport]')`. Esse é o elemento que realmente possui scroll no componente ScrollArea.

**Alternativa mais robusta**: Adicionar `data-properties-scroll` no `<ScrollArea>` dentro de `BlockPropertiesPanel.tsx` e usar esse seletor no `CreateQuizModern.tsx`.

---

### Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/CreateQuizModern.tsx` | Guard na reconciliação + fix do scroll selector |
| `src/components/quiz/blocks/BlockPropertiesPanel.tsx` | Campo label no ProgressProperties + data-attribute no ScrollArea |

### Vantagens
- Previne perda de dados em qualquer quiz futuro (race condition eliminada)
- Campo de texto no Progresso permite personalização que já era suportada no preview
- Scroll automático garante UX profissional ao navegar entre blocos

### Desvantagens
- Os dados do quiz "Mãe Consciente" precisam ser re-inseridos manualmente ou restaurados via Histórico do Lovable (não há backup automático de conteúdo de perguntas)

