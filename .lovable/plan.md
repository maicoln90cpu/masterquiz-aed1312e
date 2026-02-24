

# Plano: Modo de exibicao do gabarito comentado (por pergunta ou ao final)

## Resumo

Quando o criador marcar "Incluir explicacao para cada alternativa", aparecera um segundo controle perguntando **quando** exibir o gabarito:
- **A cada pergunta** — mostra explicacao e resposta correta logo apos o usuario responder aquela questao
- **Ao final do quiz** — acumula todas as respostas e exibe um resumo completo com gabarito na tela de resultado

---

## Alteracoes detalhadas

### 1. Frontend: `src/components/quiz/AIQuizGenerator.tsx`

- Adicionar campo `explanationMode: 'per_question' | 'end_of_quiz'` ao state `EducationalSettings` (default: `per_question`)
- Quando `includeExplanations` estiver marcado, exibir um Select logo abaixo com as opcoes:
  - "Mostrar a cada pergunta" (per_question)
  - "Mostrar tudo ao final do quiz" (end_of_quiz)
- Enviar `explanationMode` no payload para a Edge Function
- Na normalizacao das questoes geradas, salvar `explanationMode` no bloco question (JSONB)

### 2. Backend: `supabase/functions/generate-quiz-ai/index.ts`

- Adicionar `explanationMode` ao `replaceVariables` e ao payload salvo em `ai_quiz_generations`
- Nenhuma mudanca no prompt em si — o prompt ja pede `explanation` e `correct_answer` quando `includeExplanations` e true. O `explanationMode` e apenas um flag de exibicao no frontend

### 3. Exibicao por pergunta: `src/components/quiz/view/QuizViewQuestion.tsx`

- No `QuestionBlockRenderer`, verificar se o bloco tem `explanation` e `explanationMode !== 'end_of_quiz'`
- Manter a logica atual: apos o usuario selecionar uma resposta, exibir um card com a explicacao (lampada + texto + indicacao de resposta correta)
- Adicionar state local `answered` para controlar se ja respondeu (impedir trocar resposta apos ver gabarito)

### 4. Exibicao ao final: `src/components/quiz/view/QuizViewResult.tsx`

- Receber as `questions` e `answers` como props (vindos do `QuizView.tsx`)
- Verificar se alguma questao tem `explanationMode === 'end_of_quiz'` e `explanation`
- Se sim, renderizar uma secao "Gabarito Comentado" abaixo do resultado principal com:
  - Lista de todas as questoes
  - Para cada: texto da pergunta, resposta do usuario, resposta correta, explicacao
  - Indicacao visual de acerto (verde) ou erro (vermelho)

### 5. Passagem de dados: `src/pages/QuizView.tsx`

- Passar `questions` e `answers` como props para `QuizViewResult` (atualmente so passa `quiz`, `finalResult` e `calculatorResult`)

---

## Detalhes tecnicos

**Novo state no AIQuizGenerator:**
```text
explanationMode: 'per_question' | 'end_of_quiz'
```

**Campo salvo no bloco JSONB de cada questao:**
```text
{
  type: 'question',
  questionText: '...',
  explanation: '...',
  correct_answer: '...',
  explanationMode: 'per_question' | 'end_of_quiz'
}
```

**Logica de exibicao no QuizViewQuestion (per_question):**
- Se `explanationMode` nao existe ou e `per_question`, e `explanation` existe, e usuario ja respondeu: mostra card de explicacao
- Desabilitar troca de resposta apos revelar gabarito

**Logica de exibicao no QuizViewResult (end_of_quiz):**
- Se qualquer questao tem `explanationMode === 'end_of_quiz'` e `explanation`: renderizar secao de gabarito
- Mostrar score (X de Y acertos) e lista detalhada

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/components/quiz/AIQuizGenerator.tsx` | Novo campo `explanationMode` condicional ao checkbox |
| `supabase/functions/generate-quiz-ai/index.ts` | Passar `explanationMode` no replaceVariables e salvar |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Exibir gabarito inline quando mode = per_question |
| `src/components/quiz/view/QuizViewResult.tsx` | Exibir secao de gabarito completo quando mode = end_of_quiz |
| `src/pages/QuizView.tsx` | Passar questions + answers para QuizViewResult |

## Arquivos NAO tocados
- Formulario guiado — zero alteracoes
- Schema do banco — explanation e explanationMode ficam no JSONB dos blocos
- Hooks, rotas, templates — zero alteracoes
