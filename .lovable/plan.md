
# Plano: 6 Correcoes do Fluxo de Primeiro Acesso

## Diagnostico Detalhado

### Bug 1: Link do quiz sem slug na celebracao
**Causa raiz**: Em `CreateQuiz.tsx` linha 199-210, `handlePublish` chama `saveQuiz()` que retorna `true/false`. Dentro de `saveQuiz` (em `useQuizPersistence.ts` linha 386), o slug e atualizado via `updateEditor({ quizSlug: quiz.slug })` — porem isso e React state assíncrono. Quando `handlePublish` le `editorState.quizSlug` na linha 203, o state ainda nao foi atualizado, entao `slug = ''`, gerando URL como `https://masterquiz.com.br/quiz/` (sem slug) → 404.

**Correcao**: 
- `useQuizPersistence.ts`: Alterar `saveQuiz` para retornar `{ success: true, slug: quiz.slug }` em vez de `true`.
- `CreateQuiz.tsx`: Alterar `handlePublish` para ler o slug do retorno: `const result = await saveQuiz(); if (result?.slug) { buildUrl(result.slug); }`.

### Bug 2: Toggle de quiz publico — padronizar
**Estado atual**: Em `QuestionConfigStep.tsx` linhas 270-287, o toggle "Visibilidade do Quiz" esta presente e funciona. O `editorState.isPublic` e inicializado como `true` em `useQuizState.ts` linha 108. O template express em `Start.tsx` linha 105 cria o quiz com `is_public: false`. Quando o usuario chega no express mode, o toggle pode estar inconsistente.

**Correcao**: Garantir que no express mode o toggle comece como `true` (quiz publico por padrao), pois o usuario esta publicando. No `Start.tsx` linha 105, mudar `is_public: false` para `is_public: true`. E no express mode do `CreateQuiz.tsx`, remover o toggle de visibilidade (o quiz express sempre sera publico).

### Bug 3: Botoes Proxima/Anterior pouco visiveis
**Estado atual**: Em `QuestionConfigStep.tsx` linhas 290-321, os botoes usam `variant="outline" size="sm"` — discretos demais. O usuario pode nao notar.

**Correcao**: Tornar os botoes mais destacados:
- "Proxima": usar `variant="default"` (preenchido com cor primaria), tamanho `default`
- "Anterior": manter `variant="outline"` mas tamanho `default`
- Adicionar texto mais visivel e iconografia maior

### Bug 4: "Ver como divulgar" → "Divulgar meu Quiz"
**Estado atual**: Em `ExpressCelebration.tsx` linhas 131-149, o botao "Ver como divulgar" redireciona para `/integrations` — pagina tecnica demais para primeiro acesso. O usuario precisa de compartilhamento social simples.

**Correcao**: 
- Trocar texto para "Divulgar meu Quiz"
- Em vez de navegar para `/integrations`, abrir um mini-painel inline com botoes de compartilhamento: WhatsApp, copiar link (ja existe), redes sociais (Facebook, Twitter/X, LinkedIn) usando URLs de share nativas (`https://wa.me/?text=...`, `https://www.facebook.com/sharer/...` etc).
- Remover o texto "Proximo passo: Envie trafego para comecar a capturar leads" pois e prematuro.

### Bug 5: Templates de primeiro acesso com 12 perguntas → reduzir para 6-8
**Estado atual**: Todos os 9 templates base em `src/data/templates/` tem `questionCount: 12` e 12 perguntas cada. Para primeiro acesso via `/start`, isso e muito. O usuario quer publicar rapido.

**Correcao**: Como os templates sao usados tanto no `/start` (express) quanto no editor completo, nao devemos reduzir os templates em si. Em vez disso, no `Start.tsx`, ao criar o quiz, limitar as perguntas inseridas para no maximo 8 (pegar as primeiras 8 do template). Isso mantem os templates completos para uso normal mas encurta o express.

Alterar `Start.tsx` linhas 118-126:
```
const maxExpressQuestions = 8;
const limitedQuestions = template.config.questions.slice(0, maxExpressQuestions);
const questionsToInsert = limitedQuestions.map(...)
```
E atualizar `question_count` na linha 103 para `limitedQuestions.length`.

### Bug 6: Sidebar de perguntas no express mode
**Estado atual**: Em `CreateQuiz.tsx` linhas 396 e 412, a sidebar e explicitamente escondida com `{!isExpressMode && (...)}`. O usuario nao tem como navegar visualmente pelas perguntas.

**Correcao**: Mostrar a sidebar no express mode. Remover a condicao `!isExpressMode` das linhas 396 e 412, e ajustar o margin-left do editor (linha 513) para tambem aplicar no express mode.

---

## Arquivos a Alterar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useQuizPersistence.ts` | `saveQuiz` retorna `{ success, slug }` em vez de `boolean` |
| `src/pages/CreateQuiz.tsx` | `handlePublish` usa slug do retorno; mostra sidebar no express; ajusta margins |
| `src/components/quiz/QuestionConfigStep.tsx` | Botoes Proxima/Anterior mais destacados |
| `src/components/quiz/ExpressCelebration.tsx` | "Divulgar meu Quiz" com share social inline |
| `src/pages/Start.tsx` | Limitar perguntas a 8 no express; `is_public: true` |

## Detalhamento Tecnico

### useQuizPersistence.ts
Linha 508: `return true` → `return { success: true, slug: quiz.slug }`
Linha 514: `return false` → `return { success: false, slug: '' }`
Tipo de retorno: `Promise<{ success: boolean; slug: string }>`

### CreateQuiz.tsx — handlePublish
```typescript
const handlePublish = useCallback(async () => {
  const result = await saveQuiz();
  if (result?.success && isExpressMode) {
    const slug = result.slug;
    const url = profile?.company_slug
      ? `${window.location.origin}/${profile.company_slug}/${slug}`
      : `${window.location.origin}/quiz/${slug}`;
    setPublishedQuizUrl(url);
    setShowCelebration(true);
  }
}, [saveQuiz, isExpressMode, profile?.company_slug]);
```

### CreateQuiz.tsx — Sidebar no express
Remover `!isExpressMode &&` das linhas 396 e 412. Manter a paleta de blocos escondida (linha 440).

### QuestionConfigStep.tsx — Botoes destacados
```tsx
<Button variant="outline" size="default" ...>
  <ChevronLeft className="h-5 w-5 mr-2" /> Anterior
</Button>
<Button variant="default" size="default" ...>
  Proxima <ChevronRight className="h-5 w-5 ml-2" />
</Button>
```

### ExpressCelebration.tsx — Share social
Substituir o bloco "Proximo passo" por painel de compartilhamento:
- Botao WhatsApp: `https://wa.me/?text=Faca+meu+quiz:+${encodeURIComponent(quizUrl)}`
- Botao Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(quizUrl)}`
- Botao Twitter/X: `https://twitter.com/intent/tweet?url=${encodeURIComponent(quizUrl)}&text=...`
- Botao LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}`
- Texto: "Compartilhe seu quiz nas redes sociais"

### Start.tsx — Limitar perguntas
```typescript
const maxExpressQuestions = 8;
const limitedQuestions = template.config.questions.slice(0, maxExpressQuestions);
// question_count: limitedQuestions.length
// questionsToInsert = limitedQuestions.map(...)
```
E `is_public: true` na insercao do quiz.
