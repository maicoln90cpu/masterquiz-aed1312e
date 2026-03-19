
Objetivo: parar o freeze da coluna 2 no modo modern sem “quebrar” o que já funciona no editor central.

Diagnóstico atualizado (com base no código atual):
- O `CompactBlockPalette` é o mesmo usado no classic (que funciona), então o problema tende a estar na integração do modern.
- No `CreateQuizModern.tsx`, a coluna 2 usa um fluxo diferente do classic (handlers com refs + `handleQuestionsUpdate` + `updateEditor({ selectedBlockIndex })`), enquanto o classic usa `updateCurrentQuestionBlocks` direto.
- No modern, ainda há updates em cadeia no Step 3 (coluna 2 + editor + painel de propriedades) com clonagem manual de `questions`, aumentando custo de render.

O que será alterado:
1) `src/pages/CreateQuizModern.tsx` — Migrar a coluna 2 para o mesmo fluxo do classic
- Remover handlers atuais da paleta baseados em `questionsRef/currentQuestionIndexRef`.
- Implementar handlers “cópia classic”: criar bloco/template e aplicar via `updateCurrentQuestionBlocks`.
- Remover auto-seleção imediata do bloco novo (`selectedBlockIndex` no clique da paleta), que é o principal candidato a amplificar o gargalo.
- Manter toast e comportamento visual equivalentes ao classic.

2) `src/pages/CreateQuizModern.tsx` — Unificar escrita de blocos no Step 3
- Trocar `BlockEditor onChange` para usar `updateCurrentQuestionBlocks(newBlocks)` (sem recriar array completo manualmente).
- No `BlockPropertiesPanel onChange`, atualizar só o bloco selecionado e persistir via `updateCurrentQuestionBlocks`.
- Garantir reindexação de `order` ao inserir templates.

3) Sem reescrever `CompactBlockPalette.tsx` agora
- Como ela já funciona no classic, evitamos retrabalho grande e focamos na diferença real: wiring do modern.

Melhorias esperadas:
- Menos cascata de renders no Step 3.
- Menos churn de estado (menos clonagem global de `questions`).
- Comportamento da coluna 2 alinhado ao caminho já estável do classic.

Vantagens:
- Correção com baixo risco e alta previsibilidade.
- Reuso do fluxo já validado em produção (classic).
- Preserva layout modern (4 colunas), sem regressão de UX estrutural.

Desvantagens / trade-off:
- Bloco adicionado pela coluna 2 não ficará mais auto-selecionado imediatamente (mesmo comportamento do classic).
- Se quisermos reintroduzir auto-seleção depois, faremos em fase separada com estratégia não bloqueante.

Checklist manual (obrigatório):
- [ ] Abrir Step 3 (modern) com 1920x1080 e adicionar 10+ blocos pela coluna 2 (Pergunta, Texto, Imagem, Vídeo, Áudio) sem freeze.
- [ ] Repetir adição rápida (cliques sequenciais) e confirmar UI responsiva.
- [ ] Validar que “Adicionar” dentro do BlockEditor continua funcionando.
- [ ] Validar painel de propriedades (edição de subtítulo, obrigatoriedade, auto-avanço) sem travar.
- [ ] Validar autosave/status “Não salvo/Salvo” e navegação entre perguntas.
- [ ] Validar template da coluna 2 (ex.: Pergunta com Imagem) com ordem correta dos blocos.

Próximas fases:
- Fase 15: E2E smoke tests focados em Step 3 (adição por coluna 2 vs botão interno).
- Fase 16: otimização de componentes pesados de edição (ex.: RichTextEditor) com carregamento sob demanda.
- Fase 17: memoização fina do painel de propriedades e blocos para reduzir custo por interação.
