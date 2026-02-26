
# Plano de Evolução MasterQuiz — Etapa 2 (3 Fases)

## ✅ Etapa 1 — Correções Imediatas (CONCLUÍDA)

1. ✅ Botão Salvar no header persiste `progress_style`, `show_results`, `show_question_number`
2. ✅ CSS global para classes Quill (alinhamento, tamanho de fonte) fora do editor
3. ✅ Seletor de 6 fontes (Inter, Roboto, Open Sans, Poppins, Montserrat, Lato) no editor rico
4. ✅ Preview sem bordas (Card removido — fiel ao quiz publicado)
5. ✅ Barra de progresso premium (gradiente, sombra, 10px altura)
6. ✅ Múltipla escolha: clique em qualquer lugar da resposta

---

## ✅ Etapa 2A — Visual/UX (CONCLUÍDA)

1. ✅ Framer Motion `AnimatePresence` fade/slide entre perguntas no quiz público
2. ✅ Hover premium: sombra primary, bg sutil, transição suave nos cards de resposta
3. ✅ Formulário de lead: focus glow (ring + shadow primary) em todos os inputs
4. ✅ Loading skeleton shimmer substituindo spinner no quiz público

---

## ✅ Etapa 2B — Resultado + Tipografia responsiva (CONCLUÍDA)

1. ✅ Tela de resultado com animação staggered (Framer Motion)
2. ✅ Confetti automático na tela de resultado (canvas-confetti)
3. ✅ Tipografia responsiva com `clamp()` (título, perguntas, body, número resultado)
4. ✅ Touch targets mobile mínimo 44px em todos os elementos interativos
5. ✅ Dark mode: contraste revisado na barra de progresso e gabarito

---

## Etapa 2C — Componentes premium + Correções (ATUAL)

### Correções de bugs
- [x] Fix: Modal de excluir pergunta aparecia 2x — removido AlertDialog interno do QuestionsList, mantido apenas o central em CreateQuiz
- [x] Fix: Botão "Próxima" duplicado — hasManualNavButton agora oculta botão auto sempre que há bloco button com action next_question
- [x] Fix: Force refresh ao entrar em /meus-quizzes (invalidateQueries on mount)
- [x] Fix: Erro ao enviar resposta — removido .select().single() (anon não tem SELECT RLS), separado lead fields de custom_field_data

### Componentes premium
- [ ] Slider Premium: régua visual com campo de texto livre para unidade/rótulo
- [ ] Timer/Countdown block: contagem regressiva animada
- [ ] Testimonial block: card de depoimento com foto/estrelas
- [ ] Animated number counter: contagem progressiva com easing
