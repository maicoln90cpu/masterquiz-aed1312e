import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Shield, User, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/admin/system/DataTable";

const FETCH_LIMIT = 1000;

export const AuditLogsViewer = () => {
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const getActionBadgeVariant = (action: string): "default" | "destructive" | "outline" | "secondary" => {
    if (action.includes('login') || action.includes('signup')) return 'default';
    if (action.includes('created')) return 'secondary';
    if (action.includes('deleted')) return 'destructive';
    if (action.includes('updated')) return 'outline';
    if (action.includes('admin')) return 'outline';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>
              Últimos {FETCH_LIMIT} registros — busca, filtro e exportação aplicam-se sobre todo o conjunto carregado.
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={logs}
          isLoading={isLoading}
          rowKey={(l) => l.id}
          defaultSortKey="created_at"
          defaultSortDirection="desc"
          pageSize={25}
          searchPlaceholder="Buscar por ação, recurso ou ID…"
          emptyMessage="Nenhum log encontrado"
          exportCsv="audit-logs"
          columns={[
            {
              key: 'created_at',
              label: 'Data/Hora',
              sortable: true,
              render: (l) => (
                <span className="text-xs">{format(new Date(l.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
              ),
            },
            {
              key: 'user_id',
              label: 'Usuário',
              searchable: true,
              render: (l) => (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs truncate max-w-[120px]">
                    {l.user_id ? l.user_id.substring(0, 8) : 'Anônimo'}
                  </span>
                </div>
              ),
            },
            {
              key: 'action',
              label: 'Ação',
              sortable: true,
              filterable: true,
              searchable: true,
              render: (l) => (
                <Badge variant={getActionBadgeVariant(l.action)} className="text-xs">{l.action}</Badge>
              ),
            },
            {
              key: 'resource_type',
              label: 'Recurso',
              sortable: true,
              filterable: true,
              searchable: true,
              render: (l) => (
                <div className="text-xs">
                  {l.resource_type ? (
                    <>
                      <div className="font-medium">{l.resource_type}</div>
                      {l.resource_id && (
                        <div className="text-muted-foreground truncate max-w-[100px]">
                          {l.resource_id.substring(0, 8)}…
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              ),
            },
            {
              key: 'ip_address',
              label: 'IP',
              render: (l) => (
                <span className="text-xs text-muted-foreground">
                  {l.ip_address ? String(l.ip_address) : '-'}
                </span>
              ),
            },
            {
              key: 'metadata',
              label: 'Detalhes',
              accessor: (l) => l.metadata ? JSON.stringify(l.metadata) : '',
              render: (l) =>
                l.metadata && typeof l.metadata === 'object' && Object.keys(l.metadata as Record<string, any>).length > 0 ? (
                  <code className="text-xs bg-muted p-2 rounded block max-w-[200px] overflow-x-auto">
                    {JSON.stringify(l.metadata)}
                  </code>
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                ),
              csvValue: (l) => l.metadata ? JSON.stringify(l.metadata) : '',
            },
          ]}
        />
      </CardContent>
    </Card>
  );
};
