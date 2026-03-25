
Objetivo imediato (hotfix): remover completamente a lógica de **formatação global (alinhamento/tamanho/família de fonte)** da Etapa 2 e neutralizar qualquer aplicação dessa configuração no editor/publicado para restaurar estabilidade.

1) Remoção total da lógica na Etapa 2 (UI + props)
- Arquivo: `src/components/quiz/AppearanceConfigStep.tsx`
  - Remover seção “Formatação Global” (3 selects + mini preview).
  - Remover props relacionadas: `globalTextAlign`, `globalFontSize`, `globalFontFamily` e callbacks.
  - Remover uso de `resolveFontFamily/resolveFontSize` no preview da etapa.
- Arquivo: `src/pages/CreateQuizModern.tsx`
  - Parar de passar props globais para `AppearanceConfigStep`.

2) Neutralizar efeito da formatação global no render (editor + quiz publicado)
- Arquivo: `src/components/quiz/QuizBlockPreview.tsx`
  - Remover props globais do componente.
  - Remover `globalStyle` aplicado no wrapper/card.
  - Renderizar blocos sem estilo tipográfico global.
- Arquivo: `src/components/quiz/view/QuizViewQuestion.tsx`
  - Parar de enviar `global_text_align/global_font_size/global_font_family` para `QuizBlockPreview`.

3) Remover acoplamento do estado/persistência com formatação global
- Arquivo: `src/hooks/useQuizState.ts`
  - Remover `globalTextAlign/globalFontSize/globalFontFamily` de `QuizAppearanceState`.
  - Remover defaults/reset dessas chaves.
- Arquivo: `src/hooks/useQuizPersistence.ts`
  - Parar de ler essas 3 colunas no `loadExistingQuiz` para estado da UI.
  - Parar de enviar essas 3 colunas em payloads de insert/update/save draft.
  - Compatibilidade: colunas no banco permanecem (sem migração), apenas ficam ignoradas.
- Arquivo: `src/types/quiz.ts`
  - Remover campos opcionais globais do tipo `Quiz` (ou marcar como legado com comentário, se necessário para compatibilidade de typing).

4) Limpeza técnica para evitar regressão
- Remover arquivo morto `src/lib/blockStyleEngine.ts` (não usado).
- Remover `src/lib/fontMap.ts` se ficar sem uso após o rollback.
- Ajustar `index.html` para retirar preload de fontes extras que só foram adicionadas para a feature global (opcional, mas recomendado para reduzir risco e peso).

5) Validação pós-correção (obrigatória)
- Fluxo principal:
  1. Entrar no `/create-quiz` (modo edição).
  2. Etapa 2: confirmar que não existe mais “Formatação Global”.
  3. Etapa 3: adicionar blocos `separator`, `banner`, `question` e clicar entre eles sem freeze.
  4. Verificar painel de propriedades sempre renderizando.
- Fluxo publicado:
  5. Publicar/abrir quiz e validar que tipografia/alinhamento seguem apenas comportamento nativo dos blocos (sem global forçado).

Vantagens
- Remove totalmente a superfície que está causando regressão recorrente.
- Restaura estabilidade do editor com menor risco.
- Simplifica manutenção imediata.

Desvantagens
- Perde a feature de padronização global de texto por enquanto.
- Quizzes antigos com valores globais salvos deixam de aplicar essa aparência (por design do rollback).

Pendência (futuro, fora deste hotfix)
- Reintroduzir formatação global apenas com arquitetura isolada (store de estilos separada), sem acoplamento com estrutura de bloco.
