
# Plano: Botao "Ver" inteligente + Feedback visual verde/vermelho no gabarito

## Resumo

1. O botao "Ver" na lista de quizzes deve abrir o link publico diretamente quando o quiz esta publicado, e mostrar o dialog de preview apenas quando esta em rascunho.
2. Nas perguntas individuais com gabarito (modo `per_question`), apos o usuario responder, a opcao selecionada deve ficar verde se acertou ou vermelha se errou, e a resposta correta deve ficar destacada em verde.

---

## Alteracoes detalhadas

### 1. Botao "Ver" — abrir link publico vs preview

**Arquivo: `src/pages/MyQuizzes.tsx`**

Alterar `handlePreview` para verificar o status do quiz:
- Se `quiz.status === 'active'`: abrir o link publico (`/:company_slug/:slug`) em nova aba diretamente, sem dialog
- Se `quiz.status !== 'active'` (rascunho): manter comportamento atual — abrir `PreviewLinkDialog`

A funcao precisa receber o quiz inteiro (ou id + status + slug) em vez de apenas o id. Ajustar para buscar o quiz na lista `quizzes` pelo id e verificar o status.

```text
const handlePreview = (id: string) => {
  const quiz = quizzes.find(q => q.id === id);
  if (quiz?.status === 'active' && quiz.slug) {
    // Abrir link publico
    const publicUrl = userProfile?.company_slug
      ? `/${userProfile.company_slug}/${quiz.slug}`
      : `/quiz/${quiz.slug}`;
    window.open(publicUrl, '_blank');
  } else {
    // Rascunho — mostrar dialog de preview
    setSelectedQuizId(id);
    setPreviewDialogOpen(true);
  }
};
```

**Arquivo: `src/components/quiz/QuizCard.tsx`** — nenhuma alteracao necessaria. O `onPreview(quiz.id)` ja passa o id.

### 2. Feedback visual verde/vermelho nas opcoes

**Arquivo: `src/components/quiz/view/QuizViewQuestion.tsx`**

Passar `correctAnswer` e `answered` como props para `SingleChoiceOptions` e `MultipleChoiceOptions`.

**SingleChoiceOptions** — apos `answered === true`:
- Opcao selecionada pelo usuario E correta: borda verde + fundo verde claro
- Opcao selecionada pelo usuario E incorreta: borda vermelha + fundo vermelho claro
- Opcao NAO selecionada mas e a correta: borda verde + fundo verde claro (para mostrar qual era a certa)
- Demais opcoes: estilo neutro (cinza)

**MultipleChoiceOptions** — mesma logica adaptada para multipla escolha.

**Logica de estilo (pseudo-codigo):**
```text
se answered:
  se isSelected E isCorrectOption -> border-green-500 bg-green-50
  se isSelected E !isCorrectOption -> border-red-500 bg-red-50
  se !isSelected E isCorrectOption -> border-green-500 bg-green-50 (destaque sutil)
  senao -> border-muted (cinza, desabilitado)
senao (ainda nao respondeu):
  manter estilo atual (azul no hover/selecao)
```

**Props adicionais em OptionsProps:**
```text
correctAnswer?: string;
answered?: boolean;
```

O `QuestionBlockRenderer` ja tem `correctAnswer` e `answered` — basta passa-los para os sub-componentes.

---

## Resumo de arquivos

| Arquivo | Alteracao |
|---------|----------|
| `src/pages/MyQuizzes.tsx` | `handlePreview` verifica status: publico abre link, rascunho abre dialog |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Passar correctAnswer+answered para opcoes; logica de cor verde/vermelho |

## Arquivos NAO tocados
- PreviewLinkDialog.tsx — nenhuma alteracao
- QuizCard.tsx — nenhuma alteracao
- QuizViewResult.tsx — nenhuma alteracao
- Edge Functions, schema, hooks — zero alteracoes
