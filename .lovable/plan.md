# Plano — 3 entregas (PerfilON, Gráfico ICP, P11 Guard)

## 1) Tabela "Logins vs Cadastros" — nova coluna **PerfilON**

### Antes
Colunas: Data | Cadastros | Logins | Taxa Retorno.
Fonte: RPC `real_users_daily(_days)` retorna `(day, cadastros)`.

### Depois
Colunas: Data | Cadastros | **PerfilON** | Logins | Taxa Retorno.
- **PerfilON** = quantos dos cadastros do dia têm `profiles.is_icp_profile = true`.
- Subtítulo do card ganha legenda: *"PerfilON = cadastros classificados como ICP comercial (objetivo ≠ educacional)"*.
- KPIs do topo: adicionar 4º card "PerfilON" (total no período + % sobre cadastros).

### Como implementar (técnico)
1. **Migration** — estender RPC para incluir contagem ICP:
   ```sql
   CREATE OR REPLACE FUNCTION public.real_users_daily(_days integer DEFAULT 30)
   RETURNS TABLE(day date, cadastros integer, perfil_on integer)
   LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
     SELECT
       (u.created_at AT TIME ZONE 'UTC')::date AS day,
       COUNT(*)::int AS cadastros,
       COUNT(*) FILTER (WHERE p.is_icp_profile = true)::int AS perfil_on
     FROM auth.users u
     INNER JOIN public.profiles p ON p.id = u.id
     WHERE p.deleted_at IS NULL
       AND u.created_at >= (now() - (_days || ' days')::interval)
     GROUP BY 1 ORDER BY 1 DESC;
   $$;
   ```
   (Mantém assinatura compatível — colunas adicionais não quebram callers.)

2. **`LoginVsCadastrosTable.tsx`**:
   - `DayRow` ganha `perfilOn: number` e `pctIcp: string`.
   - Coluna nova após "Cadastros": Badge com `perfilOn` + texto pequeno "(X%)".
   - `totalPerfilOn` somado para KPI; grid topo passa de 3 para 4 colunas.

### Vantagens
- Visibilidade imediata da qualidade do funil (quantos cadastros são ICP de fato).
- Zero custo extra (1 query agregada, mesmo plano de execução).

### Desvantagens
- Adiciona 1 coluna em layout já denso — em telas <1024px ficará apertado (compensar com `text-xs` e badge compacto).

---

## 2) PQL Analytics — gráfico **PerfilON vs PerfilOFF** por dia (7/15/30)

### Antes
`PQLAnalytics.tsx` mostra tabelas por intenção/estágio, sem visualização temporal de ICP.

### Depois
Novo card abaixo do conteúdo existente:
- **Título**: "Evolução PerfilON × PerfilOFF"
- **Filtro**: botões 7d / 15d / 30d (mesmo padrão visual do `LoginVsCadastrosTable`).
- **Gráfico**: `BarChart` (recharts) empilhado ou agrupado, eixo X = data, séries = `perfil_on` (verde) e `perfil_off` (cinza).
- **KPI lateral**: total ON / total OFF / % ON no período.

### Como implementar (técnico)
1. **Migration** — nova RPC dedicada (mais limpa que reaproveitar `real_users_daily`):
   ```sql
   CREATE OR REPLACE FUNCTION public.icp_daily_breakdown(_days integer DEFAULT 30)
   RETURNS TABLE(day date, perfil_on integer, perfil_off integer)
   LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
     SELECT
       (u.created_at AT TIME ZONE 'UTC')::date,
       COUNT(*) FILTER (WHERE p.is_icp_profile = true)::int,
       COUNT(*) FILTER (WHERE p.is_icp_profile = false OR p.is_icp_profile IS NULL)::int
     FROM auth.users u
     INNER JOIN public.profiles p ON p.id = u.id
     WHERE p.deleted_at IS NULL
       AND u.created_at >= (now() - (_days || ' days')::interval)
     GROUP BY 1 ORDER BY 1;
   $$;
   REVOKE ALL ON FUNCTION public.icp_daily_breakdown(integer) FROM PUBLIC, anon, authenticated;
   GRANT EXECUTE ON FUNCTION public.icp_daily_breakdown(integer) TO authenticated;
   ```
