
Objetivo da auditoria  
Validar por que o editor moderno (Step 3) está travando/crashando ao clicar em blocos (ex.: Acordeão FAQ), por que alguns blocos não entram no editor, e listar tudo que ainda falta implementar para estabilizar.

O que foi verificado (diagnóstico real)  
- Código auditado: `CreateQuizModern`, `BlockEditor`, `CompactBlockPalette`, `BlockPropertiesPanel` e os 22 blocos.  
- Evidência do print: Step 1 com `questionCount` alto (ex.: 6), mas Step 3 com apenas 1 pergunta.  
- Replay/logs do preview do usuário não trouxeram eventos úteis nessa captura (sem logs), então o diagnóstico foi por código + prints + estrutura de dados.

O que já foi alterado/melhorado (fase anterior já existente no código)  
- `BlockErrorBoundary` por bloco no `BlockEditor` (bom avanço de resiliência).  
- Separação inline vs propriedades já avançada nos 22 blocos.  
- Navegação superior e layout de 4 colunas em Step 3 já implantados.

Causas-raiz encontradas  
1) Inconsistência `questionCount` vs `questions.length` (causa principal de comportamento quebrado)  
- Hoje a inicialização só roda quando `questions.length === 0`.  
- Se houver 1 pergunta em memória e `questionCount` for 6, o Step 3 fica inconsistente (exatamente como seu print).

2) Adição de bloco com falha silenciosa  
- `onAddBlock` retorna sem feedback se a pergunta atual estiver inválida/fora de faixa (`currentQ` inexistente).  
- Para usuário parece “cliquei e nada aconteceu”.

3) Fragilidade de render em blocos com arrays obrigatórios  
- Alguns blocos usam `.map` direto sem normalização defensiva (`Accordion`, `Comparison`, `Gallery`, `Price`).  
- Dados legados/incompletos podem quebrar renderização.

4) Problema técnico grave em hooks (Video/Audio)  
- `useVideoStorage`/`useVideoProvider` estão sendo chamados em `try/catch` no componente.  
- Isso viola padrão seguro de hooks e pode gerar comportamento imprevisível/crash em runtime.

5) Painel de propriedades sem boundary próprio  
- Mesmo com boundary no bloco central, erro no `BlockPropertiesPanel` ainda pode derrubar Step 3.

Plano de correção (implementação imediata, em ordem)  
Fase A — Estabilização crítica (hotfix)  
1. Reconciliar perguntas ao entrar no Step 3  
   - Arquivo: `src/pages/CreateQuizModern.tsx`  
   - Criar rotina única de reconciliação:
     - Se `questions.length < questionCount`: completar com perguntas vazias até o total.
     - Se `questions.length > questionCount`: truncar com confirmação/estratégia definida.
     - Garantir `currentQuestionIndex` dentro do range.
   - Substituir lógica “só quando length===0”.

2. Tornar `onAddBlock`/`onAddTemplate` auto-recuperável  
   - Arquivo: `src/pages/CreateQuizModern.tsx`  
   - Se índice inválido: corrigir para `0` automaticamente e mostrar toast informativo.  
   - Nunca falhar silenciosamente.

3. Blindar dados dos blocos antes de renderizar  
   - Arquivos: `BlockEditor.tsx` + blocos com `.map`  
   - Normalizar arrays obrigatórios:
     - accordion.items
     - comparison.leftItems/rightItems
     - gallery.images
     - price.features
   - Fallbacks padrão em runtime para evitar crash por shape legado.

Fase B — Correção estrutural de crashes  
4. Corrigir hooks de Video/Audio  
   - Arquivos: `VideoBlock.tsx`, `AudioBlock.tsx`  
   - Remover hooks dentro de `try/catch`.  
   - Chamar hooks normalmente e tratar estado de erro/ausência no retorno (UI fallback), sem quebrar ordem de hooks.

5. Error boundary no painel de propriedades  
   - Arquivo: `CreateQuizModern.tsx` (coluna 4)  
   - Envolver `BlockPropertiesPanel` em boundary dedicado para evitar queda do Step 3 inteiro.

Fase C — Consistência final dos 22 blocos  
6. Matriz de compatibilidade por bloco (editor + properties + preview)  
   - Validar add/edit/delete/reorder + persistência + reload em todos os tipos.  
   - Marcar e corrigir qualquer bloco que ainda não reflita mudança em tempo real.

Detalhes técnicos (resumo direto)  
- Principal fix de lógica:
```text
enter_step3 -> reconcileQuestions(questionCount, questions)
  - enforce length
  - enforce currentQuestionIndex bounds
  - ensure each question has at least one question block
```
- Principal fix de resiliência:
```text
normalizeBlock(block):
  accordion.items ||= [...]
  comparison.leftItems ||= [...]
  comparison.rightItems ||= [...]
  gallery.images ||= []
  price.features ||= [...]
```
- Principal fix de runtime:
```text
VideoBlock/AudioBlock: hooks fora de try/catch + fallback de UI
```

Vantagens / Desvantagens  
Vantagens  
- Elimina travas silenciosas e inconsistência Step 1→Step 3.  
- Reduz crashes por dados legados/malformados.  
- Melhora previsibilidade: clique sempre gera ação ou feedback claro.

Desvantagens  
- Reconciliação pode truncar perguntas se `questionCount` for reduzido (precisa regra clara/confirm modal).  
- Pequeno aumento de código de normalização e validação.

Checklist manual de validação (obrigatório após implementar)  
1. Definir 5/6/10 perguntas no Step 1 e abrir Step 3: quantidade deve bater exatamente.  
2. Clicar em cada um dos 22 blocos na paleta: todos devem adicionar sem travar.  
3. Editar propriedades de cada bloco e verificar reflexo imediato no editor central.  
4. Reordenar e deletar blocos com DnD ativo sem congelamento.  
5. Salvar, recarregar e confirmar que nenhum bloco quebra ao reabrir.  
6. Testar com dados antigos (quiz legado) para garantir normalização sem crash.  
7. Teste end-to-end completo do fluxo 1→5 (incluindo mobile/desktop).

Tudo que ainda falta implementar (próximas fases após hotfix)  
- Fase 4: normalização/versionamento formal de schema de blocos no carregamento.  
- Fase 5: paridade total editor vs preview para os 22 blocos (incluindo edge cases).  
- Fase 6: suíte de testes automatizados por bloco (render + interação + persistência).  
- Fase 7: hardening de performance no histórico (undo/redo) para quizzes grandes.
