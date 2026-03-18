import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Play, RefreshCw, Clock, CheckCircle2, XCircle, Zap, BookOpen, Lightbulb, Trophy, BarChart3, Megaphone, History, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AutomationConfig {
  id: string;
  automation_key: string;
  display_name: string;
  description: string | null;
  is_enabled: boolean;
  frequency: string | null;
  last_executed_at: string | null;
  last_result: Record<string, unknown> | null;
  execution_count: number;
}

interface AutomationLog {
  id: string;
  automation_key: string;
  status: string;
  emails_sent: number;
  details: Record<string, unknown> | null;
  error_message: string | null;
  executed_at: string;
}

const AUTOMATION_ICONS: Record<string, React.ReactNode> = {
  blog_digest: <BookOpen className="h-5 w-5" />,
  weekly_tip: <Lightbulb className="h-5 w-5" />,
  success_story: <Trophy className="h-5 w-5" />,
  monthly_summary: <BarChart3 className="h-5 w-5" />,
  platform_news: <Megaphone className="h-5 w-5" />,
};

const AUTOMATION_COLORS: Record<string, string> = {
  blog_digest: 'bg-emerald-100 text-emerald-700',
  weekly_tip: 'bg-amber-100 text-amber-700',
  success_story: 'bg-purple-100 text-purple-700',
  monthly_summary: 'bg-blue-100 text-blue-700',
  platform_news: 'bg-rose-100 text-rose-700',
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  manual: 'Manual',
};

const EDGE_FUNCTION_MAP: Record<string, string> = {
  blog_digest: 'send-blog-digest',
  weekly_tip: 'send-weekly-tip',
  success_story: 'send-success-story',
  monthly_summary: 'send-monthly-summary',
  platform_news: 'send-platform-news',
};

