import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Send, MailOpen, MousePointerClick, AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface EmailContact {
  id: string;
  email: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
  days_inactive_at_contact: number | null;
  user_plan_at_contact: string | null;
  retry_count: number | null;
  created_at: string | null;
  template_id: string | null;
  email_recovery_templates: {
    name: string;
    category: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  opened: 'bg-blue-100 text-blue-700',
  clicked: 'bg-purple-100 text-purple-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  welcome: '👋 Boas-vindas',
  check_in: '🤔 Check-in',
  recovery: '🔄 Recuperação',
  reminder: '⏰ Lembrete',
  special_offer: '🎁 Oferta Especial',
  reactivation: '🚀 Reativação',
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export function EmailRecoveryReports() {
  const [contacts, setContacts] = useState<EmailContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('email_recovery_contacts')
        .select('*, email_recovery_templates(name, category)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setContacts(data || []);
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const filtered = contacts.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (categoryFilter !== 'all' && c.email_recovery_templates?.category !== categoryFilter) return false;
    return true;
  });

  const total = contacts.length;
  const sent = contacts.filter(c => c.status === 'sent').length;
  const opened = contacts.filter(c => c.opened_at).length;
  const clicked = contacts.filter(c => c.clicked_at).length;
  const failed = contacts.filter(c => c.status === 'failed').length;
  const pending = contacts.filter(c => c.status === 'pending').length;

  // By category chart data
  const categoryMap = new Map<string, { sent: number; opened: number; clicked: number; failed: number }>();
  contacts.forEach(c => {
    const cat = c.email_recovery_templates?.category || 'unknown';
    if (!categoryMap.has(cat)) categoryMap.set(cat, { sent: 0, opened: 0, clicked: 0, failed: 0 });
    const entry = categoryMap.get(cat)!;
    if (c.status === 'sent') entry.sent++;
    if (c.opened_at) entry.opened++;
    if (c.clicked_at) entry.clicked++;
    if (c.status === 'failed') entry.failed++;
  });

  const categoryChartData = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
    name: CATEGORY_LABELS[cat] || cat,
    ...stats,
  }));

  // Pie chart data
  const pieData = [
    { name: 'Enviados', value: sent, color: '#10b981' },
    { name: 'Pendentes', value: pending, color: '#f59e0b' },
    { name: 'Falhas', value: failed, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600"><Mail className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 text-green-600"><Send className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{sent}</p>
              <p className="text-xs text-muted-foreground">Enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600"><MailOpen className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{opened}</p>
              <p className="text-xs text-muted-foreground">Abertos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600"><MousePointerClick className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{clicked}</p>
              <p className="text-xs text-muted-foreground">Clicados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold">{failed}</p>
              <p className="text-xs text-muted-foreground">Falhas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Categoria de Email</CardTitle>
            <CardDescription>Performance por tipo de template</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" name="Enviados" fill="#10b981" />
                  <Bar dataKey="opened" name="Abertos" fill="#3b82f6" />
                  <Bar dataKey="clicked" name="Clicados" fill="#8b5cf6" />
                  <Bar dataKey="failed" name="Falhas" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados ainda</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Status</CardTitle>
            <CardDescription>Visão geral do pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sem dados ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-base">Todos os Emails Enviados</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="failed">Falhas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => { setLoading(true); load(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum email encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 100).map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{c.email}</TableCell>
                      <TableCell className="text-sm">{c.email_recovery_templates?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[c.email_recovery_templates?.category || ''] || c.email_recovery_templates?.category || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-700'}`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.sent_at ? new Date(c.sent_at).toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                        {c.error_message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length > 100 && (
                <p className="text-xs text-muted-foreground text-center mt-2">Mostrando 100 de {filtered.length} registros</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
