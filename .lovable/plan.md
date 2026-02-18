

# PQL Analytics: Tabelas de Progressao por Intencao e Impacto do Lead de Teste

## Resumo

Criar um novo componente de analytics PQL no painel Admin Master, dentro da aba **Visao Geral > Relatorios**, contendo duas tabelas:

1. **Progressao por Intencao** -- mostra, para cada intencao (`user_objectives`), quantos usuarios estao em cada estagio e a taxa de conversao Trial (free) para Paid
2. **Impacto do Lead de Teste** -- mostra se usuarios que geraram leads (tem `quiz_responses`) convertem mais para plano pago

## Dados disponiveis (sem nova tabela)

Todos os dados necessarios ja existem:
- `profiles.user_stage` -- estagio atual (explorador/construtor/operador)
- `profiles.user_objectives` -- array de intencoes
- `user_subscriptions.plan_type` -- free/paid/partner/premium
- `quiz_responses` -- existencia de leads vinculados ao usuario via `quizzes.user_id`

## Detalhes tecnicos

### 1. Novo componente: `src/components/admin/PQLAnalytics.tsx`

Componente lazy-loaded que faz uma unica query via Edge Function (para acessar todos os profiles) e computa as duas tabelas client-side.

**Tabela 1 -- Progressao por Intencao:**

```text
| Intencao              | Total | Explorador | Construtor | Operador | % Expl->Constr | % Constr->Oper | Free | Paid | % Trial->Paid |
|-----------------------|-------|------------|------------|----------|----------------|----------------|------|------|---------------|
| lead_capture_launch   |   12  |     8      |     3      |    1     |     33%        |     25%        |  10  |   2  |    17%        |
| vsl_conversion        |    5  |     3      |     1      |    1     |     40%        |     50%        |   4  |   1  |    20%        |
| ...                   |       |            |            |          |                |                |      |      |               |
| (sem intencao)        |   39  |    38      |     0      |    1     |      0%        |      -         |  39  |   0  |     0%        |
```

**Tabela 2 -- Impacto do Lead de Teste:**

```text
| Gerou Lead de Teste? | Total | Free | Paid | % Trial -> Paid |
|----------------------|-------|------|------|-----------------|
| Sim                  |    5  |   3  |   2  |      40%        |
| Nao                  |   36  |  36  |   0  |       0%        |
```

### 2. Edge Function: `list-all-users`

A funcao `list-all-users` ja retorna `profile` e `subscription` por usuario. Porem **nao retorna `user_objectives`**. Precisamos adicionar `user_objectives` ao select do profile nessa funcao.

### 3. Integracao no AdminDashboard

- Adicionar lazy import do `PQLAnalytics`
- Inserir como sub-aba "PQL Analytics" dentro da aba **Visao Geral**, ao lado de "Dashboard" e "Relatorios"

### Arquivos modificados

| Arquivo | Alteracao |
|---------|----------|
| `src/components/admin/PQLAnalytics.tsx` | **Novo** -- componente com as duas tabelas |
| `supabase/functions/list-all-users/index.ts` | Adicionar `user_objectives` ao select do profile |
| `src/pages/AdminDashboard.tsx` | Adicionar sub-aba "PQL Analytics" na aba Visao Geral |

### Arquivos NAO tocados

- `src/hooks/useUserStage.ts` (nao muda)
- Nenhuma migration de banco (dados ja existem)
- Nenhuma tabela nova

