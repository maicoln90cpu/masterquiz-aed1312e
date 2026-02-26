

## Diagnose completo + Plano de implementacao

---

### Bug 1: "Erro ao enviar resposta" — CAUSA RAIZ ENCONTRADA

**Arquivo:** `src/hooks/useQuizViewState.ts`, linha 304-308

```typescript
const { data: ownerSub } = await supabase
  .from('user_subscriptions')
  .select('response_limit')
  .eq('user_id', quiz.user_id)
  .single(); // ← ESTE E O PROBLEMA
```

A tabela `user_subscriptions` tem RLS de SELECT apenas para `authenticated` com `user_id = auth.uid()`. O respondente publico e **anon**, portanto recebe 0 linhas. `.single()` lanca erro PGRST116 (nenhuma linha encontrada), que cai no catch e mostra "Erro ao enviar resposta".

**Fix:** Trocar `.single()` por `.maybeSingle()`. Se `ownerSub` for null, pular a verificacao de limite.

---

### Bug 2: Botao "Proxima Pergunta" duplicado — CAUSA RAIZ ENCONTRADA

**Arquivo:** `src/components/quiz/view/QuizViewQuestion.tsx`, linha 155

```typescript
showNavigationButton={block.type === 'button'}
```

Quando o bloco e do tipo `button`, `showNavigationButton=true` faz o `QuizBlockPreview` renderizar o botao do bloco (via `renderBlock` case "button") **E TAMBEM** renderizar um botao extra "Proxima Pergunta" generico (linhas 857-861 do QuizBlockPreview). Resultado: 3 botoes na tela.

**Fix:** Mudar para `showNavigationButton={false}` — o bloco button ja se renderiza sozinho via `renderBlock`.

---

### Fase 2C: Componentes Premium

#### 2C.1 — Slider Premium (melhorias visuais)
- Adicionar tick marks (regua visual) no `SliderBlockPreview` do QuizBlockPreview
- Valor animado com transicao ao arrastar
- Melhorar estilo do thumb e track com cores premium

**Arquivos:** `src/components/quiz/QuizBlockPreview.tsx` (SliderBlockPreview)

#### 2C.2 — Timer/Countdown Premium (melhorias visuais)
- Animacao de flip/pulse por segundo no `CountdownBlockPreview`
- Acao padrao ao expirar: mostrar mensagem (conforme escolha do usuario)
- Estilo premium nos cards de unidade de tempo

**Arquivos:** `src/components/quiz/QuizBlockPreview.tsx` (CountdownBlockPreview)

#### 2C.3 — Testimonial Block Premium (melhorias visuais)
- Sombra premium, avatar maior, transicao suave
- Aspas decorativas e tipografia melhorada no `TestimonialBlockPreview`

**Arquivos:** `src/components/quiz/QuizBlockPreview.tsx` (TestimonialBlockPreview)

#### 2C.4 — Animated Counter (NOVO BLOCO)
- Novo tipo `animatedCounter` em `types/blocks.ts`
- Componente editor `AnimatedCounterBlock.tsx`
- Preview no `QuizBlockPreview.tsx` com contagem progressiva usando `requestAnimationFrame`
- Configuraveis: valor inicial/final, duracao, prefixo/sufixo, easing
- Gatilho: anima automaticamente ao entrar na tela (on view, conforme escolha)
- Adicionar no menu do `BlockEditor.tsx`

**Arquivos novos:** `src/components/quiz/blocks/AnimatedCounterBlock.tsx`
**Arquivos modificados:** `src/types/blocks.ts`, `src/components/quiz/blocks/BlockEditor.tsx`, `src/components/quiz/QuizBlockPreview.tsx`

---

### Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Fix submit `.single()` → `.maybeSingle()` | `useQuizViewState.ts` (1 linha) |
| Fix botao duplicado `showNavigationButton={false}` | `QuizViewQuestion.tsx` (1 linha) |
| Slider/Countdown/Testimonial premium | `QuizBlockPreview.tsx` |
| Animated Counter tipo + editor | `blocks.ts`, `AnimatedCounterBlock.tsx`, `BlockEditor.tsx` |
| Update plan | `.lovable/plan.md` |

---

### Checklist pos-implementacao

1. Publicar template → responder → preencher form → clicar Finalizar → sem erro, resposta salva
2. Abrir quiz publicado com botao manual → apenas 1 botao de navegacao visivel
3. Adicionar bloco Slider no editor → preview mostra regua com ticks
4. Adicionar bloco Countdown → preview anima segundo a segundo
5. Adicionar bloco Testimonial → preview mostra card premium
6. Adicionar bloco Animated Counter → preview anima contagem de 0 ate valor final
7. Regressao: auto-advance em single choice continua funcionando
8. Regressao: fluxo form before/after continua correto

