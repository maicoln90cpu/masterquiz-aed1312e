
# Adicionar colunas Publicados e Com Leads na tabela PQL

## O que sera adicionado

Duas novas colunas na tabela "Progressao por Intencao":
- **Publicados**: quantidade de quizzes com `is_public = true` e `status = 'active'`
- **Com Leads**: quantidade de quizzes que possuem pelo menos 1 resposta real (excluindo leads de teste identificados por `answers._is_test_lead = true`)

## Alteracoes

### 1. Edge Function `list-all-users/index.ts`

Atualizar a query de quizzes para incluir `is_public` e `status`:
```
adminClient.from("quizzes").select("user_id, id, is_public, status")
```

Adicionar nova query para buscar quizzes com respostas reais (distinct quiz_id de quiz_responses onde `answers->_is_test_lead` nao e `true`).

Adicionar ao objeto `stats` de cada usuario:
- `published_count`: quizzes com `is_public = true AND status = 'active'`
- `quizzes_with_leads`: numero de quizzes distintos que tem respostas reais

### 2. Componente `PQLAnalytics.tsx`

- Adicionar campos `published` e `withLeads` ao `IntentRow` e ao bucket de agregacao
- Agregar os novos valores por intencao
- Adicionar 2 colunas na tabela apos "Quizzes": "Publicados" e "Com Leads"
- Atualizar `colSpan` para 13

## Arquivos modificados

| Arquivo | Alteracao |
|---------|----------|
| `supabase/functions/list-all-users/index.ts` | Buscar status/is_public dos quizzes e respostas reais por quiz |
| `src/components/admin/PQLAnalytics.tsx` | Adicionar colunas Publicados e Com Leads |