export function EmailAutomations() {
  const [automations, setAutomations] = useState<AutomationConfig[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [newsUpdates, setNewsUpdates] = useState('');
  const [newsVersion, setNewsVersion] = useState('');
  const [newsSegment, setNewsSegment] = useState('all');
  // Test email state
  const [testDialogKey, setTestDialogKey] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: configs }, { data: logData }] = await Promise.all([
        supabase.from('email_automation_config').select('*').order('created_at'),
        supabase.from('email_automation_logs').select('*').order('executed_at', { ascending: false }).limit(50),
      ]);
      setAutomations((configs || []) as unknown as AutomationConfig[]);
      setLogs((logData || []) as unknown as AutomationLog[]);
    } catch {
      toast.error('Erro ao carregar automações');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('email_automation_config')
      .update({ is_enabled: enabled })
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_enabled: enabled } : a));
    toast.success(enabled ? 'Automação ativada' : 'Automação desativada');
  };

  const sendTestEmail = async (key: string) => {
    if (!testEmailAddress) { toast.error('Informe o email'); return; }
    const fnName = EDGE_FUNCTION_MAP[key];
    if (!fnName) return;

    setSendingTest(true);
    try {
      let body: Record<string, unknown> = { test: true, testEmail: testEmailAddress };

      if (key === 'platform_news') {
        body.updates = ['Teste de novidade da plataforma'];
        body.version = 'v-teste';
        body.segment = 'all';
      } else if (key === 'blog_digest') {
        body.force = true;
      }

      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      toast.success(data?.sent ? 'Email de teste enviado!' : 'Falha no envio de teste');
      setTestDialogKey(null);
      setTestEmailAddress('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar teste');
    } finally {
      setSendingTest(false);
    }
  };

  const executeAutomation = async (key: string) => {
    const fnName = EDGE_FUNCTION_MAP[key];
    if (!fnName) return;

    setExecuting(key);
    try {
      let body: Record<string, unknown> = {};

      if (key === 'platform_news') {
        const updates = newsUpdates.split('\n').filter(l => l.trim());
        if (updates.length === 0) { toast.error('Adicione pelo menos uma novidade'); setExecuting(null); return; }
        body = { updates, version: newsVersion || undefined, segment: newsSegment };
      } else if (key === 'blog_digest') {
        body = { force: true };
      }

      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;

      const sent = data?.sent || 0;
      toast.success(`${sent} emails enviados com sucesso!`);

      await supabase.from('email_automation_logs').insert({
        automation_key: key, status: 'success', emails_sent: sent, details: data,
      });

      await supabase.from('email_automation_config').update({
        last_executed_at: new Date().toISOString(),
        last_result: data,
        execution_count: (automations.find(a => a.automation_key === key)?.execution_count || 0) + 1,
      }).eq('automation_key', key);

      setNewsDialogOpen(false);
      setNewsUpdates('');
      setNewsVersion('');
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao executar';
      toast.error(msg);
      await supabase.from('email_automation_logs').insert({
        automation_key: key, status: 'error', emails_sent: 0, error_message: msg,
      });
    } finally {
      setExecuting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Automation Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {automations.map(auto => (
          <Card key={auto.id} className={`relative transition-opacity ${!auto.is_enabled ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${AUTOMATION_COLORS[auto.automation_key] || 'bg-muted'}`}>
                    {AUTOMATION_ICONS[auto.automation_key] || <Zap className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{auto.display_name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-1">
                      {FREQUENCY_LABELS[auto.frequency || 'manual'] || auto.frequency}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={auto.is_enabled}
                  onCheckedChange={(checked) => toggleAutomation(auto.id, checked)}
                />
              </div>
              {auto.description && (
                <CardDescription className="mt-2 text-xs">{auto.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {auto.last_executed_at
                    ? `Último: ${format(new Date(auto.last_executed_at), "dd/MM HH:mm", { locale: ptBR })}`
                    : 'Nunca executado'}
                </div>
                <div>{auto.execution_count} execuções</div>
              </div>

              {auto.last_result && (
                <div className="text-xs p-2 bg-muted rounded mb-3">
                  {(auto.last_result as any)?.sent !== undefined && (
                    <span className="text-foreground font-medium">{(auto.last_result as any).sent} emails enviados</span>
                  )}
                  {(auto.last_result as any)?.error && (
                    <span className="text-destructive">{(auto.last_result as any).error}</span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {/* Test Email Button */}
                <Dialog open={testDialogKey === auto.automation_key} onOpenChange={(open) => { if (!open) setTestDialogKey(null); }}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0"
                      onClick={() => setTestDialogKey(auto.automation_key)}
                    >
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Teste
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enviar Email de Teste</DialogTitle>
                      <DialogDescription>
                        Envie um email de teste de "{auto.display_name}" para verificar o layout e conteúdo.
                      </DialogDescription>
                    </DialogHeader>
                    <div>
                      <Label>Email destinatário</Label>
                      <Input
                        type="email"
                        value={testEmailAddress}
                        onChange={e => setTestEmailAddress(e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTestDialogKey(null)}>Cancelar</Button>
                      <Button
                        onClick={() => sendTestEmail(auto.automation_key)}
                        disabled={sendingTest || !testEmailAddress}
                      >
                        {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Mail className="h-4 w-4 mr-1.5" />}
                        Enviar Teste
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Main Action Button */}
                {auto.automation_key === 'platform_news' ? (
                  <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex-1" disabled={!auto.is_enabled || executing !== null}>
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Enviar Novidades
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enviar Novidades da Plataforma</DialogTitle>
                        <DialogDescription>Liste as novidades (uma por linha). A IA formatará automaticamente.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Novidades (uma por linha)</Label>
                          <Textarea value={newsUpdates} onChange={e => setNewsUpdates(e.target.value)} placeholder={"Novo editor de quizzes\nSuporte a vídeos\nRelatórios avançados"} rows={5} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Versão (opcional)</Label>
                            <Input value={newsVersion} onChange={e => setNewsVersion(e.target.value)} placeholder="v2.5" />
                          </div>
                          <div>
                            <Label>Segmento</Label>
                            <Select value={newsSegment} onValueChange={setNewsSegment}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Ativos (30d)</SelectItem>
                                <SelectItem value="free">Plano Free</SelectItem>
                                <SelectItem value="paid">Planos Pagos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => executeAutomation('platform_news')} disabled={executing === 'platform_news'}>
                          {executing === 'platform_news' ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
                          Enviar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    variant="outline"
                    disabled={!auto.is_enabled || executing !== null}
                    onClick={() => executeAutomation(auto.automation_key)}
                  >
                    {executing === auto.automation_key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Disparar agora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Log */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Execuções
              </CardTitle>
              <CardDescription>Últimas 50 execuções de automações</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLogs(!showLogs)}>
                {showLogs ? 'Ocultar' : 'Mostrar'}
              </Button>
              <Button variant="outline" size="icon" onClick={loadData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {showLogs && (
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Nenhuma execução registrada</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Automação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Emails</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => {
                      const auto = automations.find(a => a.automation_key === log.automation_key);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${AUTOMATION_COLORS[log.automation_key] || 'bg-muted'}`}>
                                {AUTOMATION_ICONS[log.automation_key] || <Zap className="h-3.5 w-3.5" />}
                              </div>
                              <span className="text-sm">{auto?.display_name || log.automation_key}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.status === 'success' ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Sucesso
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 text-xs">
                                <XCircle className="h-3 w-3 mr-1" />Erro
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{log.emails_sent}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(log.executed_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                            {log.error_message || (log.details ? JSON.stringify(log.details).substring(0, 80) : '-')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
