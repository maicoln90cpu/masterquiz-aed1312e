import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchClientErrors } from '@/services/systemMonitorService';
import { DataTable, type DataTableColumn } from './DataTable';
import { QueryFallback } from './QueryFallback';

interface GroupedError {
  component: string;
  count: number;
  lastError: string;
  lastSeen: string;
}

const PERIOD_OPTIONS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
];

const ClientErrorsPanel = () => {
  const [days, setDays] = useState(7);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['system-monitor-errors', days],
    queryFn: () => fetchClientErrors(days),
    staleTime: 5 * 60 * 1000,
  });

  const grouped = useMemo<GroupedError[]>(() => {
    const map = new Map<string, GroupedError>();
    for (const err of data ?? []) {
      const key = err.component_name || 'Desconhecido';
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        if (err.created_at > existing.lastSeen) {
          existing.lastSeen = err.created_at;
          existing.lastError = err.error_message;
        }
      } else {
        map.set(key, { component: key, count: 1, lastError: err.error_message, lastSeen: err.created_at });
      }
    }
    return Array.from(map.values());
  }, [data]);

  const totalErrors = (data ?? []).length;

  const columns: DataTableColumn<GroupedError>[] = [
    { key: 'component', label: 'Componente', sortable: true, filterable: true, searchable: true, className: 'font-mono text-xs' },
    { key: 'lastError', label: 'Última Mensagem', searchable: true, className: 'text-xs max-w-[300px] truncate text-muted-foreground' },
    {
      key: 'count',
      label: 'Contagem',
      sortable: true,
      align: 'right',
      render: (g) => (
        <Badge variant={g.count > 20 ? 'destructive' : g.count > 5 ? 'secondary' : 'outline'}>{g.count}</Badge>
      ),
    },
    { key: 'lastSeen', label: 'Última Ocorrência', sortable: true, format: 'datetime', className: 'text-sm text-muted-foreground whitespace-nowrap' },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <Button key={opt.value} variant={days === opt.value ? 'default' : 'outline'} size="sm" onClick={() => setDays(opt.value)}>
              {opt.label}
            </Button>
          ))}
        </div>
        <Badge variant={totalErrors > 50 ? 'destructive' : totalErrors > 10 ? 'secondary' : 'default'}>
          {totalErrors} erros totais
        </Badge>
      </div>

      <QueryFallback
        isLoading={false}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
      >
        <DataTable<GroupedError>
          data={grouped}
          columns={columns}
          defaultSortKey="count"
          defaultSortDirection="desc"
          pageSize={15}
          searchPlaceholder="Buscar componente ou mensagem…"
          exportCsv="client-errors"
          isLoading={isLoading}
          emptyMessage="Nenhum erro registrado no período. 🎉"
          rowKey={(r) => r.component}
        />
      </QueryFallback>
    </div>
  );
};

export default ClientErrorsPanel;
