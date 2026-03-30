import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Mail, Eye, Code, Monitor, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  subject_b?: string | null;
  category: string;
  html_content: string;
  trigger_days: number;
  is_active: boolean;
  priority: number;
  usage_count: number;
  created_at: string;
}

type SortField = 'name' | 'category' | 'trigger_days' | 'usage_count' | 'is_active' | 'priority';
type SortDirection = 'asc' | 'desc';

const CATEGORIES = [
  { value: 'welcome', label: '👋 Boas-vindas' },
  { value: 'check_in', label: '🤔 Check-in' },
  { value: 'tutorial', label: '📖 Tutorial' },
  { value: 'recovery', label: '🔄 Recuperação' },
  { value: 'reminder', label: '⏰ Lembrete' },
  { value: 'integration_guide', label: '🔗 Guia de Integração' },
  { value: 'plan_compare', label: '📊 Comparativo de Planos' },
  { value: 'special_offer', label: '🎁 Oferta Especial' },
  { value: 're_engagement', label: '💬 Reengajamento' },
  { value: 'reactivation', label: '🚀 Reativação' },
  { value: 'milestone', label: '🏆 Marco / Milestone' },
  { value: 'survey', label: '📋 Pesquisa NPS' },
  { value: 'webinar', label: '🎥 Webinar' },
];

const VARIABLES = [
  { var: '{name}', desc: 'Nome completo' },
  { var: '{first_name}', desc: 'Primeiro nome' },
  { var: '{days_inactive}', desc: 'Dias inativo' },
  { var: '{quiz_count}', desc: 'Quizzes criados' },
  { var: '{lead_count}', desc: 'Leads' },
  { var: '{plan_name}', desc: 'Plano' },
  { var: '{login_link}', desc: 'Link login' },
  { var: '{company_name}', desc: 'Nome empresa' },
];

const defaultForm = { name: '', subject: '', subject_b: '', category: 'recovery', html_content: '', trigger_days: 7, is_active: true, priority: 0 };

