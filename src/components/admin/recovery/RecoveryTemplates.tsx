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
import { Loader2, Plus, Pencil, Trash2, MessageSquare, Eye, Send, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  category: string;
  message_content: string;
  trigger_days: number;
  is_active: boolean;
  priority: number;
  usage_count: number;
  response_rate: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'welcome', label: '👋 Boas-vindas' },
  { value: 'first_quiz', label: '🏆 Primeiro Quiz' },
  { value: 'check_in', label: '🤔 Check-in' },
  { value: 'first_contact', label: 'Primeiro Contato' },
  { value: 'reminder', label: 'Lembrete' },
  { value: 'special_offer', label: 'Oferta Especial' },
  { value: 'final_contact', label: 'Contato Final' },
  { value: 'general', label: 'Geral' },
];

const TEMPLATE_VARIABLES = [
  { var: '{name}', desc: 'Nome completo' },
  { var: '{first_name}', desc: 'Primeiro nome' },
  { var: '{email}', desc: 'Email' },
  { var: '{days_inactive}', desc: 'Dias inativo' },
  { var: '{last_login_date}', desc: 'Data último login' },
  { var: '{plan_name}', desc: 'Nome do plano' },
  { var: '{quiz_count}', desc: 'Quizzes criados' },
  { var: '{lead_count}', desc: 'Leads coletados' },
  { var: '{login_link}', desc: 'Link para login' },
  { var: '{promo_code}', desc: 'Código promocional' },
];

export function RecoveryTemplates() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // Estado para envio de teste
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testingTemplateId, setTestingTemplateId] = useState<string | null>(null);
  const [testingTemplateName, setTestingTemplateName] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    message_content: '',
    trigger_days: 15,
    priority: 0,
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('recovery_templates')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.message_content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('recovery_templates')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template atualizado!');
      } else {
        const { error } = await supabase
          .from('recovery_templates')
          .insert(formData);

        if (error) throw error;
        toast.success('Template criado!');
      }

      setDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message_content: template.message_content,
      trigger_days: template.trigger_days,
      priority: template.priority,
      is_active: template.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('recovery_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template excluído!');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('recovery_templates')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Erro ao atualizar template');
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'general',
      message_content: '',
      trigger_days: 15,
      priority: 0,
      is_active: true,
    });
  };

  const handlePreview = (content: string) => {
    let preview = content
      .replace(/{name}/g, 'João Silva')
      .replace(/{first_name}/g, 'João')
      .replace(/{email}/g, 'joao@email.com')
      .replace(/{days_inactive}/g, '15')
      .replace(/{last_login_date}/g, '10/01/2025')
      .replace(/{plan_name}/g, 'Pro')
      .replace(/{quiz_count}/g, '5')
      .replace(/{lead_count}/g, '127')
      .replace(/{login_link}/g, 'https://masterquiz.com/login')
      .replace(/{promo_code}/g, 'VOLTE20');
    
    setPreviewContent(preview);
    setPreviewOpen(true);
  };

  const insertVariable = (varName: string) => {
    setFormData({
      ...formData,
      message_content: formData.message_content + varName
    });
  };

  // Funções de teste
  const openTestDialog = (templateId: string, templateName: string) => {
    setTestingTemplateId(templateId);
    setTestingTemplateName(templateName);
    setTestPhone("");
    setTestDialogOpen(true);
  };

  const handleSendTest = async () => {
    if (!testingTemplateId || !testPhone) {
      toast.error('Digite um número de telefone');
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-message', {
        body: {
          templateId: testingTemplateId,
          phoneNumber: testPhone,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message || 'Mensagem de teste enviada!');
        setTestDialogOpen(false);
      }
    } catch (error) {
      console.error('Error sending test:', error);
      toast.error('Erro ao enviar teste. Verifique se o WhatsApp está conectado.');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie templates para abordagem de clientes inativos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Configure a mensagem que será enviada aos clientes inativos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Primeiro Contato"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trigger_days">Dias de Inatividade</Label>
                  <Input
                    id="trigger_days"
                    type="number"
                    min={1}
                    value={formData.trigger_days}
                    onChange={(e) => setFormData({ ...formData, trigger_days: parseInt(e.target.value) || 15 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Usar este template após X dias sem login
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Menor número = maior prioridade
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message_content}
                  onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                  placeholder="Digite sua mensagem aqui..."
                  rows={6}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Button
                      key={v.var}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => insertVariable(v.var)}
                    >
                      {v.var}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Clique nas variáveis acima para inseri-las na mensagem
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handlePreview(formData.message_content)}>
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
              <Button onClick={handleSubmit}>
                {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Taxa Resposta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum template encontrado
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{template.trigger_days} dias</TableCell>
                    <TableCell>{template.usage_count}x</TableCell>
                    <TableCell>{template.response_rate.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => handleToggleActive(template.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Enviar teste"
                          onClick={() => openTestDialog(template.id, template.name)}
                        >
                          <Send className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Preview"
                          onClick={() => handlePreview(template.message_content)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview da Mensagem</DialogTitle>
            <DialogDescription>
              Como a mensagem aparecerá no WhatsApp (com dados de exemplo)
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900">
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {previewContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Message Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Enviar Mensagem de Teste
            </DialogTitle>
            <DialogDescription>
              Template: <span className="font-medium">{testingTemplateName}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Número de WhatsApp</Label>
              <Input
                id="test-phone"
                type="tel"
                placeholder="5511999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Digite o número completo com código do país (ex: 55 para Brasil)
              </p>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                ⚠️ Esta é uma mensagem de teste. As variáveis serão substituídas por dados fictícios 
                e a mensagem terá um prefixo <strong>[MENSAGEM DE TESTE]</strong>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendTest} disabled={sendingTest || !testPhone}>
              {sendingTest ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Enviar Teste</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Variáveis Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            {TEMPLATE_VARIABLES.map((v) => (
              <div key={v.var} className="flex items-center gap-2 text-sm">
                <code className="px-2 py-1 bg-muted rounded text-xs">{v.var}</code>
                <span className="text-muted-foreground">{v.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
