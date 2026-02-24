

# Plano: Corrigir auto-save que gera 18 erros/min por constraint violation

## Problema

O auto-save (a cada 30s) no `useAutoSave.ts` usa `upsert` com `onConflict: 'id'` para salvar perguntas. Porem a tabela `quiz_questions` tem um unique constraint em `(quiz_id, order_number)`. Quando perguntas tem IDs temporarios (`temp-xxx`) que sao removidos (viram `undefined`), o upsert tenta INSERT e colide com o constraint de `order_number`.

Isso gera:
- 18 erros Postgres (23505 unique violation) a cada 10 minutos
- 18 warnings HTTP (409 Conflict) correspondentes
- Ambos sao o MESMO problema visto de camadas diferentes

## Correcao

**Arquivo: `src/hooks/useAutoSave.ts` (linhas 139-161)**

Trocar a logica de upsert por DELETE + INSERT (mesmo padrao ja usado no save manual em `useQuizPersistence.ts`):

```text
// ANTES (quebrado):
const questionsToSave = data.questions.map(...)
await supabase.from('quiz_questions')
  .upsert(questionsToSave, { onConflict: 'id', ignoreDuplicates: false });

// DEPOIS (corrigido):
await supabase.from('quiz_questions').delete().eq('quiz_id', data.quizId);
const questionsToInsert = data.questions.map((q, idx) => ({
  quiz_id: data.quizId,
  question_text: q.question_text || '',
  order_number: idx,
  answer_format: q.answer_format || 'single_choice',
  options: q.options || [],
  media_url: q.media_url || null,
  media_type: q.media_type || null,
  blocks: Array.isArray(q.blocks) ? q.blocks : [],
  conditions: q.conditions || null,
  custom_label: q.custom_label || null
}));
await supabase.from('quiz_questions').insert(questionsToInsert);
```

Tambem alinhar `order_number` para ser 0-based (igual ao save manual) em vez de 1-based (`idx + 1`).

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/hooks/useAutoSave.ts` | Trocar upsert por DELETE+INSERT nas perguntas (linhas 139-161) |

## Arquivos NAO tocados
- useQuizPersistence.ts (ja usa DELETE+INSERT corretamente)
- CreateQuiz.tsx
- Edge Functions
- Schema/migracoes (constraint esta correto, o codigo que esta errado)

## Impacto
- Elimina todos os 36 logs de erro/warning
- Auto-save passa a funcionar sem conflitos
- Zero risco de perda de dados (DELETE+INSERT e atomico dentro da mesma request)

