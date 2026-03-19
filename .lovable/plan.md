

# Plano: Refazer Layout Step 3 do Modern Mode — 4 Colunas Full-Width

## Problema Atual

1. **Layout não ocupa tela inteira** — Step 3 está dentro de `container mx-auto max-w-4xl px-4 py-6`, desperdiçando espaço lateral
2. **Faltam 4 colunas** — O layout correto deve ser: Lista de Perguntas | Blocos da Pergunta (BlockEditor com botão "+ Adicionar") | Preview/Editor inline | Propriedades
3. **Coluna de blocos ausente** — O `QuestionConfigStep` embute o `BlockEditor` dentro de um Card com header, navegação e tabs, sem separação visual. O usuário não consegue adicionar novos blocos facilmente
4. **A coluna central duplica controles** — `QuestionConfigStep` inclui navegação entre perguntas (Anterior/Próxima) e visibilidade do quiz, que são redundantes no layout de 4 colunas

## Solução

Reescrever a seção Step 3 de `CreateQuizModern.tsx` para usar layout full-width com 4 colunas distintas, extraindo o `BlockEditor` diretamente em vez de usar `QuestionConfigStep` (que foi feito para o Classic mode).

### Estrutura das 4 colunas

```text
┌──────────┬────────────────────────────────┬──────────────┐
│ Perguntas│  Editor (BlockEditor direto)   │ Propriedades │
│  (220px) │  com "+ Adicionar" bloco       │   (280px)    │
│          │  (flex-1)                      │              │
└──────────┴────────────────────────────────┴──────────────┘
```

Nota: serão 3 colunas visuais (não 4) pois o "editor de blocos" e o "preview" ficam como tabs dentro da coluna central, como já está no Classic. A diferença é que agora a coluna central mostra o `BlockEditor` diretamente, sem o wrapper `QuestionConfigStep`.

### Mudanças detalhadas

**Arquivo: `src/pages/CreateQuizModern.tsx`**

1. **Step 3 full-width**: Remover `container mx-auto max-w-4xl px-4 py-6` do wrapper do Step 3 — usar `flex-1 overflow-hidden` com `h-full`
2. **Remover `QuestionConfigStep`** do Step 3 Modern — substituir por uso direto de `BlockEditor` com as props corretas (`blocks`, `onChange`, `onBlockSelect`, `selectedBlockIndex`)
3. **Coluna esquerda** (lista de perguntas): Manter como está, mas com altura `h-full` em vez de `sticky top-4`
4. **Coluna central**: `BlockEditor` diretamente + tabs Edit/Preview + barra de navegação compacta (Pergunta X de Y) + visibilidade do quiz
5. **Coluna direita** (propriedades): Manter `BlockPropertiesPanel` como está, ajustar para `h-full`
6. **Wrapper do conteúdo**: Quando `step === 3`, usar `flex-1 overflow-hidden` no container principal em vez de `overflow-auto` com padding

**Passagem de props para BlockEditor**:
- `blocks={currentQuestion.blocks}`
- `onChange={updateCurrentQuestionBlocks}` (já existe no hook)
- `onBlockSelect={(idx) => updateEditor({ selectedBlockIndex: idx })}`
- `selectedBlockIndex={editorState.selectedBlockIndex}`

Isso garante que ao clicar num bloco, o painel direito atualiza; e o botão "+ Adicionar" do BlockEditor fica acessível.

### O que NÃO muda
- Steps 1, 2, 4, 5 continuam com `container max-w-4xl`
- Classic mode intacto
- `QuestionConfigStep` continua existindo para o Classic
- `BlockPropertiesPanel` sem alterações
- Express mode continua sem colunas laterais

### Checklist pós-implementação
- [ ] Step 3 ocupa toda a largura da tela
- [ ] Lista de perguntas à esquerda permite navegar e adicionar
- [ ] Centro mostra BlockEditor com botão "+ Adicionar" bloco
- [ ] Painel de propriedades à direita atualiza ao clicar num bloco
- [ ] Navegação entre perguntas funciona (via coluna esquerda)
- [ ] Steps 1, 2, 4, 5 mantêm layout centralizado
- [ ] Classic mode inalterado
- [ ] Express mode sem colunas laterais

### Itens pendentes para fases seguintes
- **Fase 3** (blocos): Separação completa inline vs. propriedades nos 22 tipos de bloco — parcialmente feita no `BlockPropertiesPanel`, falta integrar com o editor central
- **Fase 4**: Express mode adaptado ao Modern
- **Fase 5**: Mobile responsivo, testes A/B

