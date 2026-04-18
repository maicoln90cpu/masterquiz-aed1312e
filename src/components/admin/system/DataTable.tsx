import { useMemo, useState, ReactNode } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, ArrowUpDown, Download, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { ColumnFilter } from './ColumnFilter';
import { PaginationControls } from './PaginationControls';
import { cn } from '@/lib/utils';
import { formatValue, rowsToCsv, downloadCsv, type DataTableFormat } from '@/lib/dataTableFormatters';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  /** Permite ordenação clicando no cabeçalho. */
  sortable?: boolean;
  /** Adiciona ícone de funil estilo Excel. Os valores únicos vêm do dataset inteiro. */
  filterable?: boolean;
  /** Inclui esta coluna na busca global debounced. */
  searchable?: boolean;
  /** Renderizador customizado da célula (badges, links, ícones). */
  render?: (row: T) => ReactNode;
  /** Formatador embutido (date, currency, etc). */
  format?: DataTableFormat;
  /** Alinhamento horizontal. */
  align?: 'left' | 'center' | 'right';
  /** Largura sugerida (className tailwind). */
  className?: string;
  /** Função custom para extrair o valor a ser usado em sort/filtro/busca. */
  accessor?: (row: T) => unknown;
  /** Função custom para extrair o valor exportado em CSV. */
  csvValue?: (row: T) => string | number | null | undefined;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  /** Coluna usada para sort inicial. */
  defaultSortKey?: keyof T | string;
  defaultSortDirection?: 'asc' | 'desc';
  pageSize?: number;
  /** Mostra busca global se houver pelo menos 1 coluna `searchable`. */
  searchPlaceholder?: string;
  /** Habilita botão de export CSV. */
  exportCsv?: boolean | string;
  /** Mensagem quando data está vazia (após filtros). */
  emptyMessage?: string;
  /** Estado de carregamento. */
  isLoading?: boolean;
  /** Linha extra de ações (ex.: botões editar/excluir) renderizada na última coluna. */
  actions?: (row: T) => ReactNode;
  /** Identificador estável da linha (default: índice). */
  rowKey?: (row: T, index: number) => string;
  /** className do container. */
  className?: string;
}

const getValue = <T,>(row: T, col: DataTableColumn<T>): unknown => {
  if (col.accessor) return col.accessor(row);
  return (row as any)[col.key as any];
};

