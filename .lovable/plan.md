
Objetivo: corrigir regressões introduzidas nas 2 últimas fases (freeze ao aplicar alinhamento/formatação e painel de propriedades vazio no Step 3), com foco em estabilidade primeiro.

Diagnóstico (com base no código atual + print)
1) Painel de propriedades vazio
- Regressão de layout na COL 4 em `CreateQuizModern.tsx` (`h-0 min-h-full` + wrappers com overflow) combinada com `ScrollArea` do `BlockPropertiesPanel` sem cadeia de altura estável (`min-h-0`), causando viewport interno colapsado.
- Efeito colateral adicional: quando índice selecionado sai do range, o painel não se recupera bem.

2) Freeze ao usar alinhamento/fontes entre Etapa 2 e Etapa 3
- Herança global está sendo aplicada “na marra” em `handlePaletteAddBlock` para qualquer tipo de bloco (`alignment/fontSize/fontFamily`), inclusive tipos que não deveriam receber esses campos.
- Isso cria estados inválidos/inconsistentes para controles de propriedades de alguns blocos (especialmente selects com conjunto de valores limitado), aumentando re-renderizações e travamentos na edição.

Plano de correção (implementação)
Etapa A — Estabilização do painel de propriedades (prioridade máxima)
1. Ajustar estrutura da COL 4 em `CreateQuizModern.tsx`
- Trocar `h-0 min-h-full` por cadeia estável de flex-height:
  - container: `h-full min-h-0 flex flex-col`
  - área de conteúdo: `flex-1 min-h-0`
- Evitar overflow duplicado (outer + inner) para não colapsar viewport do conteúdo.

2. Ajustar `BlockPropertiesPanel.tsx` para scroll robusto
- Root: `h-full min-h-0 flex flex-col`.
- `ScrollArea`: `flex-1 min-h-0`.
- Garantir que conteúdo sempre renderize placeholder quando não houver bloco válido.

3. Proteger seleção de bloco (anti-estado inválido)
- Em `CreateQuizModern.tsx`, adicionar clamp do `selectedBlockIndex` quando:
  - troca de pergunta;
  - adição/remoção/reordenação de blocos.
- Regra: se índice atual > último índice disponível, reposicionar para último ou 0.

Etapa B — Corrigir propagação da Etapa 2 para Etapa 3 sem travar
4. Refatorar herança global de novos blocos
- Em `CreateQuizModern.tsx`, substituir aplicação genérica por aplicação tipada:
  - só aplicar campos suportados por cada tipo de bloco.
- Exemplo:
  - `text`: alignment + fontSize (+ fontFamily se suportado pelo bloco).
  - `question`: não injetar campos que o bloco não usa estruturalmente.
  - demais: manter sem “injeção” indevida.

5. Normalizar valores para evitar estados inválidos nos selects
- Em `BlockPropertiesPanel.tsx`, garantir fallback seguro quando valor atual não existir nas opções do select.
- Incluir validação para `fontSize` (incluindo `xl` onde suportado) e `fontFamily`.

6. Isolar regra de herança global em helper único
- Criar helper dedicado (ex.: `applyGlobalFormattingDefaults`) para centralizar regras e evitar regressões futuras.

O que vai mudar para o usuário após correção
- A coluna “Propriedades” volta a exibir conteúdo normalmente para qualquer bloco.
- Não haverá travamento ao configurar alinhamento/fonte e navegar entre Etapa 2 e 3.
- Novos blocos herdarão apenas formatação compatível com seu tipo, sem quebrar edição.

Vantagens
- Remove a causa estrutural do painel vazio.
- Elimina a principal fonte de inconsistência entre formatação global e propriedades por bloco.
- Reduz chance de regressão com regras centralizadas e tipadas.

Desvantagens / trade-offs
- Pequeno ajuste de comportamento: alguns blocos deixarão de receber herança “forçada” (para evitar estado inválido).
- Pode exigir ajuste fino em 1-2 blocos específicos para manter UX idêntica ao esperado.

Checklist manual (obrigatório)
1. Etapa 3: abrir quiz com 1 bloco e confirmar painel de propriedades sempre visível.
2. Adicionar/remover/reordenar blocos e verificar que propriedades acompanham seleção sem sumir.
3. Etapa 2: definir alinhamento global (centro), voltar à Etapa 3 e editar blocos com alinhamento/fonte sem freeze.
4. Testar troca de perguntas com quantidades diferentes de blocos e confirmar clamp do bloco selecionado.
5. Repetir em viewport desktop e notebook (com scroll nas colunas).

Pendências
- Após essa estabilização, seguimos para hardening final:
  - testes automatizados de seleção/clamp de bloco;
  - teste de regressão visual da coluna de propriedades;
  - validação de herança global por tipo de bloco (matriz de compatibilidade).
