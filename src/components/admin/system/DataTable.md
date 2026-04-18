# DataTable — Tabela admin universal

Componente único para listas/tabelas em **todas as telas administrativas**. Padroniza:
- Busca global debounced
- Sort clicável por coluna
- Filtros tipo Excel (funil) por coluna
- Paginação
- Export CSV
- Skeleton loading
- Renderers customizados (badges, links, ícones)

> 🚫 **Em `src/components/admin/**` é PROIBIDO importar `<Table>` direto de `@/components/ui/table`.**
> Sempre use este `<DataTable />`. A regra do ESLint vai te avisar.

## Exemplo mínimo

```tsx
import { DataTable, type DataTableColumn } from '@/components/admin/system/DataTable';

type User = { id: string; name: string; email: string; created_at: string; plan: 'free' | 'pro' };

const columns: DataTableColumn<User>[] = [
  { key: 'name',       label: 'Nome',     sortable: true, searchable: true },
  { key: 'email',      label: 'E-mail',   searchable: true },
  { key: 'plan',       label: 'Plano',    filterable: true, render: (u) => <Badge>{u.plan}</Badge> },
  { key: 'created_at', label: 'Criado',   sortable: true, format: 'date' },
];

<DataTable
  data={users}
  columns={columns}
  defaultSortKey="created_at"
  exportCsv="usuarios"
  rowKey={(u) => u.id}
/>
```

## Props principais

| Prop | Tipo | Descrição |
|------|------|-----------|
| `data` | `T[]` | Linhas da tabela |
| `columns` | `DataTableColumn<T>[]` | Definição das colunas (ver abaixo) |
| `defaultSortKey` | `string` | Coluna usada para sort inicial |
| `defaultSortDirection` | `'asc' \| 'desc'` | Direção inicial (default `desc`) |
| `pageSize` | `number` | Itens por página inicial (default 15) |
| `exportCsv` | `boolean \| string` | Habilita botão CSV; passe string para customizar nome |
| `searchPlaceholder` | `string` | Placeholder do input de busca |
| `emptyMessage` | `string` | Texto quando não há linhas |
| `isLoading` | `boolean` | Mostra Skeleton |
| `actions` | `(row) => ReactNode` | Coluna extra à direita (botões editar/excluir) |
| `rowKey` | `(row, idx) => string` | Identificador estável (recomendado) |

## Definição de coluna

| Campo | Quando usar |
|-------|-------------|
| `key` | Nome da propriedade do objeto |
| `label` | Cabeçalho exibido |
| `sortable` | Permite clicar no header para ordenar |
| `filterable` | Adiciona ícone de funil estilo Excel |
| `searchable` | Inclui na busca global |
| `render(row)` | Renderiza badge/link/ícone customizado |
| `format` | Formatador embutido (`'date'`, `'datetime'`, `'currency'`, `'number'`, `'percent'`) |
| `accessor(row)` | Extrai valor custom para sort/filtro/busca |
| `csvValue(row)` | Valor exportado para CSV (quando difere do exibido) |
| `align` | `'left' \| 'center' \| 'right'` |
| `className` | Classes Tailwind adicionais |

## Quando usar `<Table>` direto?

Apenas para casos muito específicos (ex.: layouts com `colspan` complexo, edição inline, virtualização). Nesses casos:

1. Adicione exceção explícita em `eslint.config.js` listando o arquivo.
2. Comente no topo do arquivo o motivo.

Para 99% dos casos, **`<DataTable />` é a resposta**.
