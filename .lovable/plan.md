

# Plano — Timestamp `objective_selected_at` no perfil

## Objetivo
Registrar quando o usuário escolheu seu objetivo pela primeira vez (carimbo imutável), preservando o valor em seleções subsequentes.

## Mudanças

### 1. Migration SQL — nova coluna em `profiles`
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS objective_selected_at timestamptz;
```
- Nullable, sem default.
- Idempotente (`IF NOT EXISTS`).
- Sem trigger, sem backfill — preenchimento puramente client-side.

### 2. `src/pages/Start.tsx` — gravar timestamp na primeira seleção
Reaproveita a flag `alreadyFired` já calculada no passo de dedup do `objective_selected` (turno anterior):

```text
Antes (passo 1 do try):
  await supabase
    .from("profiles")
    .update({ user_objectives: [objective] })
    .eq("id", user.id);

Depois:
  const profileUpdate = { user_objectives: [objective] };
  if (!alreadyFired) {
    profileUpdate.objective_selected_at = new Date().toISOString();
  }
  await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);
```

- Se é a **primeira** seleção → grava `objective_selected_at = now`.
- Se já existe objetivo → **não inclui** o campo no UPDATE → preserva o valor original.

## Detalhes técnicos
- A condição reusa `alreadyFired` (já lida `user_objectives` da `profiles` no início do try). Sem queries adicionais.
- Em caso de falha no SELECT inicial (`alreadyFired = false` por fallback), o pior cenário é sobrescrever um timestamp já existente pelo timestamp atual — risco aceitável e raro.
- Nada mais é alterado: redirecionamento, criação de quiz, eventos GTM permanecem intactos.

## Arquivos alterados
- Nova migration SQL (1 linha + descrição).
- `src/pages/Start.tsx` (~5 linhas alteradas).

## Checklist manual
- [ ] Verificar coluna criada: `SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='objective_selected_at';`
- [ ] Usuário novo seleciona objetivo → `profiles.objective_selected_at` populado com timestamp atual.
- [ ] Mesmo usuário troca de objetivo → `objective_selected_at` permanece com valor original; só `user_objectives` muda.
- [ ] Cadastros antigos (pré-migration) → `objective_selected_at = NULL` (esperado).

## Pendências futuras
- Backfill opcional: para usuários com `user_objectives` preenchido mas `objective_selected_at` nulo, popular com `stage_updated_at` ou `created_at` (decisão do produto).
- Adicionar `objective_selected_at` ao painel ICP/Growth como sinal de qualificação.

## Prevenção de regressão
- Comentário inline explica por que o campo é condicional.
- `IF NOT EXISTS` na migration evita falha em re-execução.