export function DataTable<T>({
  data,
  columns,
  defaultSortKey,
  defaultSortDirection = 'desc',
  pageSize: initialPageSize = 15,
  searchPlaceholder = 'Buscar…',
  exportCsv = false,
  emptyMessage = 'Nenhum registro encontrado.',
  isLoading = false,
  actions,
  rowKey,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey as string | undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});

  const searchableCols = useMemo(() => columns.filter(c => c.searchable), [columns]);
  const filterableCols = useMemo(() => columns.filter(c => c.filterable), [columns]);
  const hasSearch = searchableCols.length > 0;

  // 1) Filtros por coluna (sobre o dataset completo)
  const afterColumnFilters = useMemo(() => {
    return data.filter(row => {
      for (const col of filterableCols) {
        const sel = colFilters[String(col.key)];
        if (!sel || sel.size === 0) continue;
        const val = getValue(row, col);
        const str = val === null || val === undefined || val === '' ? '—' : String(val);
        if (!sel.has(str)) return false;
      }
      return true;
    });
  }, [data, colFilters, filterableCols]);

  // 2) Busca global
  const afterSearch = useMemo(() => {
    if (!debouncedSearch || !hasSearch) return afterColumnFilters;
    const s = debouncedSearch.toLowerCase();
    return afterColumnFilters.filter(row =>
      searchableCols.some(col => {
        const val = getValue(row, col);
        return val != null && String(val).toLowerCase().includes(s);
      })
    );
  }, [afterColumnFilters, debouncedSearch, hasSearch, searchableCols]);

  // 3) Ordenação
  const sorted = useMemo(() => {
    if (!sortKey) return afterSearch;
    const col = columns.find(c => String(c.key) === sortKey);
    if (!col) return afterSearch;
    return [...afterSearch].sort((a, b) => {
      const av = getValue(a, col);
      const bv = getValue(b, col);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      // tenta data
      const ad = new Date(av as any).getTime();
      const bd = new Date(bv as any).getTime();
      if (!isNaN(ad) && !isNaN(bd) && typeof av === 'string' && /\d{4}-\d{2}-\d{2}/.test(av)) {
        return sortDir === 'asc' ? ad - bd : bd - ad;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'pt-BR')
        : String(bv).localeCompare(String(av), 'pt-BR');
    });
  }, [afterSearch, sortKey, sortDir, columns]);

  // 4) Paginação
  const { currentPage, totalPages, paginatedData, setCurrentPage, totalItems, startIndex } =
    usePagination(sorted, pageSize);

  // Valores únicos por coluna filtrável (calculados sobre o dataset COMPLETO)
  const uniqueByCol = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of filterableCols) {
      const set = new Set<string>();
      for (const row of data) {
        const v = getValue(row, col);
        set.add(v === null || v === undefined || v === '' ? '—' : String(v));
      }
      map[String(col.key)] = Array.from(set);
    }
    return map;
  }, [data, filterableCols]);

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    const k = String(col.key);
    if (sortKey === k) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

  const handleExport = () => {
    const filename = typeof exportCsv === 'string' ? exportCsv : 'export';
    const csv = rowsToCsv(sorted, columns.map(c => ({
      key: c.key,
      label: c.label,
      format: c.format,
      csvValue: c.csvValue ?? (c.accessor ? (r: T) => c.accessor!(r) as any : undefined),
    })));
    downloadCsv(filename, csv);
  };

  if (isLoading) {
    return <Skeleton className={cn('h-[400px] w-full rounded-lg', className)} />;
  }

  const totalCols = columns.length + (actions ? 1 : 0);

  return (
    <div className={cn('space-y-3', className)}>
      {(hasSearch || exportCsv) && (
        <div className="flex flex-wrap items-center gap-2">
          {hasSearch && (
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
              aria-label="Itens por página"
            >
              {[10, 15, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n} / pág</option>
              ))}
            </select>
            {exportCsv && (
              <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
                <Download className="h-3.5 w-3.5 mr-1" /> CSV
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => {
                const k = String(col.key);
                const isSorted = sortKey === k;
                return (
                  <TableHead
                    key={k}
                    className={cn(
                      col.className,
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                    )}
                    onClick={() => handleSort(col)}
                  >
                    <div className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'right' && 'justify-end w-full',
                      col.align === 'center' && 'justify-center w-full',
                    )}>
                      <span>{col.label}</span>
                      {col.sortable && (
                        isSorted ? (
                          sortDir === 'asc'
                            ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            : <ArrowDown className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )
                      )}
                      {col.filterable && (
                        <ColumnFilter
                          label={col.label}
                          allValues={uniqueByCol[k] || []}
                          selected={colFilters[k] || new Set()}
                          onChange={(next) => {
                            setColFilters(prev => ({ ...prev, [k]: next }));
                            setCurrentPage(1);
                          }}
                        />
                      )}
                    </div>
                  </TableHead>
                );
              })}
              {actions && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} className="text-center text-muted-foreground py-8">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : paginatedData.map((row, i) => (
              <TableRow key={rowKey ? rowKey(row, startIndex + i) : startIndex + i}>
                {columns.map(col => {
                  const k = String(col.key);
                  const raw = getValue(row, col);
                  return (
                    <TableCell
                      key={k}
                      className={cn(
                        col.className,
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                      )}
                    >
                      {col.render ? col.render(row) : formatValue(raw, col.format)}
                    </TableCell>
                  );
                })}
                {actions && <TableCell className="text-right">{actions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
