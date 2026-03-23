

## Plan: Correções de Respostas, Analytics, Editor e CRM

### ✅ IMPLEMENTADO (Fase Atual)

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

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useQuizViewState.ts` | `answersRef` + SELECT/UPDATE no submitQuiz funnel |
| `src/pages/Analytics.tsx` | Remoção do funil da aba Geral |
| `src/hooks/useQuizQuestions.ts` | Remoção de `step: 2` no addQuestion |
| `src/pages/CRM.tsx` | `hasUsefulContactData()`, filtro, banner anônimos |
