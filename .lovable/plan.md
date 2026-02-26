

# Plano: 7 Ajustes de UX no Quiz

## 1. Checkbox no canto direito (MultipleChoiceOptions)
**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx` (linhas 363-393)
- Mover o `<Checkbox>` de antes do `<Label>` para depois dele (trocar ordem no flex layout)
- Checkbox fica no extremo direito com `ml-auto`

## 2. Texto customizado do botão "Próxima" no quiz publicado
**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx` (linha 205)
- Ler `questionBlock?.nextButtonText` do bloco atual
- Usar como texto do botão quando existir, senão fallback para `t('quizView.next')`

## 3. Sidebar do editor: "Etapas" como default
**Arquivo:** `src/hooks/useQuizState.ts` (linha 88)
- Mudar `rightPanelMode: 'preview'` → `rightPanelMode: 'steps'`

## 4. Progress bar como select (3 opções) em vez de toggle
**Arquivos:**
- `src/components/quiz/AppearanceConfigStep.tsx` (linhas 198-208): Trocar Switch por Select com 3 opções: "Barra de Progresso", "Número da Pergunta", "Não mostrar"
- `src/components/quiz/QuizSettings.tsx`: Mudar tipo de `showQuestionNumber: boolean` → `progressStyle: 'bar' | 'counter' | 'none'`
- `src/components/quiz/QuizActions.tsx`: Mapear `progressStyle` → `show_question_number` no DB (manter compatibilidade: 'counter'=true, 'bar'=true, 'none'=false) + salvar `progress_style` se coluna existir
- `src/components/quiz/view/QuizViewQuestion.tsx` (linhas 184-192): Renderizar condicionalmente: `bar` = progress bar, `counter` = texto "X de Y", `none` = nada
- `src/components/quiz/UnifiedQuizPreview.tsx`: Mesma lógica no preview do editor
- **Migration SQL:** Adicionar coluna `progress_style text default 'counter'` na tabela `quizzes`

## 5. Botão Salvar 30% maior
**Arquivo:** `src/pages/CreateQuiz.tsx` (linha 572-582)
- Adicionar `px-6` ou `min-w-[120px]` ao botão Salvar

## 6. Bloco imagem + botão: remover botão "Próxima" duplicado
**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx` (linhas 131-161 e 197-209)
- Quando a pergunta contém um bloco `button` com `action: 'next_question'`, NÃO renderizar o botão de navegação automático no final
- Atualizar `isInformationalSlide` para detectar se há botão de navegação nos blocos mesmo quando há question block
- Na renderização de blocos não-question via `QuizBlockPreview`, passar `showNavigationButton: false` para evitar que cada bloco gere seu próprio botão "Próxima Pergunta" duplicado

## 7. Template colorido — borda amarela envolvendo tudo
**Arquivo:** `src/styles/quiz-templates.css` (linhas 51-55)
- O `.quiz-template-colorido .card` tem `border: 2px solid hsl(var(--template-border))` que afeta TODOS os cards incluindo o wrapper principal
- Reduzir/remover a borda do card wrapper principal: adicionar regra específica para o container do quiz (não os cards de resposta)
- Alternativa: no `QuizView.tsx`, o wrapper `py-6` não tem card, mas os blocos internos renderizados via `QuizBlockPreview` usam `wrapInCard=true` que herda a borda grossa amarela — passar `wrapInCard: false` para blocos no quiz público

---

## Resumo de Arquivos

| # | Arquivo | Risco |
|---|---------|-------|
| 1 | `QuizViewQuestion.tsx` | Baixo |
| 2 | `QuizViewQuestion.tsx` | Baixo |
| 3 | `useQuizState.ts` | Baixo |
| 4 | Migration + AppearanceConfigStep + QuizSettings + QuizActions + QuizViewQuestion + UnifiedQuizPreview | Médio |
| 5 | `CreateQuiz.tsx` | Baixo |
| 6 | `QuizViewQuestion.tsx` | Médio |
| 7 | `quiz-templates.css` + `QuizViewQuestion.tsx` | Baixo |

