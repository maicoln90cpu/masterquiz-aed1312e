import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { fetchAuditLogs, type AuditRow } from '@/services/systemMonitorService';
import { useTableSort } from '@/hooks/useTableSort';
import { usePagination } from '@/hooks/usePagination';
import { SortableTableHeader } from './SortableTableHeader';
import { PaginationControls } from './PaginationControls';

const AuditLogPanel = () => {
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-audit'],
    queryFn: () => fetchAuditLogs(200),
    staleTime: 5 * 60 * 1000,
  });

  const actions = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(d => d.action))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (actionFilter !== 'all') rows = rows.filter(r => r.action === actionFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(r =>
        r.action.toLowerCase().includes(q) ||
        (r.resource_type ?? '').toLowerCase().includes(q) ||
        (r.user_id ?? '').toLowerCase().includes(q) ||
        JSON.stringify(r.metadata ?? {}).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, actionFilter, searchQuery]);

  const { sortConfig, handleSort, sortedData } = useTableSort<AuditRow>(filtered, 'created_at', 'desc');
  const { paginatedData, currentPage, totalPages, totalItems, startIndex, setCurrentPage } = usePagination(sortedData, 15);

  const handleExportCSV = () => {
    const headers = ['Data', 'Ator', 'Ação', 'Entidade', 'Detalhes'];
    const rows = sortedData.map(log => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      log.user_id ?? 'Sistema',
      log.action,
      log.resource_type ?? '-',
      JSON.stringify(log.metadata ?? {}),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2" disabled={sortedData.length === 0}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <SortableTableHeader<AuditRow> label="Data/Hora" sortKey="created_at" currentSort={sortConfig} onSort={handleSort} />
            <TableHead>Ator</TableHead>
            <SortableTableHeader<AuditRow> label="Ação" sortKey="action" currentSort={sortConfig} onSort={handleSort} />
            <SortableTableHeader<AuditRow> label="Entidade" sortKey="resource_type" currentSort={sortConfig} onSort={handleSort} />
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((log, i) => (
            <TableRow key={log.id}>
              <TableCell className="text-muted-foreground">{startIndex + i + 1}</TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {new Date(log.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[120px]">{log.user_id?.slice(0, 8) ?? 'Sistema'}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{log.action}</Badge>
              </TableCell>
              <TableCell className="text-sm">{log.resource_type ?? '-'}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : '-'}
              </TableCell>
            </TableRow>
          ))}
          {paginatedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum log encontrado.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        startIndex={startIndex}
        pageSize={15}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AuditLogPanel;
