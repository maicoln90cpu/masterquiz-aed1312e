import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DataTable, type DataTableColumn } from './DataTable';

interface IntegrationRow {
  id: string;
  user_id: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const IntegrationsHealthPanel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['system-monitor-integrations'],
    queryFn: async () => {
      const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select('id, user_id, provider, is_active, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const providerMap = new Map<string, { total: number; active: number; lastCheck: string }>();
      for (const intg of integrations ?? []) {
        const existing = providerMap.get(intg.provider) ?? { total: 0, active: 0, lastCheck: '' };
        existing.total++;
        if (intg.is_active) existing.active++;
        if (intg.updated_at > existing.lastCheck) existing.lastCheck = intg.updated_at;
        providerMap.set(intg.provider, existing);
      }

      return {
        raw: (integrations ?? []) as IntegrationRow[],
        byProvider: Array.from(providerMap.entries()).map(([provider, stats]) => ({ provider, ...stats })),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const providers = data?.byProvider ?? [];
  const raw = data?.raw ?? [];

  const columns: DataTableColumn<IntegrationRow>[] = [
    { key: 'provider', label: 'Provider', sortable: true, filterable: true, searchable: true, className: 'font-mono text-xs' },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      filterable: true,
      accessor: (r) => (r.is_active ? 'Ativo' : 'Inativo'),
      render: (r) => (
        <Badge variant={r.is_active ? 'default' : 'secondary'} className="text-xs">
          {r.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'user_id',
      label: 'User ID',
      searchable: true,
      render: (r) => <span className="font-mono text-xs">{r.user_id?.slice(0, 8)}</span>,
    },
    { key: 'updated_at', label: 'Última Atualização', sortable: true, format: 'datetime', className: 'text-xs text-muted-foreground' },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {providers.map(p => {
          const Icon = p.active === p.total ? CheckCircle : XCircle;
          return (
            <Card key={p.provider}>
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs uppercase text-muted-foreground">{p.provider}</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${p.active === p.total ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className="text-sm">{p.active}/{p.total} ativos</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DataTable<IntegrationRow>
        data={raw}
        columns={columns}
        defaultSortKey="updated_at"
        defaultSortDirection="desc"
        pageSize={15}
        searchPlaceholder="Buscar provider ou user ID…"
        exportCsv="integrations"
        emptyMessage="Nenhuma integração registrada."
        rowKey={(r) => r.id}
      />
    </div>
  );
};

export default IntegrationsHealthPanel;
