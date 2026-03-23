

## Plan: Correções de Respostas, Analytics, Editor e CRM

### ✅ IMPLEMENTADO (Fase 1)

#### 1. Fix crítico: Respostas salvas como `{}` (vazio)
- **Causa**: `nextStep()` e `submitQuiz()` liam `answers` do state React (assíncrono) antes do re-render
- **Solução**: Adicionado `answersRef = useRef()` sincronizado em `handleAnswer` — `nextStep` e `submitQuiz` agora usam `answersRef.current`
- `submitQuiz` em modo funil usa SELECT + UPDATE/INSERT em vez de upsert (bypass de partial unique index)

#### 2. Funil removido da aba Geral (Analytics)
- Funil de conversão disponível apenas na aba "Por Quiz"
- Aba Geral mantém métricas gerais, gráficos e tabelas

#### 3. Editor: addQuestion não força mais step 2
- Removido `step: 2` do `updateEditor` em `handleAddQuestion`
- Usuário permanece na etapa atual ao adicionar pergunta

#### 4. CRM: Filtro de leads por dados úteis + agrupamento anônimo
- Função `hasUsefulContactData()` detecta email/telefone nos campos ou dentro das respostas (regex)
- Kanban exibe apenas leads com dados de contato identificáveis
- Banner informativo mostra contagem de respostas anônimas com orientação para captura
- Stats totais mantidos para contagem geral

### ✅ IMPLEMENTADO (Fase 2)

#### 5. Edge Function `save-quiz-response` (fix definitivo de respostas vazias)
- **Causa raiz**: Anon users não têm permissão SELECT em `quiz_responses` via RLS — o SELECT prévio para detectar row existente falhava silenciosamente
- **Solução**: Nova Edge Function com `service_role` faz SELECT + INSERT/UPDATE atomicamente, garantindo merge correto de answers
- Progressive save (nextStep) e submit final agora usam a Edge Function
- Merge inteligente: mantém respostas anteriores e sobrepõe com novas

#### 6. TextInput controlado no QuizView
- `TextInputBlockPreview` agora aceita `controlledValue` e `onValueChange` props
- No QuizView, valores de textInput são persistidos em `answers` via `onAnswer`
- Respostas de textInput aparecem no Heatmap, lista de respostas e planilha

#### 7. Extração inteligente de contato
- Helper `extractContactFromAnswers()` detecta email/phone em blocos textInput
- Prioridade 1: validação explícita no bloco (`validation: 'email'` ou `'phone'`)
- Prioridade 2: regex fallback para detecção automática
- Contatos extraídos são promovidos para `respondent_email`/`respondent_whatsapp`

#### 8. ResponseAnswersList: suporte a chaves textInput
- Nova função `getAnswerForQuestion()` busca por `question.id` e `textInput:<blockId>`
- Respostas de textInput deixam de aparecer como "Não respondida"

### Arquivos Modificados (Fase 2)

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/save-quiz-response/index.ts` | Nova Edge Function com service_role |
| `supabase/config.toml` | Registro da nova função |
| `src/hooks/useQuizViewState.ts` | Edge Function para save + extractContactFromAnswers |
| `src/components/quiz/preview/InteractiveBlockPreviews.tsx` | TextInputBlockPreview controlado |
| `src/components/quiz/QuizBlockPreview.tsx` | Props textInputValues/onTextInputChange |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Wire textInput → onAnswer |
| `src/components/responses/ResponseAnswersList.tsx` | getAnswerForQuestion com textInput keys |

### ✅ IMPLEMENTADO (Fase 3 — CTA Tracking)

#### 9. Tabela `quiz_cta_click_analytics`
- Nova tabela para rastrear cliques em CTAs da última etapa de quizzes funil
- Índices para quiz_id, date e session_id
- RLS: insert público (anon/auth), select apenas owner do quiz

#### 10. Edge Function `track-cta-redirect`
- Aceita GET (redirect 302) e POST (fire-and-forget)
- Registra clique CTA, step analytics e completion atomicamente
- Validação de URL (previne open redirect attacks)

#### 11. Correção da indexação da última etapa na planilha
- `ResponsesSpreadsheet` agora usa `order_number` direto (sem +1)
- Merge de dados de `quiz_cta_click_analytics` com `quiz_step_analytics` para última etapa
- Novo card "Performance dos CTAs" com ranking e CTR%

#### 12. Hook `useCtaTracking` + instrumentação dos blocos
- Hook usa `navigator.sendBeacon` + fallback `fetch(keepalive)` para máxima confiabilidade
- Ativado apenas na última etapa de quizzes funil (`show_results = false`)
- Blocos instrumentados: Button, Price, Banner, PersonalizedCTA, Recommendation
- Prop `onCtaClick` flui: QuizView → QuizViewQuestion → QuizBlockPreview → blocos

### Arquivos Modificados (Fase 3)

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/track-cta-redirect/index.ts` | Nova Edge Function |
| `supabase/config.toml` | Registro da função |
| `src/hooks/useCtaTracking.ts` | Novo hook de tracking CTA |
| `src/pages/QuizView.tsx` | Integração do hook de CTA tracking |
| `src/components/quiz/view/QuizViewQuestion.tsx` | Prop onCtaClick |
| `src/components/quiz/QuizBlockPreview.tsx` | Prop onCtaClick passada aos blocos |
| `src/components/quiz/preview/StaticBlockPreviews.tsx` | Button + Price com onCtaClick |
| `src/components/quiz/preview/DynamicBlockPreviews.tsx` | PersonalizedCTA com onCtaClick |
| `src/components/quiz/preview/VisualBlockPreviews.tsx` | Banner com onCtaClick |
| `src/components/quiz/preview/RecommendationBlockPreview.tsx` | Recommendation com onCtaClick |
| `src/components/responses/ResponsesSpreadsheet.tsx` | Fix indexação + CTA ranking |
