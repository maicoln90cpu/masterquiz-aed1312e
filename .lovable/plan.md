
Objetivo aprovado: parar o freeze do modo Modern na coluna 2 sem tocar no fluxo Classic, substituindo a coluna 2 atual por uma nova versão baseada 1:1 na lógica do dropdown “Adicionar” do BlockEditor (que hoje funciona).

Plano de implementação

1) Criar uma nova coluna 2 exclusiva do Modern
- Novo componente: `src/components/quiz/blocks/ModernBlockPalette.tsx`
- Sem reutilizar `CompactBlockPalette`.
- UI simples e determinística (lista por seções, sem HoverCard/TemplatePreview/Tooltips encadeados).
- Cada item chama apenas `onAddBlock(type)` com o mesmo conjunto de blocos do dropdown do BlockEditor:
  - Conteúdo: question, text, separator
  - Mídia: image, video, audio, gallery
  - Avançado: embed
  - Captura de dados: slider, textInput, nps
  - Apresentação: accordion, comparison, socialProof, testimonial, animatedCounter

2) Reaproveitar exatamente a lógica funcional do dropdown
- Criar fonte única de catálogo (itens/seções) para evitar divergência:
  - Ex.: `src/components/quiz/blocks/blockPaletteCatalog.ts`
- O `BlockEditor` dropdown e a nova `ModernBlockPalette` passam a consumir esse mesmo catálogo.
- A regra de adição permanece idêntica:
  - `createBlock(type, blocks.length)`
  - `updateCurrentQuestionBlocks([...blocks, newBlock])`
- Toast de sucesso padronizado com os mesmos labels do dropdown.

3) Trocar somente a integração do Modern
- Arquivo: `src/pages/CreateQuizModern.tsx`
- Remover import/uso de `CompactBlockPalette` no Step 3.
- Inserir `ModernBlockPalette` na coluna 2.
- Remover handlers de template da coluna 2 no Modern (`onAddTemplate` deixa de existir nesse fluxo).
- Manter Classic intacto (`CreateQuiz.tsx` continua com `CompactBlockPalette` sem alteração comportamental).

4) Garantias de isolamento (pedido “não mexer no Classic”)
- Não alterar render/handlers de `CreateQuiz.tsx`.
- Não alterar a estrutura da `CompactBlockPalette.tsx` (continua usada no Classic).
- Mudança restrita ao wiring Modern + novo componente.

5) Testes de regressão mínimos (focados no problema real)
- `ModernBlockPalette.test.tsx`
  - Clique em item chama `onAddBlock` com tipo correto.
  - Render das seções e itens esperados.
- Ajuste em `BlockEditor.test.tsx` (se necessário) apenas para validar que o dropdown continua operando com o mesmo catálogo compartilhado.
- Sem alterar testes de fluxo Classic.

O que será alterado
- Novo: `src/components/quiz/blocks/ModernBlockPalette.tsx`
- Novo: `src/components/quiz/blocks/blockPaletteCatalog.ts` (catálogo compartilhado)
- Editado: `src/components/quiz/blocks/BlockEditor.tsx` (consumo do catálogo, sem mudar lógica de add)
- Editado: `src/pages/CreateQuizModern.tsx` (substituição da coluna 2)

O que será melhorado
- Remove dependências visuais complexas da coluna 2 no Modern (principalmente interações que não existem no dropdown estável).
- Alinha 100% o caminho de adição do Modern com o caminho já comprovado do dropdown.
- Evita manter duas “verdades” de lista de blocos no futuro.

Vantagens
- Correção cirúrgica e previsível.
- Risco baixo de regressão no Classic.
- Manutenção mais simples (catálogo único para dropdown e coluna 2 modern).

Desvantagens / trade-offs
- A nova coluna 2 do Modern não terá templates/preview hover da `CompactBlockPalette` (foco em estabilidade).
- Ganho de robustez em troca de uma UI mais direta nessa coluna.

Checklist manual obrigatório (pós-implementação)
- [ ] Step 3 (Modern): clicar em cada item da nova coluna 2 e confirmar ausência total de freeze.
- [ ] Testar cliques rápidos consecutivos na coluna 2 (10+ adições) sem travamento.
- [ ] Confirmar que o dropdown “Adicionar” do editor central continua funcionando igual.
- [ ] Confirmar edição no painel de propriedades após adição por coluna 2.
- [ ] Confirmar reorder/delete de blocos após adição por coluna 2.
- [ ] Confirmar AutoSave/estado “não salvo/salvo” funcionando.
- [ ] Validar que o Classic segue intacto (coluna antiga + templates continuam funcionando lá).

Próximas fases
- Fase 15: teste end-to-end específico do Step 3 (Modern coluna 2 vs dropdown) com cenário de stress de cliques.
- Fase 16: lazy load de componentes pesados do editor de blocos para reduzir custo de re-render.
- Fase 17: profiling e memoização seletiva do painel de propriedades com métricas (antes/depois).
