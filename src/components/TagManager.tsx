import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  open: boolean;
  onClose: () => void;
  onTagsUpdate: () => void;
}

export const TagManager = ({ open, onClose, onTagsUpdate }: TagManagerProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const colors = [
    { name: "Azul", value: "#3b82f6" },
    { name: "Verde", value: "#10b981" },
    { name: "Vermelho", value: "#ef4444" },
    { name: "Amarelo", value: "#f59e0b" },
    { name: "Roxo", value: "#8b5cf6" },
    { name: "Rosa", value: "#ec4899" },
    { name: "Laranja", value: "#f97316" },
    { name: "Cinza", value: "#6b7280" },
  ];

  useEffect(() => {
    if (open) {
      loadTags();
    }
  }, [open]);

  const loadTags = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('quiz_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Digite um nome para a tag');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('quiz_tags')
        .insert({
          user_id: user.id,
          name: newTagName.trim(),
          color: newTagColor,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Já existe uma tag com este nome');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Tag criada com sucesso');
      setNewTagName('');
      setNewTagColor('#3b82f6');
      loadTags();
      onTagsUpdate();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Erro ao criar tag');
    }
  };

  const updateTag = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Digite um nome para a tag');
      return;
    }

    try {
      const { error } = await supabase
        .from('quiz_tags')
        .update({
          name: editName.trim(),
          color: editColor,
        })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Já existe uma tag com este nome');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Tag atualizada');
      setEditingId(null);
      loadTags();
      onTagsUpdate();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Erro ao atualizar tag');
    }
  };

  const deleteTag = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tag? Ela será removida de todos os quizzes.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quiz_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Tag excluída');
      loadTags();
      onTagsUpdate();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Erro ao excluir tag');
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tags</DialogTitle>
          <DialogDescription>
            Crie e organize tags para categorizar seus quizzes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Tag */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold">Criar Nova Tag</Label>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
              <div>
                <Label htmlFor="tag-name">Nome da Tag</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Imobiliário, Saúde..."
                  maxLength={30}
                  onKeyDown={(e) => e.key === 'Enter' && createTag()}
                />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  {colors.slice(0, 4).map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTagColor === color.value ? 'border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewTagColor(color.value)}
                      title={color.name}
                      aria-label={`Selecionar cor ${color.name}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={createTag} className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              {colors.slice(4).map((color) => (
                <button
                  key={color.value}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newTagColor === color.value ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setNewTagColor(color.value)}
                  title={color.name}
                  aria-label={`Selecionar cor ${color.name}`}
                />
              ))}
            </div>
          </div>

          {/* Tags List */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Suas Tags ({tags.length})
            </Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : tags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma tag criada ainda</p>
                <p className="text-sm">Crie sua primeira tag acima</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {editingId === tag.id ? (
                      <div className="flex-1 flex items-center gap-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="max-w-xs"
                          onKeyDown={(e) => e.key === 'Enter' && updateTag(tag.id)}
                        />
                        <div className="flex gap-1">
                          {colors.map((color) => (
                            <button
                              key={color.value}
                              className={`w-6 h-6 rounded-full border ${
                                editColor === color.value ? 'border-foreground border-2' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color.value }}
                              onClick={() => setEditColor(color.value)}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => updateTag(tag.id)} aria-label="Salvar alterações">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing} aria-label="Cancelar edição">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                              borderColor: tag.color,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(tag)}
                            aria-label={`Editar tag ${tag.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTag(tag.id)}
                            aria-label={`Excluir tag ${tag.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
