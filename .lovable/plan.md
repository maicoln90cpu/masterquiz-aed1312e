

# Plano: Corrigir itens 2, 3 e 4 pendentes

Os tres itens NAO foram aplicados na ultima implementacao. Segue o que precisa ser feito:

---

## Item 2 — Cache stale apos publicar quiz

**Problema:** Apos publicar o quiz e clicar no botao do dialog de compartilhamento, a pagina de destino mostra "Rascunho" porque o cache do TanStack Query nao foi invalidado.

**Correcao em `src/pages/CreateQuiz.tsx` (linha ~899-901):**
- Antes de navegar, chamar `queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] })`
- Importar `useQueryClient` do TanStack Query e inicializar no componente

---

## Item 3 — Input de numero de perguntas faz clamp imediato

**Problema:** Os 3 inputs de numero (form linha 655-658, educational linha 912-915, pdf linha 1030-1033) fazem `Math.min(Math.max(value, 3), max)` no onChange, impedindo digitar "1" para depois completar "10".

**Correcao nos 3 inputs em `src/components/quiz/AIQuizGenerator.tsx`:**
- Remover o clamp do onChange — aceitar qualquer valor digitado
- Adicionar onBlur para clampar entre 3 e max
- No botao de gerar (linha 1132), adicionar `formData.numberOfQuestions < 3` na condicao de disabled

---

## Item 4 — Navegar para /meus-quizzes e renomear botao

**Problema:** Dois locais ainda navegam para `/dashboard` em vez de `/meus-quizzes`, e o texto do botao ainda diz "Ir para Dashboard".

**Correcoes:**
- `src/components/quiz/AIQuizGenerator.tsx` linha 503: trocar `navigate('/dashboard')` por `navigate('/meus-quizzes')`
- `src/pages/CreateQuiz.tsx` linha 901: trocar `navigate('/dashboard')` por `navigate('/meus-quizzes')`
- `src/i18n/config.ts`: alterar `createQuiz.goToDashboard` nas 3 linguas:
  - PT: "Ver meus Quizzes"
  - EN: "View my Quizzes"
  - ES: "Ver mis Quizzes"

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/CreateQuiz.tsx` | Invalidar cache antes de navegar + mudar destino para /meus-quizzes |
| `src/components/quiz/AIQuizGenerator.tsx` | Remover clamp imediato dos 3 inputs + disabled no botao + navigate /meus-quizzes |
| `src/i18n/config.ts` | Renomear "Ir para Dashboard" para "Ver meus Quizzes" (PT/EN/ES) |

