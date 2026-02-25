import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical, Palette, Code, HardDrive, Server } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAllQuizTemplates } from '@/hooks/useQuizTemplates';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  icon: string;
  is_premium: boolean;
  display_order: number;
  preview_title: string;
  preview_description: string;
  preview_question_count: number;
  preview_template: string;
  full_config: string;
}

const emptyFormData: TemplateFormData = {
  name: '',
  description: '',
  category: 'lead_qualification',
  icon: '📝',
  is_premium: false,
  display_order: 0,
  preview_title: '',
  preview_description: '',
  preview_question_count: 5,
  preview_template: 'moderno',
  full_config: '{}'
};

export default function TemplateManagement() {
  const { templates, isLoading, refetch } = useAllQuizTemplates();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(emptyFormData);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // ✅ CORREÇÃO: Invalidar cache de templates após alterações
  const invalidateTemplateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['quiz-templates'] });
    queryClient.invalidateQueries({ queryKey: ['quiz-templates-count'] });
    queryClient.invalidateQueries({ queryKey: ['all-quiz-templates'] });
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      icon: template.icon || '📝',
      is_premium: template.is_premium,
      display_order: template.display_order,
      preview_title: template.preview_config?.title || '',
      preview_description: template.preview_config?.description || '',
      preview_question_count: template.preview_config?.questionCount || 5,
      preview_template: template.preview_config?.template || 'moderno',
      full_config: JSON.stringify(template.full_config || {}, null, 2)
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    let parsedConfig;
    try {
      parsedConfig = JSON.parse(formData.full_config);
    } catch (error) {
      toast.error('Configuração JSON inválida');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        icon: formData.icon,
        is_premium: formData.is_premium,
        display_order: formData.display_order,
        preview_config: {
          title: formData.preview_title,
          description: formData.preview_description,
          questionCount: formData.preview_question_count,
          template: formData.preview_template
        },
        full_config: parsedConfig
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('quiz_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('quiz_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Template criado com sucesso!');
      }

      setDialogOpen(false);
      refetch();
      invalidateTemplateCache(); // ✅ Invalidar cache após salvar
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('quiz_templates')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentState ? 'Template ocultado' : 'Template ativado');
      refetch();
      invalidateTemplateCache(); // ✅ Invalidar cache após toggle
    } catch (error: any) {
      console.error('Error toggling template:', error);
      toast.error(error.message || 'Erro ao atualizar template');
    }
  };

  const confirmDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('quiz_templates')
        .delete()
        .eq('id', templateToDelete);

      if (error) throw error;
      toast.success('Template deletado com sucesso!');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      refetch();
      invalidateTemplateCache(); // ✅ Invalidar cache após deletar
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Erro ao deletar template');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Templates de Quiz</CardTitle>
          <CardDescription>Carregando templates...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Templates de Quiz</CardTitle>
              <CardDescription>
                Crie, edite ou oculte templates de quiz disponíveis para os usuários
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDocsDialogOpen(true)}>
                📖 Documentação
              </Button>
              <Button variant="outline" onClick={() => navigate('/masteradm/template-editor/new')}>
                <Palette className="mr-2 h-4 w-4" />
                Editor Visual
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo (JSON)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Perguntas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum template cadastrado. Clique em "Novo Template" para criar.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => {
                  const isHardcoded = template.source === 'hardcoded';
                  const questionCount = isHardcoded
                    ? (template as any).question_count || 0
                    : (template.full_config as any)?.questions?.length || '—';

                  return (
                    <TableRow key={template.id} className={isHardcoded ? 'bg-muted/30' : ''}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{template.icon}</span>
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {isHardcoded ? (
                          <Badge variant="secondary" className="gap-1">
                            <HardDrive className="h-3 w-3" />
                            Código
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Server className="h-3 w-3" />
                            Banco
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Oculto</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {template.is_premium ? (
                          <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-500">
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline">Gratuito</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{questionCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isHardcoded && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/masteradm/template-editor/${template.id}`)}
                                  >
                                    <Palette className="h-4 w-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editor Visual</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleActive(template.id, template.is_active)}
                                  >
                                    {template.is_active ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{template.is_active ? 'Ocultar' : 'Ativar'}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(template)}
                                  >
                                    <Code className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar JSON</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => confirmDelete(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {isHardcoded && (
                            <span className="text-xs text-muted-foreground px-2">Somente código</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Qualificação de Lead"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📝"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do template"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                    <SelectItem value="lead_qualification">Qualificação de Lead</SelectItem>
                    <SelectItem value="product_discovery">Descoberta de Produto</SelectItem>
                    <SelectItem value="customer_satisfaction">Satisfação do Cliente</SelectItem>
                    <SelectItem value="engagement">Engajamento</SelectItem>
                    <SelectItem value="conversion">Conversão / VSL</SelectItem>
                    <SelectItem value="paid_traffic">Tráfego Pago</SelectItem>
                    <SelectItem value="offer_validation">Validação de Oferta</SelectItem>
                    <SelectItem value="educational">Educacional</SelectItem>
                    <SelectItem value="health_wellness">Saúde & Bem-estar</SelectItem>
                    <SelectItem value="income_opportunity">Renda Extra</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_premium" className="flex items-center gap-2">
                  É Premium?
                  <Switch
                    id="is_premium"
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                  />
                </Label>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Preview Config</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preview_title">Título do Preview</Label>
                  <Input
                    id="preview_title"
                    value={formData.preview_title}
                    onChange={(e) => setFormData({ ...formData, preview_title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preview_template">Template Visual</Label>
                  <Select
                    value={formData.preview_template}
                    onValueChange={(value) => setFormData({ ...formData, preview_template: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderno">Moderno</SelectItem>
                      <SelectItem value="colorido">Colorido</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="criativo">Criativo</SelectItem>
                      <SelectItem value="elegante">Elegante</SelectItem>
                      <SelectItem value="vibrante">Vibrante</SelectItem>
                      <SelectItem value="minimalista">Minimalista</SelectItem>
                      <SelectItem value="escuro">Escuro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preview_description">Descrição do Preview</Label>
                  <Input
                    id="preview_description"
                    value={formData.preview_description}
                    onChange={(e) => setFormData({ ...formData, preview_description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preview_question_count">Número de Perguntas</Label>
                  <Input
                    id="preview_question_count"
                    type="number"
                    value={formData.preview_question_count}
                    onChange={(e) => setFormData({ ...formData, preview_question_count: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_config">Configuração Completa (JSON)</Label>
              <Textarea
                id="full_config"
                value={formData.full_config}
                onChange={(e) => setFormData({ ...formData, full_config: e.target.value })}
                placeholder='{"title": "", "questions": [], ...}'
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Cole aqui a estrutura completa do template (title, description, questions, formConfig, results)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Documentação JSON */}
      <Dialog open={docsDialogOpen} onOpenChange={setDocsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📖 Documentação: Estrutura do Template JSON</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-2">full_config (Obrigatório)</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "title": "Título do Quiz",
  "description": "Descrição do quiz",
  "questionCount": 5,
  "template": "moderno",
  "questions": [...],
  "formConfig": {...},
  "results": [...]
}`}
              </pre>
              <p className="mt-2 text-muted-foreground">Templates disponíveis: moderno, colorido, profissional, criativo, elegante, vibrante, minimalista, escuro</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">questions (Array de perguntas)</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`[
  {
    "question_text": "Qual é sua pergunta?",
    "answer_format": "single_choice",
    "options": ["Opção A", "Opção B", "Opção C"],
    "blocks": [
      {
        "type": "text",
        "content": "Texto explicativo",
        "order": 0
      },
      {
        "type": "image",
        "url": "https://...",
        "size": "medium",
        "order": 1
      },
      {
        "type": "question",
        "options": [...],
        "order": 2
      }
    ]
  }
]`}
              </pre>
              <p className="mt-2 text-muted-foreground">answer_format: single_choice, multiple_choice, yes_no, short_text</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Tipos de Blocos Disponíveis</h3>
              <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded-lg">
                <div><strong>question:</strong> Pergunta com opções</div>
                <div><strong>text:</strong> Bloco de texto rico</div>
                <div><strong>image:</strong> Imagem (small, medium, large, full)</div>
                <div><strong>video:</strong> Vídeo (url ou upload)</div>
                <div><strong>audio:</strong> Áudio (url ou upload)</div>
                <div><strong>button:</strong> Botão com link</div>
                <div><strong>separator:</strong> Linha divisória</div>
                <div><strong>gallery:</strong> Galeria de imagens</div>
                <div><strong>embed:</strong> Conteúdo incorporado</div>
                <div><strong>price:</strong> Card de preço</div>
                <div><strong>metrics:</strong> Métricas/números</div>
                <div><strong>loading:</strong> Animação de loading</div>
                <div><strong>progress:</strong> Indicador de progresso</div>
                <div><strong>countdown:</strong> Timer regressivo</div>
                <div><strong>testimonial:</strong> Depoimento</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">formConfig</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "collect_name": true,
  "collect_email": true,
  "collect_whatsapp": false,
  "collection_timing": "after",
  "custom_fields": []
}`}
              </pre>
              <p className="mt-2 text-muted-foreground">collection_timing: "before", "after", "none"</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">results (Array de resultados)</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`[
  {
    "result_text": "Você é um Lead Quente!",
    "button_text": "Falar com especialista",
    "redirect_url": "https://wa.me/...",
    "image_url": "https://...",
    "condition_type": "always",
    "min_score": 0,
    "max_score": 100
  }
]`}
              </pre>
              <p className="mt-2 text-muted-foreground">condition_type: "always", "score_range"</p>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💡 Dica</h3>
              <p className="text-muted-foreground">
                Use o template "Qualificação de Lead (Exemplo Completo)" como referência. 
                Ele contém exemplos de todos os tipos de blocos e configurações disponíveis.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
