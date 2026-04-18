

## Plano — Etapa F: DataTable universal + retorno do "Logins vs Cadastros"

Dois itens. O segundo é trivial; o primeiro é maior e por isso será entregue em fases.

---

### Item 2 (rápido) — "Logins vs Cadastros" não desapareceu, está escondido

**Onde está hoje:** Admin → 💰 **Financeiro** → sub-aba **Relatórios**. Você provavelmente não procurou nessa aba porque o nome não sugere "comparativo de cadastros".

**O que fazer (escolha uma das duas):**

- **Opção A (recomendada):** mover o `<LoginVsCadastrosTable />` para **📊 Painel Geral → sub-aba Dashboard** (junto dos outros KPIs de visão geral). Faz mais sentido contextual.
- **Opção B:** manter onde está, mas adicionar um atalho/duplicata em "Painel Geral".

Vou assumir **Opção A** salvo se você pedir Opção B.

---

### Item 1 — Componente `<DataTable />` universal

#### Diagnóstico do que existe hoje

Já temos peças soltas:
- `useTableSort` — ordenação por coluna ✅
- `usePagination` — paginação ✅
- `SortableTableHeader` — cabeçalho clicável ✅
- `PaginationControls` — controles de página ✅
- `useDebounce` — para busca ✅

**Problema:** cada tabela monta esse quebra-cabeça à mão. Algumas esquecem paginação (ICP, LoginVsCadastros, RecoveryQueue, TrialLogsViewer, EmailRecoveryReports, PQLAnalytics, AuditLogsViewer, ModeComparison, etc.). Não existe **filtro por valores da coluna** (tipo Excel: clicar no cabeçalho e marcar quais valores incluir).

#### O que vamos criar

Um único componente `DataTable<T>` em `src/components/admin/system/DataTable.tsx` que junta tudo:

```ts
<DataTable
  data={rows}
  columns={[
    { key: 'email', label: 'Email', sortable: true, filterable: true, searchable: true },
    { key: 'plan_type', label: 'Plano', filterable: true, render: (r) => <Badge>{r.plan_type}</Badge> },
    { key: 'icp_score', label: 'Score', sortable: true, align: 'right' },
    { key: 'created_at', label: 'Cadastro', sortable: true, format: 'date' },
  ]}
  defaultSortKey="icp_score"
  defaultSortDirection="desc"
  pageSize={15}
  searchPlaceholder="Buscar por email ou nome…"
  exportCsv               // botão de export opcional
  emptyMessage="Nenhum registro"
/>
```

#### Funcionalidades incluídas

1. **Ordenação** por qualquer coluna marcada `sortable` (clicar alterna asc/desc).
2. **Filtro por coluna estilo Excel:** ícone de funil no cabeçalho de colunas marcadas `filterable`. Abre popover listando **todos os valores únicos da coluna em todo o dataset** (não só da página atual) com checkboxes. Funciona como o Excel.
3. **Busca global** debounced (300ms) sobre colunas marcadas `searchable`.
4. **Paginação** automática (configurável: 10/15/25/50/100 por página).
5. **Renderizadores customizados** por coluna (`render`) — para badges, links, ícones.
6. **Formatadores prontos** (`format: 'date' | 'datetime' | 'currency' | 'percent' | 'number'`).
7. **Estados:** loading (skeleton), vazio (mensagem), erro (badge).
8. **Export CSV** opcional (respeita filtros e ordenação aplicados).
9. **Persistência opcional** de filtros/ordenação na URL via query params (ex.: `?sort=icp_score:desc&filter_plan=free`) — fase 2.
10. **Acessibilidade:** ARIA, navegação teclado nos headers e popovers.

#### Importante: filtro inclui dados de todas as páginas

Hoje, quando uma tabela tem paginação, o filtro/busca só vê a página atual. O `DataTable` resolve isso aplicando **filtro → ordenação → paginação nessa ordem** sobre o dataset completo. Ou seja: você filtra por "plan_type = pro" e a paginação se reorganiza nos resultados filtrados, vendo o universo inteiro.

#### Tabelas migradas — Fases

**Fase 1 — Criar o componente + migrar 3 tabelas críticas (mais ganho/risco baixo):**
1. `ICPInsightsTab` (sem paginação hoje, 500 linhas — pesado)
2. `LoginVsCadastrosTable` (sem paginação, 30 dias)
3. `TrialLogsViewer` (sem paginação)

**Fase 2 — Migrar tabelas de recovery e relatórios:**
4. `RecoveryQueue`
5. `RecoveryTemplates`
6. `RecoveryBlacklist`
7. `EmailRecoveryReports` (3 tabelas internas)
8. `PQLAnalytics` (3 tabelas internas)
9. `AuditLogsViewer`
10. `ModeComparison` (tabela `<table>` HTML pura)

