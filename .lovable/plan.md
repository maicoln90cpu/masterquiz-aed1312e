

# Plano: Ordens Unicas, Premium Rico e Classificacao Correta

## Diagnostico dos 3 Problemas

### Problema 1: Ordens duplicadas
No hook `useAllQuizTemplates` (linha 159), hardcoded templates recebem `display_order: i` onde `i` e o indice no array filtrado. Isso gera:
- Base templates: ordens 0-8
- Premium templates: continuam no mesmo loop, ordens 9-13
- DB templates: usam `display_order` do banco (1, 2, 3, 4...)

Resultado: Pre-VSL (hardcoded, ordem 1) colide com "Seu Potencial de Renda Extra" (DB, ordem 1).

**Correcao**: Atribuir ordens fixas e unicas no `useAllQuizTemplates`: base 1-9, premium 10-14, DB templates comecam em 15+.

### Problema 2: Premium templates pobres em blocos
Os 5 templates premium atualmente tem apenas:
- 1 `imageBlock` na pergunta 1
- 1 `comparisonBlock` na pergunta 9
- 1 `socialProofBlock` na pergunta 10
- 1 `countdownBlock` na pergunta 12
- 2-3 `progressBlock` espalhados
- 12 perguntas cada

Precisam ser enriquecidos com:
- 4 imagens espalhadas (perguntas 1, 4, 7, 10)
- 1+ socialProof (perguntas 5, 10)
- 1 countdown (pergunta final)
- 1-2 testimonial (perguntas 6, 11)
- progress em mais perguntas
- comparison ja existe
- Expandir para 14-16 perguntas com mais blocos de valor

### Problema 3: Classificacao premium
O codigo ja esta correto: apenas 5 IDs no array `premiumQuizTemplates` sao premium. Os outros 9 base sao free. A confusao do usuario e sobre as 12 categorias no `categoryLabels` vs os 5 premium. Solucao: manter exatamente 5 premium, confirmar que os demais 9 base + DB sao free. Nada a mudar na logica, apenas validar visualmente.

---

## Plano de Implementacao

### Arquivo 1: `src/hooks/useQuizTemplates.ts`
**Linhas 148-172** — Corrigir atribuicao de `display_order` no `useAllQuizTemplates`:
- Base templates (hardcodedTemplates): ordens 1-9
- Premium templates (hardcodedPremiumTemplates): ordens 10-14
- DB templates: ordens 15+ (offset pelo total de hardcoded)

Isso garante que nenhum template tenha ordem duplicada na tabela admin.

### Arquivo 2: `src/data/premiumQuizTemplates.ts` (reescrita completa dos 5 templates)
Enriquecer CADA um dos 5 premium templates com:

**Template 1 — Executivo Corporativo** (expandir de 12 para 15 perguntas):
- Q1: imageBlock (sala de reuniao corporativa) + textBlock + questionBlock
- Q3: progressBlock
- Q4: textBlock (dado impactante) + imageBlock (graficos) + questionBlock
- Q5: testimonialBlock (CEO case)
- Q6: sliderBlock (satisfacao) + questionBlock
- Q7: imageBlock (equipe trabalhando)
- Q8: progressBlock
- Q9: comparisonBlock
- Q10: socialProofBlock
- Q11: imageBlock (resultados)
- Q12: testimonialBlock
- Q13-15: novas perguntas sobre implementacao, ROI, timeline
- Q15: countdownBlock

**Template 2 — Luxo & Premium** (expandir de 12 para 16 perguntas):
- 4 imagens luxury (joias, lifestyle, viagem, interior design)
- testimonialBlock (clientes VIP)
- socialProofBlock com compras recentes
- countdownBlock com escassez
- novas perguntas sobre lifestyle, viagem, investimento

**Template 3 — Tech Futurista** (expandir de 12 para 15 perguntas):
- 4 imagens tech (codigo, servidor, dashboard, equipe dev)
- testimonialBlock (CTO/startup)
- socialProofBlock com projetos lancados
- sliderBlock (orcamento/prioridade)
- novas perguntas sobre CI/CD, seguranca, monitoring

**Template 4 — Saude & Medicina** (expandir de 12 para 16 perguntas):
- 4 imagens saude (consulta, exercicio, alimentacao, wellness)
- testimonialBlock (paciente)
- socialProofBlock com agendamentos
- sliderBlock (nivel de dor/estresse)
- novas perguntas sobre suplementacao, saude mental, acompanhamento

**Template 5 — Fitness & Energia** (expandir de 12 para 16 perguntas):
- 4 imagens fitness (treino, corrida, yoga, resultado)
- testimonialBlock (aluno transformado)
- socialProofBlock com matriculas
- sliderBlock (peso atual/meta)
- novas perguntas sobre nutricao, suplementos, metas de peso

Cada template tera no minimo:
- 4 imageBlock
- 2 socialProofBlock
- 2 testimonialBlock
- 2 progressBlock
- 1 comparisonBlock
- 1 countdownBlock
- 1 sliderBlock
- 14-16 perguntas

### Arquivo 3: Nenhuma mudanca em QuizTemplateSelector
A classificacao premium ja funciona corretamente com `premiumIds` baseado no array `premiumQuizTemplates`. Os 9 base sao free, os 5 premium sao premium. Isso esta correto.

---

## Resumo de Impacto

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `useQuizTemplates.ts` | Corrigir display_order unico |
| `premiumQuizTemplates.ts` | Reescrever 5 templates com blocos ricos (14-16 perguntas cada) |

Total de mudancas: 2 arquivos. Nenhum risco para templates base ou DB.

