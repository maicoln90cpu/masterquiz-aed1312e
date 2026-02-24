
Objetivo: eliminar de forma definitiva o erro recorrente `duplicate key value violates unique constraint "quiz_questions_quiz_id_order_number_key"` que continua aparecendo no banco após a última correção.

Diagnóstico consolidado (com base no código atual + prints enviados):
1) A correção aplicada em `useAutoSave.ts` foi feita corretamente (troca de `upsert` para `DELETE + INSERT`).
2) Porém ainda existe outro writer ativo para `quiz_questions` em `src/components/quiz/QuestionConfigStep.tsx`:
   - `saveCurrentQuestion()` faz `.upsert([dataToUpsert])` direto na tabela.
   - Esse save é disparado por debounce (2s) durante edição de blocos/condições.
3) O editor hoje tem múltiplas rotas de persistência concorrentes:
   - Auto-save global (`useAutoSave`) a cada janela de debounce.
   - Save por pergunta (`QuestionConfigStep`).
   - Save manual (`saveDraftToSupabase`).
4) Com edições contínuas, esses fluxos competem entre si (race condition), e o conflito no índice único por `(quiz_id, order_number)` continua possível mesmo após a primeira correção.

Plano de correção (implementação em etapas):
1) Unificar a persistência de `quiz_questions` em um único fluxo
   - Remover escrita direta no banco de `QuestionConfigStep` (eliminar `upsert` nessa tela).
   - Manter `QuestionConfigStep` apenas como editor de estado local + `onQuestionsUpdate`.
   - Persistência final passa a ser centralizada em `useQuizPersistence/useAutoSave` e save manual.

2) Endurecer o auto-save para concorrência
   - Em `useAutoSave.ts`, manter `DELETE + INSERT`, mas adicionar proteção extra:
     - lock de execução já existe (`isSavingRef`), manter.
     - ignorar save quando payload não mudou (hash/snapshot simples), para reduzir escrita desnecessária.
   - Garantir que `order_number` sempre seja 0-based e consistente com `questions` atual.

3) Corrigir pontos de save pontual na etapa de perguntas
   - Em `QuestionConfigStep.tsx`:
     - remover `saveTimeoutRef` e chamadas de `saveCurrentQuestion(false)`.
     - manter apenas atualização de estado do parent.
   - Opcional de UX: mostrar aviso “Alterações serão salvas automaticamente”.

4) Auditoria de todos os writers de `quiz_questions`
   - Revisar e alinhar os pontos:
     - `useAutoSave.ts` (global)
     - `useQuizPersistence.ts` (manual/publicar)
     - `QuestionConfigStep.tsx` (remover escrita)
     - `QuizActions.tsx` (legado; confirmar não utilizado e evitar reuso acidental)
   - Resultado esperado: apenas 2 rotas válidas de escrita (auto-save central + save manual/publicar).

5) Validação operacional pós-ajuste
   - Testar edição contínua por >10 min com o quiz aberto.
   - Confirmar no Supabase logs:
     - zero novos `23505` para `quiz_questions_quiz_id_order_number_key`
     - zero `409` em `/rest/v1/quiz_questions` relacionados a esse conflito.

Checklist manual (item a item):
1) Fluxo de edição contínua
   - [ ] Abrir `/create-quiz?id=...`
   - [ ] Editar blocos por 3-5 minutos sem parar
   - [ ] Confirmar que bolinha de auto-save alterna para “salvo” sem erro

2) Save manual
   - [ ] Clicar “Salvar” durante edição
   - [ ] Confirmar toast de sucesso
   - [ ] Recarregar página e validar persistência completa

3) Publicado vs rascunho
   - [ ] Repetir teste em quiz draft
   - [ ] Repetir teste em quiz publicado
   - [ ] Confirmar que ambos salvam sem gerar conflitos

4) Logs backend (janela de 10 min)
   - [ ] Filtrar `level:error,warning`
   - [ ] Confirmar ausência de `duplicate key value violates unique constraint "quiz_questions_quiz_id_order_number_key"`
   - [ ] Confirmar ausência de `409` correlato em `/rest/v1/quiz_questions`

5) Regressão funcional
   - [ ] Adicionar/remover pergunta
   - [ ] Reordenar blocos
   - [ ] Alterar condições
   - [ ] Validar que nada “some” após refresh

Risco e mitigação:
- Risco: remover save por pergunta pode dar sensação de “menos imediato”.
- Mitigação: reforçar feedback visual do auto-save e manter botão “Salvar” manual sempre disponível.

Entrega prevista:
- Correção de código em 2 arquivos principais (`QuestionConfigStep.tsx` e `useAutoSave.ts`) + revisão de chamadas.
- Auditoria final com checklist executável e validação de logs em janela real de 10 minutos.
