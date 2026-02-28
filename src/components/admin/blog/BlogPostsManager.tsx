import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Search, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string[] | null;
  categories: string[] | null;
  tags: string[] | null;
  featured_image_url: string | null;
  author_name: string | null;
  reading_time_min: number | null;
  published_at: string | null;
  created_at: string;
  views_count: number | null;
  is_ai_generated: boolean | null;
  faq_schema: any;
  internal_links: any;
}

const emptyPost: Partial<BlogPost> = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  status: "draft",
  meta_title: "",
  meta_description: "",
  seo_keywords: [],
  categories: [],
  tags: [],
  featured_image_url: "",
  author_name: "MasterQuiz",
  reading_time_min: 5,
  faq_schema: [],
  internal_links: [],
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

export function BlogPostsManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editPost, setEditPost] = useState<Partial<BlogPost> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const slug = post.slug || post.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "";
      const payload = {
        title: post.title!,
        slug,
        content: post.content || "",
        excerpt: post.excerpt || null,
        status: post.status || "draft",
        meta_title: post.meta_title || null,
        meta_description: post.meta_description || null,
        seo_keywords: post.seo_keywords || [],
        categories: post.categories || [],
        tags: post.tags || [],
        featured_image_url: post.featured_image_url || null,
        author_name: post.author_name || "MasterQuiz",
        reading_time_min: post.reading_time_min || 5,
        faq_schema: post.faq_schema || [],
        internal_links: post.internal_links || [],
        published_at: post.status === "published" ? (post.published_at || new Date().toISOString()) : post.published_at,
      };

      if (post.id) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setEditPost(null);
      setIsCreating(false);
      toast.success("Post salvo com sucesso!");
    },
    onError: (err: any) => {
      toast.error(`Erro ao salvar: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      setDeleteId(null);
      toast.success("Post excluído!");
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir: ${err.message}`);
    },
  });

  const filtered = posts?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const openEditor = async (post?: BlogPost) => {
    if (post) {
      // Fetch fresh full data to ensure content is complete
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", post.id)
          .single();
        if (error) throw error;
        setEditPost({ ...data } as BlogPost);
      } catch {
        // Fallback to cached data
        setEditPost({ ...post });
      }
      setIsCreating(false);
    } else {
      setEditPost({ ...emptyPost });
      setIsCreating(true);
    }
  };

  const updateField = (field: keyof BlogPost, value: any) => {
    setEditPost((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => openEditor()} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Post
        </Button>
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.views_count || 0}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {post.is_ai_generated ? "🤖 IA" : "✍️ Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(post.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {post.status === "published" && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEditor(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(post.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum post encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      {editPost && (
        <Dialog open={!!editPost} onOpenChange={() => { setEditPost(null); setIsCreating(false); }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? "Novo Post" : "Editar Post"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 md:col-span-2">
                <Label>Título</Label>
                <Input
                  value={editPost.title || ""}
                  onChange={(e) => {
                    updateField("title", e.target.value);
                    if (isCreating) {
                      updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }
                  }}
                  placeholder="Título do artigo"
                />
              </div>

              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editPost.slug || ""} onChange={(e) => updateField("slug", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editPost.status || "draft"} onValueChange={(v) => updateField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meta Title (SEO)</Label>
                <Input
                  value={editPost.meta_title || ""}
                  onChange={(e) => updateField("meta_title", e.target.value)}
                  maxLength={60}
                  placeholder="Até 60 caracteres"
                />
                <span className="text-xs text-muted-foreground">{(editPost.meta_title || "").length}/60</span>
              </div>

              <div className="space-y-2">
                <Label>Autor</Label>
                <Input value={editPost.author_name || ""} onChange={(e) => updateField("author_name", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Meta Description (SEO)</Label>
                <Textarea
                  value={editPost.meta_description || ""}
                  onChange={(e) => updateField("meta_description", e.target.value)}
                  maxLength={160}
                  placeholder="Até 160 caracteres"
                  rows={2}
                />
                <span className="text-xs text-muted-foreground">{(editPost.meta_description || "").length}/160</span>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Excerpt</Label>
                <Textarea
                  value={editPost.excerpt || ""}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  maxLength={160}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>URL da Imagem Destaque</Label>
                <Input
                  value={editPost.featured_image_url || ""}
                  onChange={(e) => updateField("featured_image_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Tempo de Leitura (min)</Label>
                <Input
                  type="number"
                  value={editPost.reading_time_min || 5}
                  onChange={(e) => updateField("reading_time_min", parseInt(e.target.value) || 5)}
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords SEO (separadas por vírgula)</Label>
                <Input
                  value={(editPost.seo_keywords || []).join(", ")}
                  onChange={(e) => updateField("seo_keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>

              <div className="space-y-2">
                <Label>Categorias (separadas por vírgula)</Label>
                <Input
                  value={(editPost.categories || []).join(", ")}
                  onChange={(e) => updateField("categories", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={(editPost.tags || []).join(", ")}
                  onChange={(e) => updateField("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Conteúdo</Label>
                <div className="min-h-[300px] border rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={editPost.content || ""}
                    onChange={(val) => updateField("content", val)}
                    modules={quillModules}
                    className="h-[260px]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => { setEditPost(null); setIsCreating(false); }}>
                Cancelar
              </Button>
              <Button
                onClick={() => saveMutation.mutate(editPost)}
                disabled={!editPost.title || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir post?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
