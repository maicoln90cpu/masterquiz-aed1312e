import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, type DataTableColumn } from './DataTable';
import { KnownErrorDialog } from './KnownErrorDialog';
import { fetchTopErrors, type TopErrorRow } from '@/services/topErrorsService';

const severityVariant: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  medium: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  high: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-700 border-red-500/30',
};

function StatusBadge({ row }: { row: TopErrorRow }) {
  if (row.is_ignored) {
    return <Badge variant="outline" className="text-muted-foreground">Ignorado</Badge>;
  }
  if (row.is_documented) {
    return <Badge variant="outline" className="border-green-500 text-green-600">Documentado</Badge>;
  }
  return <Badge variant="outline" className="border-red-500 text-red-600">Novo</Badge>;
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <Badge variant="outline" className={severityVariant[severity] ?? ''}>
      {severity}
    </Badge>
  );
}

export function TopErrorsPanel() {
  const [days, setDays] = useState('7');
  const [hideIgnored, setHideIgnored] = useState(true);
  const [selected, setSelected] = useState<TopErrorRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['top-errors', days],
    queryFn: () => fetchTopErrors(Number(days), 50),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return hideIgnored ? data.filter((e) => !e.is_ignored) : data;
  }, [data, hideIgnored]);

  const columns: DataTableColumn<TopErrorRow>[] = [
    {
      key: 'fingerprint',
      label: 'Fingerprint',
      className: 'font-mono text-[10px] text-muted-foreground',
      render: (r) => r.fingerprint.slice(0, 8),
    },
    {
      key: 'component_name',
      label: 'Componente',
      sortable: true,
      filterable: true,
      searchable: true,
      className: 'font-mono text-xs',
    },
    {
      key: 'sample_message',
      label: 'Mensagem-exemplo',
      searchable: true,
      className: 'text-xs max-w-[360px] truncate',
    },
    {
      key: 'count_period',
      label: 'Qtd',
      sortable: true,
      align: 'right',
      className: 'font-bold',
    },
    {
      key: 'last_seen_at',
      label: 'Última',
      sortable: true,
      format: 'datetime',
      className: 'text-xs text-muted-foreground',
    },
    {
      key: 'known_severity',
      label: 'Severidade',
      filterable: true,
      render: (r) => <SeverityBadge severity={r.known_severity} />,
    },
    {
      key: 'is_documented',
      label: 'Status',
      filterable: true,
      render: (r) => <StatusBadge row={r} />,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <Checkbox
            checked={hideIgnored}
            onCheckedChange={(c) => setHideIgnored(c === true)}
          />
          Esconder ignorados
        </label>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum erro agrupado encontrado no período. 🎉
        </p>
      ) : (
        <DataTable<TopErrorRow>
          data={filtered}
          columns={columns}
          defaultSortKey="count_period"
          defaultSortDirection="desc"
          pageSize={15}
          searchPlaceholder="Buscar componente ou mensagem…"
          exportCsv="top-errors"
          rowKey={(r) => r.fingerprint}
          actions={(row) => (
            <Button
              size="sm"
              variant={row.is_documented ? 'outline' : 'secondary'}
              onClick={() => {
                setSelected(row);
                setDialogOpen(true);
              }}
            >
              {row.is_documented ? 'Editar' : 'Documentar'}
            </Button>
          )}
        />
      )}

      <KnownErrorDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setSelected(null);
        }}
        errorRow={selected}
      />
    </>
  );
}