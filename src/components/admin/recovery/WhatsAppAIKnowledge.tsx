import { logger } from '@/lib/logger';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KBArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'funcionalidades', label: 'Funcionalidades' },
  { value: 'integrações', label: 'Integrações' },
  { value: 'planos', label: 'Planos e Preços' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'conta', label: 'Conta e Perfil' },
  { value: 'tutoriais', label: 'Tutoriais' },
];

export function WhatsAppAIKnowledge() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<KBArticle | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState("funcionalidades");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formKeywords, setFormKeywords] = useState("");
  const [formActive, setFormActive] = useState(true);

  useEffect(() => { loadArticles(); }, []);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_ai_knowledge')
        .select('*')
        .order('category')
        .order('title');
      if (error) throw error;
      setArticles((data || []) as KBArticle[]);
    } catch (error) {
      logger.error('Error loading KB:', error);
      toast.error('Erro ao carregar base de conhecimento');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormCategory("funcionalidades");
    setFormTitle("");
    setFormContent("");
    setFormKeywords("");
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (article: KBArticle) => {
    setEditing(article);
    setFormCategory(article.category);
    setFormTitle(article.title);
    setFormContent(article.content);
    setFormKeywords((article.keywords || []).join(', '));
    setFormActive(article.is_active);
    setDialogOpen(true);
  };

  const saveArticle = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }
    setSaving(true);
    const keywords = formKeywords.split(',').map(k => k.trim()).filter(Boolean);
    const payload = {
      category: formCategory,
      title: formTitle.trim(),
      content: formContent.trim(),
      keywords,
      is_active: formActive,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('whatsapp_ai_knowledge')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Artigo atualizado!');
      } else {
        const { error } = await supabase
          .from('whatsapp_ai_knowledge')
          .insert(payload);
        if (error) throw error;
        toast.success('Artigo criado!');
      }
      setDialogOpen(false);
      loadArticles();
    } catch (error) {
      logger.error('Error saving article:', error);
      toast.error('Erro ao salvar artigo');
    } finally {
      setSaving(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return;
    try {
      const { error } = await supabase.from('whatsapp_ai_knowledge').delete().eq('id', id);
      if (error) throw error;
      toast.success('Artigo excluído');
      loadArticles();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const filtered = articles.filter(a => {
    const matchesSearch = !search || 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      (a.keywords || []).some(k => k.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Base de Conhecimento ({articles.length} artigos)
              </CardTitle>
              <CardDescription>
                Artigos que a IA consulta automaticamente para responder com precisão sobre o MasterQuiz.
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Novo Artigo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar artigos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Articles list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum artigo encontrado.</p>
            ) : (
              filtered.map((article) => (
                <div
                  key={article.id}
                  className={`border rounded-lg p-4 space-y-2 ${!article.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                        </Badge>
                        {!article.is_active && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                      </div>
                      <h4 className="font-medium">{article.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.content}</p>
                      {article.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {article.keywords.slice(0, 8).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-normal">{kw}</Badge>
                          ))}
                          {article.keywords.length > 8 && (
                            <Badge variant="outline" className="text-xs font-normal">+{article.keywords.length - 8}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteArticle(article.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Vídeos no Quiz"
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                placeholder="Informações detalhadas que a IA usará para responder..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Seja detalhado e preciso. A IA usará exatamente estas informações.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Keywords (separadas por vírgula)</Label>
              <Input
                value={formKeywords}
                onChange={(e) => setFormKeywords(e.target.value)}
                placeholder="video, vídeo, mp4, youtube, vimeo"
              />
              <p className="text-xs text-muted-foreground">
                Palavras-chave que ativam este artigo quando o usuário mencionar no WhatsApp.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveArticle} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar' : 'Criar Artigo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
