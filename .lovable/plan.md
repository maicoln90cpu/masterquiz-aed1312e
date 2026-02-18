
# Plano: Corrigir Evento first_quiz_created

## Problema Identificado

O evento GTM `first_quiz_created` e atualizado corretamente na maioria dos casos, mas ha dois gaps:

1. **`onboarding_status.first_quiz_created` nunca e setado para `true`** — o milestone de onboarding "Criar primeiro quiz" nunca aparece como completo na UI.

2. **Re-disparo do evento GTM** — se o usuario deletou todos os quizzes e publica um novo, a contagem retorna 0 e o evento dispara novamente (deveria ser unico por conta).

## Correcao

### Arquivo: `src/hooks/useQuizPersistence.ts`

Dentro do bloco `if (isFirstQuiz)` (linha 349), adicionar atualizacao do `onboarding_status`:

```typescript
if (isFirstQuiz) {
  // ... evento GTM existente ...
  // ... user_stage existente ...

  // Marcar milestone de onboarding
  await supabase
    .from('onboarding_status')
    .update({ first_quiz_created: true })
    .eq('id', user.id);
}
```

Para proteger contra re-disparo, usar `user_stage` como check mais robusto (em vez de contar quizzes ativos):

```typescript
// Antes de inserir o quiz, verificar user_stage
const { data: profile } = await supabase
  .from('profiles')
  .select('user_stage')
  .eq('id', user.id)
  .single();

const isFirstQuiz = profile?.user_stage === 'explorador';
```

Isso e mais confiavel porque `user_stage` nunca volta para `explorador` apos ser promovido.

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|----------|
| `src/hooks/useQuizPersistence.ts` | Usar `user_stage` para detectar primeiro quiz; atualizar `onboarding_status.first_quiz_created = true` |

## Impacto

- O milestone de onboarding sera marcado corretamente
- O evento GTM nao disparara mais de uma vez por conta
- Sem migrations necessarias