export function EmailRecoveryTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [editorTab, setEditorTab] = useState<string>('visual');
  const [form, setForm] = useState(defaultForm);
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => { load(); }, []);

  const syncFromVisual = () => {
    if (iframeRef.current?.contentDocument?.body) {
      const html = iframeRef.current.contentDocument.documentElement.outerHTML;
      setForm(prev => ({ ...prev, html_content: html }));
    }
  };

  const load = async () => {
    try {
      const { data, error } = await supabase.from('email_recovery_templates').select('*').order('priority', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch { toast.error('Erro ao carregar templates'); }
    finally { setLoading(false); }
  };

  const sortedTemplates = useMemo(() => {
    const sorted = [...templates].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt-BR');
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'trigger_days':
          comparison = a.trigger_days - b.trigger_days;
          break;
        case 'usage_count':
          comparison = a.usage_count - b.usage_count;
          break;
        case 'is_active':
          comparison = (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1;
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [templates, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const save = async () => {
    if (editorTab === 'visual') syncFromVisual();

    if (!form.name || !form.subject || !form.html_content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      const payload = {
        name: form.name,
        subject: form.subject,
        subject_b: form.subject_b || null,
        category: form.category,
        html_content: form.html_content,
        trigger_days: form.trigger_days,
        is_active: form.is_active,
        priority: form.priority,
      };

      if (editing) {
        const { error } = await supabase.from('email_recovery_templates').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Template atualizado');
      } else {
        const { error } = await supabase.from('email_recovery_templates').insert(payload);
        if (error) throw error;
        toast.success('Template criado');
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(defaultForm);
      load();
    } catch { toast.error('Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    const { error } = await supabase.from('email_recovery_templates').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Template excluído');
    load();
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      subject: t.subject,
      subject_b: t.subject_b || '',
      category: t.category,
      html_content: t.html_content,
      trigger_days: t.trigger_days,
      is_active: t.is_active,
      priority: t.priority,
    });
    setEditorTab('visual');
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(defaultForm);
    setEditorTab('visual');
    setDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Email</h3>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditing(null); setForm(defaultForm); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar' : 'Novo'} Template de Email</DialogTitle>
              <DialogDescription>Configure o template de email para recuperação</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Recuperação 7 dias" />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Assunto do Email</Label>
                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Ex: {first_name}, sentimos sua falta!" />
              </div>
              <div>
                <Label>Assunto B — Teste A/B <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input
                  value={form.subject_b}
                  onChange={e => setForm({ ...form, subject_b: e.target.value })}
                  placeholder="Deixe vazio para não usar teste A/B"
                />
                <p className="text-xs text-muted-foreground mt-1">Se preenchido, 50% dos envios usarão este assunto alternativo para comparação de performance.</p>
              </div>

              {/* Dual Editor: Visual + HTML */}
              <div>
                <Label className="mb-2 block">Conteúdo do Email</Label>
                <Tabs value={editorTab} onValueChange={(v) => {
                  if (editorTab === 'visual' && v === 'html') syncFromVisual();
                  setEditorTab(v);
                }}>
                  <TabsList className="mb-2">
                    <TabsTrigger value="visual" className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5" /> Visual
                    </TabsTrigger>
                    <TabsTrigger value="html" className="flex items-center gap-1.5">
                      <Code className="h-3.5 w-3.5" /> HTML
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="visual" className="mt-0">
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <iframe
                        ref={iframeRef}
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                          <head><meta charset="utf-8"><style>body{margin:8px;font-family:Arial,sans-serif;}</style></head>
                          <body contenteditable="true">${form.html_content || '<p>Comece a editar aqui...</p>'}</body>
                          </html>
                        `}
                        className="w-full min-h-[400px] border-0"
                        title="Visual Editor"
                        sandbox="allow-same-origin"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique no conteúdo para editar diretamente. Use a aba HTML para edições avançadas.
                    </p>
                  </TabsContent>

                  <TabsContent value="html" className="mt-0">
                    <Textarea
                      value={form.html_content}
                      onChange={e => setForm({ ...form, html_content: e.target.value })}
                      rows={16}
                      className="font-mono text-xs"
                      placeholder="<html>...</html>"
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Dias para trigger</Label>
                  <Input type="number" value={form.trigger_days} onChange={e => setForm({ ...form, trigger_days: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Input type="number" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
                </div>
                <div className="flex items-end gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                  <Label>Ativo</Label>
                </div>
              </div>
              <Card className="bg-muted/30">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs">Variáveis disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="flex flex-wrap gap-1">
                    {VARIABLES.map(v => (
                      <Badge key={v.var} variant="outline" className="text-xs cursor-pointer" onClick={() => setForm({ ...form, html_content: form.html_content + v.var })}>
                        {v.var} = {v.desc}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={save}>{editing ? 'Atualizar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>Preview do Email</DialogTitle></DialogHeader>
          <div className="border rounded-lg overflow-auto max-h-[60vh]">
            <iframe srcDoc={previewHtml} className="w-full min-h-[400px] border-0" title="Preview" />
          </div>
        </DialogContent>
      </Dialog>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum template de email criado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <span className="flex items-center">Nome <SortIcon field="name" /></span>
                </TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('category')}>
                  <span className="flex items-center">Categoria <SortIcon field="category" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('trigger_days')}>
                  <span className="flex items-center">Trigger <SortIcon field="trigger_days" /></span>
                </TableHead>
                <TableHead>A/B</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('usage_count')}>
                  <span className="flex items-center">Usos <SortIcon field="usage_count" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('is_active')}>
                  <span className="flex items-center">Status <SortIcon field="is_active" /></span>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTemplates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.subject}</TableCell>
                  <TableCell><Badge variant="outline">{CATEGORIES.find(c => c.value === t.category)?.label || t.category}</Badge></TableCell>
                  <TableCell>{t.trigger_days}d</TableCell>
                  <TableCell>{t.subject_b ? <Badge variant="secondary" className="text-xs">A/B</Badge> : '—'}</TableCell>
                  <TableCell>{t.usage_count}</TableCell>
                  <TableCell><Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setPreviewHtml(t.html_content); setPreviewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