2. **Novo componente** `src/components/admin/IcpDailyChart.tsx` (~120 linhas) consumido dentro de `PQLAnalytics.tsx` no final do JSX.
3. Cores: usar tokens semânticos (`hsl(var(--primary))` ON, `hsl(var(--muted-foreground))` OFF) — sem hardcode.

### Vantagens
- Mostra tendência (estamos atraindo mais ICP ao longo do tempo?).
- RPC isolada, fácil reutilizar em outros painéis.

### Desvantagens
- Mais 1 RPC para manter — mitigado por nome explícito e comentário de documentação.

---

## 3) P11 — Guard ICP (proteção permanente contra regressão)

### Problema a fechar
Hoje `is_icp_profile` é protegido em runtime via `.is('is_icp_profile', null)` em `Start.tsx` e `UserObjectiveModal.tsx` (ADR-014). Nada impede que um futuro PR adicione um UPDATE sem o filtro `.is(null)`, quebrando a imutabilidade silenciosamente.

### Proposta — proteção em **2 camadas**

**Camada A — Lint/Contract test** `src/__tests__/contracts/p11-icp-immutability.test.ts`:
- Varre `src/**/*.{ts,tsx}` e `supabase/functions/**/*.ts`.
- Para todo trecho que contém `is_icp_profile` dentro de um `.update(`, exige que o mesmo bloco contenha `.is('is_icp_profile', null)` OU um comentário whitelist `// @icp-immutable-allowed: <motivo>`.
- Falha o CI se encontrar UPDATE sem guard.

**Camada B — Trigger no banco** (defesa em profundidade):
   ```sql
   CREATE OR REPLACE FUNCTION public.enforce_icp_immutable()
   RETURNS trigger LANGUAGE plpgsql AS $$
   BEGIN
     IF OLD.is_icp_profile IS NOT NULL
        AND NEW.is_icp_profile IS DISTINCT FROM OLD.is_icp_profile THEN
       RAISE EXCEPTION 'is_icp_profile is immutable after first write (ADR-014)';
     END IF;
     RETURN NEW;
   END $$;
   CREATE TRIGGER trg_icp_immutable
     BEFORE UPDATE ON public.profiles
     FOR EACH ROW WHEN (OLD.is_icp_profile IS DISTINCT FROM NEW.is_icp_profile)
     EXECUTE FUNCTION public.enforce_icp_immutable();
   ```
- Garante que mesmo psql/dashboard/edge function maliciosa não consegue sobrescrever.

### Vantagens
- Imutabilidade deixa de depender de disciplina do desenvolvedor.
- Trigger é a rede de segurança final; teste é o feedback rápido (CI).

### Desvantagens
- Trigger bloqueia migrações legítimas que precisem corrigir um valor errado → mitigar exigindo `SET LOCAL session_replication_role = replica` ou um helper RPC `admin_force_reset_icp(_user_id)` SECURITY DEFINER auditado.

### Atualização de memória
Atualizar `mem://quality/regression-shields` para incluir P11 e `mem://index.md` Core Rule sobre escudos passa a "11 proteções P1-P11".

---

## Ordem de execução
1. Migration única com: RPC `real_users_daily` estendida + RPC `icp_daily_breakdown` + trigger `enforce_icp_immutable`.
2. Atualizar `LoginVsCadastrosTable.tsx`.
3. Criar `IcpDailyChart.tsx` e plugar em `PQLAnalytics.tsx`.
4. Criar contract test `p11-icp-immutability.test.ts`.
5. Atualizar `docs/ADR.md` (ADR-014 ganha seção "Enforcement"), `docs/PENDENCIAS.md`, `mem://quality/regression-shields` e `mem://index.md`.

## Checklist manual pós-deploy
- [ ] Tabela mostra coluna PerfilON com valores coerentes (Σ PerfilON ≤ Σ Cadastros).
- [ ] Card KPI "PerfilON" aparece no topo.
- [ ] Gráfico ICP renderiza em /masteradm → PQL Analytics, filtros 7/15/30 funcionam.
- [ ] Tentar UPDATE manual `is_icp_profile` no SQL Editor → trigger barra com mensagem clara.
- [ ] CI roda e o teste P11 passa; criar PR de teste mexendo no guard para confirmar que falha.

## Pendências / fora de escopo
- Não vamos retroagir cadastros antigos sem `is_icp_profile` (já tratado pelo backfill da ADR-014).
- Modal admin para "forçar reset de ICP" (caso de suporte) fica como melhoria futura.
