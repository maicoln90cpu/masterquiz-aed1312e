import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { fetchAuditLogs, type AuditRow } from '@/services/systemMonitorService';
import { DataTable, type DataTableColumn } from './DataTable';
import { QueryFallback } from './QueryFallback';

const AuditLogPanel = () => {
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['system-monitor-audit'],
    queryFn: () => fetchAuditLogs(500),
    staleTime: 5 * 60 * 1000,
  });

  const rows = data ?? [];

  const columns: DataTableColumn<AuditRow>[] = [
    { key: 'created_at', label: 'Data/Hora', sortable: true, format: 'datetime', className: 'text-sm whitespace-nowrap' },
    {
      key: 'user_id',
      label: 'Ator',
      searchable: true,
      render: (r) => <span className="font-mono text-xs">{r.user_id?.slice(0, 8) ?? 'Sistema'}</span>,
    },
    {
      key: 'action',
      label: 'Ação',
      sortable: true,
      filterable: true,
      searchable: true,
      render: (r) => <Badge variant="outline" className="text-xs">{r.action}</Badge>,
    },
    {
      key: 'resource_type',
      label: 'Entidade',
      sortable: true,
      filterable: true,
      searchable: true,
      render: (r) => <span className="text-sm">{r.resource_type ?? '-'}</span>,
    },
    {
      key: 'metadata',
      label: 'Detalhes',
      accessor: (r) => (r.metadata ? JSON.stringify(r.metadata) : ''),
      searchable: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground max-w-[260px] truncate inline-block">
          {r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4">
      <QueryFallback
        isLoading={false}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
      >
        <DataTable<AuditRow>
          data={rows}
          columns={columns}
          defaultSortKey="created_at"
          defaultSortDirection="desc"
          pageSize={15}
          searchPlaceholder="Buscar ação, entidade ou ator…"
          exportCsv="audit-log"
          isLoading={isLoading}
          emptyMessage="Nenhum log encontrado."
          rowKey={(r) => r.id}
        />
      </QueryFallback>
    </div>
  );
};

export default AuditLogPanel;
