
# Plano de Evolução MasterQuiz — Etapa 2 (3 Fases)

## ✅ Etapa 1 — Correções Imediatas (CONCLUÍDA)

1. ✅ Botão Salvar no header agora persiste `progress_style`, `show_results`, `show_question_number`
2. ✅ CSS global para classes Quill (alinhamento, tamanho de fonte) fora do editor
3. ✅ Seletor de 6 fontes (Inter, Roboto, Open Sans, Poppins, Montserrat, Lato) no editor rico
4. ✅ Preview sem bordas (Card removido — fiel ao quiz publicado)
5. ✅ Barra de progresso premium (gradiente, sombra, 10px altura)
6. ✅ Múltipla escolha: clique em qualquer lugar da resposta (não só no checkbox)

---

## Etapa 2A — Visual/UX (animações e transições)

- [ ] Framer Motion `AnimatePresence` para transições fade/slide entre perguntas no quiz público
- [ ] Hover premium nos cards de resposta: gradiente sutil + ícone de check com scale bounce
- [ ] Formulário de lead: campos com animação de focus (border glow)
- [ ] Loading skeleton com shimmer no quiz público (substituir spinner)
- [ ] Preview em tempo real: garantir que todas as configurações de aparência reflitam no preview lateral instantaneamente

## Etapa 2B — Resultado + Tipografia responsiva

- [ ] Tela de resultado com animação staggered para cada elemento
- [ ] Confetti opcional na tela de resultado (canvas-confetti já instalado)
- [ ] Tipografia responsiva com `clamp()` para títulos/textos do quiz
- [ ] Touch targets mobile mínimo 44px em todos os elementos interativos
- [ ] Dark mode: revisão de contraste em todos os templates

## Etapa 2C — Componentes premium (novos blocos)

- [ ] Slider Premium: régua visual com campo de texto livre para unidade/rótulo
- [ ] Timer/Countdown block: contagem regressiva animada
- [ ] Testimonial block: card de depoimento com foto/estrelas
- [ ] Animated number counter: contagem progressiva com easing
