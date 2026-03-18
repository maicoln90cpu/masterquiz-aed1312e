import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Mail, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  html_content: string;
  trigger_days: number;
  is_active: boolean;
  priority: number;
  usage_count: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'welcome', label: '👋 Boas-vindas' },
  { value: 'check_in', label: '🤔 Check-in' },
  { value: 'recovery', label: '🔄 Recuperação' },
  { value: 'reminder', label: '⏰ Lembrete' },
  { value: 'special_offer', label: '🎁 Oferta Especial' },
  { value: 'reactivation', label: '🚀 Reativação' },
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

export function EmailRecoveryTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', category: 'recovery', html_content: '', trigger_days: 7, is_active: true, priority: 0 });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data, error } = await supabase.from('email_recovery_templates').select('*').order('priority', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch { toast.error('Erro ao carregar templates'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.name || !form.subject || !form.html_content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      if (editing) {
        const { error } = await supabase.from('email_recovery_templates').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Template atualizado');
      } else {
        const { error } = await supabase.from('email_recovery_templates').insert(form);
        if (error) throw error;
        toast.success('Template criado');
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: '', subject: '', category: 'recovery', html_content: '', trigger_days: 7, is_active: true, priority: 0 });
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
    setForm({ name: t.name, subject: t.subject, category: t.category, html_content: t.html_content, trigger_days: t.trigger_days, is_active: t.is_active, priority: t.priority });
    setDialogOpen(true);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates de Email</h3>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) { setEditing(null); setForm({ name: '', subject: '', category: 'recovery', html_content: '', trigger_days: 7, is_active: true, priority: 0 }); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Label>Conteúdo HTML</Label>
                <Textarea value={form.html_content} onChange={e => setForm({ ...form, html_content: e.target.value })} rows={12} className="font-mono text-xs" placeholder="<html>...</html>" />
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
          <div className="border rounded-lg overflow-auto max-h-[60vh]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
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
                <TableHead>Nome</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.subject}</TableCell>
                  <TableCell><Badge variant="outline">{CATEGORIES.find(c => c.value === t.category)?.label || t.category}</Badge></TableCell>
                  <TableCell>{t.trigger_days}d</TableCell>
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