**Fase 3 — Migrar painéis de sistema (já têm sort+paginação, ganham filtro de coluna):**
11. `ClientErrorsPanel`, `PerformancePanel`, `FeatureUsagePanel`, `CronMonitorPanel`, `IntegrationsHealthPanel`, `AuditLogPanel`

**Fase 4 — Custos e Observability:**
12. `UnifiedCostsDashboard` (3 tabelas), `ObservabilityTab` (3 tabelas)

**Fora de escopo (não-admin):** `Compare.tsx` (página pública estática), `CampaignRecipientsPanel` (usa `<table>` HTML simples, opcional).

---

### Arquivos novos / alterados

**Fase 1 (entrega imediata desta etapa):**
- **NOVO:** `src/components/admin/system/DataTable.tsx`
- **NOVO:** `src/components/admin/system/ColumnFilter.tsx` (popover de filtro por valores)
- **NOVO:** `src/lib/dataTableFormatters.ts` (formatadores comuns)
- **EDITA:** `src/components/admin/users/ICPInsightsTab.tsx` (migra para DataTable)
- **EDITA:** `src/components/admin/LoginVsCadastrosTable.tsx` (migra para DataTable + ganha paginação)
- **EDITA:** `src/components/admin/TrialLogsViewer.tsx` (migra)
- **EDITA:** `src/pages/AdminDashboard.tsx` (move `LoginVsCadastrosTable` para a aba Dashboard)

Fases 2-4 ficam para próximas etapas sob aprovação (evita PR gigante e regressão).

---

### Antes vs Depois

| Aspecto | Antes | Depois |
|---|---|---|
| Tabela ICP | Sem paginação, 500 linhas, filtros básicos | Paginada, filtro Excel por plano/UTM/variante, busca debounced |
| Logins vs Cadastros | Escondida em "Relatórios", scroll interno 30 dias | Visível em "Painel Geral", paginada, filtro por taxa |
| Padrão para novas tabelas | Cada dev replica `<Table>` na mão, esquece paginação | Importa `DataTable`, configura colunas, pronto |
| Filtro por coluna | Não existe | Tipo Excel, vê todo dataset |

### Vantagens

- Padroniza UX em todo o admin (consistência visual e comportamental).
- Reduz código duplicado em ~60% nas próximas tabelas.
- Filtro por coluna é o que faltava para investigação rápida ("quero ver só usuários do plano X com score > Y").
- Performance: paginação obrigatória evita renderizar 500+ linhas.

### Desvantagens / Riscos

- Migração de 15+ tabelas é trabalho gradual — risco de quebrar layout específico em alguma se feita tudo de uma vez (por isso fases).
- Filtros por coluna + busca + ordenação calculados no cliente. Para tabelas >5k linhas seria preciso server-side pagination (não é o caso de nenhuma tabela admin atual).
- Componente genérico tende a ter casos especiais (ex.: célula com 2 botões de ação) — vou prever `actions?: (row) => ReactNode`.

### Checklist manual de validação (pós Fase 1)

1. **Logins vs Cadastros:** abrir Admin → Painel Geral → Dashboard. A tabela deve aparecer logo abaixo dos KPIs.
2. **ICP Insights:** abrir aba, verificar paginação aparece se >15 linhas, clicar no funil da coluna "Plano" → checkbox com valores únicos do dataset inteiro.
3. **TrialLogsViewer:** verificar paginação e filtro por status do trial.
4. **Ordenação:** clicar header de coluna → seta muda, dados reordenam.
5. **Busca:** digitar email parcial → resultado debounced após 300ms, paginação reseta para página 1.
6. **Export CSV (se habilitado):** baixa CSV com filtros aplicados.
7. **Mobile:** tabelas continuam com `overflow-x-auto` (sem regressão visual).

### Pendências / próximas etapas

- **Fase 2-4** sob aprovação posterior.
- **Persistência de filtros na URL** (fase 2 do componente — útil para compartilhar links).
- **Filtros numéricos com range** (ex.: score entre 50-80) — fase 2.
- **Server-side pagination** se alguma tabela passar de 5k linhas no futuro.

### Prevenção de regressão permanente

- Lint rule custom: detectar `<Table>` direto em arquivos novos dentro de `src/components/admin/**` e sugerir `DataTable`. Implementar junto com Fase 4 (quando todas migrarem).
- README curto em `src/components/admin/system/DataTable.md` com 1 exemplo de uso para devs futuros.
- Testes unitários básicos do `DataTable` (filtro, sort, paginação) — Vitest.

