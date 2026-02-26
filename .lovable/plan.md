

# Plano: Fix Loop Infinito Express + Cores dos Botoes

## 1. Bug Critico: Loop Infinito /start → Dashboard → /start

### Causa Raiz (2 bugs combinados)

**Bug A — user_stage nunca atualiza no fluxo express:**

Em `src/hooks/useQuizPersistence.ts`, a funcao `saveQuiz()` tem dois branches:
- **INSERT** (quiz novo, linhas 314-383): Detecta primeiro quiz (`isFirstQuiz`), atualiza `user_stage` de 'explorador' para 'construtor', dispara GTM
- **UPDATE** (quiz existente, linhas 289-313): NAO faz nada disso

O fluxo express cria o quiz em `Start.tsx` (INSERT direto no Supabase com status 'draft'), depois no editor chama `saveQuiz()` que entra no branch UPDATE (porque `currentQuizId` ja existe). Resultado: `user_stage` permanece 'explorador' para sempre.

**Bug B — Dashboard redireciona antes dos stats carregarem:**

Em `src/pages/Dashboard.tsx` linha 100:
```ts
if (profile?.user_stage === 'explorador' && (stats?.activeQuizzes ?? 0) === 0) {
  navigate('/start', { replace: true });
```

O `useEffect` roda assim que stats muda. Durante o loading, `stats` e `undefined`, logo `(undefined ?? 0) === 0` → true. Com user_stage ainda 'explorador' (Bug A), o redirect dispara imediatamente, antes de carregar os dados reais.

**Bug C — Start.tsx cria quiz sem verificar limite:**

`Start.tsx` faz `INSERT INTO quizzes` direto, sem chamar `checkQuizLimit()`. Cada loop cria um novo quiz draft, ultrapassando o limite do plano free.

### Correcoes

**Arquivo: `src/hooks/useQuizPersistence.ts`**
- Apos o branch UPDATE (depois da linha 313), adicionar a mesma logica de deteccao de primeiro quiz:
  1. Buscar `user_stage` do profile
  2. Se `user_stage === 'explorador'`: atualizar para 'construtor', disparar GTM `first_quiz_created`, atualizar `onboarding_status`

**Arquivo: `src/pages/Dashboard.tsx`**
- Linha 100: Adicionar guard `!statsLoading` para nao redirecionar enquanto stats esta carregando
- Mudanca: `if (!statsLoading && profile?.user_stage === 'explorador' && (stats?.activeQuizzes ?? 0) === 0)`

**Arquivo: `src/pages/Start.tsx`**
- Antes de criar o quiz (linha 96), chamar `checkQuizLimit()` do `useSubscriptionLimits`
- Se limite atingido, redirecionar para `/dashboard` com toast de aviso em vez de criar outro quiz

---

## 2. Botao "Proxima" — Gradiente Vermelho

**Arquivo: `src/components/quiz/QuestionConfigStep.tsx`**
- Linha 312-322: Alterar o `<Button>` "Proxima" de `variant="default"` para classes de gradiente vermelho:
```tsx
className="gap-2 font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
```

---

## 3. Botoes de Preview — Roxo Gradiente

**Arquivo: `src/components/quiz/QuestionConfigStep.tsx`**
- Linha 333-336: Tab "Preview em Tempo Real" — quando ativa, aplicar gradiente roxo:
```tsx
className={cn("gap-2", previewTab === 'preview' && "bg-gradient-to-r from-violet-600 to-purple-600 text-white")}
```

**Arquivo: `src/pages/CreateQuiz.tsx`**
- Linha 373-383: Botao Play/Preview do header — alterar de `border-primary/50 text-primary` para gradiente roxo:
```tsx
className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white flex-shrink-0"
```

**Arquivo: `src/components/quiz/LivePreview.tsx`**
- Linha 68-71: Texto "Preview em Tempo Real" — manter como referencia visual, sem mudanca funcional

---

## Resumo de Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useQuizPersistence.ts` | Adicionar logica first-quiz no branch UPDATE |
| `src/pages/Dashboard.tsx` | Guard `!statsLoading` antes do redirect |
| `src/pages/Start.tsx` | Verificar limite de quiz antes de criar |
| `src/components/quiz/QuestionConfigStep.tsx` | Botao Proxima vermelho + Tab preview roxo |
| `src/pages/CreateQuiz.tsx` | Botao Preview header roxo |

