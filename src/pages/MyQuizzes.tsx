import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Tag, FileQuestion, Loader2, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { supabase } from "@/integrations/supabase/client";
import { useRecentQuizzes, useDeleteQuiz, useDuplicateQuiz } from "@/hooks/useDashboardData";
import { useTagsData } from "@/hooks/useTagsData";
import { useTestLead } from "@/hooks/useTestLead";
import { duplicateQuizNameSchema } from "@/lib/formSchemas";
import { logQuizAction } from "@/lib/auditLogger";
import { QuizCard } from "@/components/quiz/QuizCard";
import { FeatureTooltip } from "@/components/onboarding/FeatureTooltip";
import type { Quiz, Profile } from "@/types/quiz";

// Lazy load dialogs
const LazyTagManager = lazy(() => import("@/components/TagManager").then(m => ({ default: m.TagManager })));
const EmbedDialog = lazy(() => import("@/components/quiz/EmbedDialog").then(m => ({ default: m.EmbedDialog })));
const PreviewLinkDialog = lazy(() => import("@/components/quiz/PreviewLinkDialog").then(m => ({ default: m.PreviewLinkDialog })));

const MyQuizzes = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Data hooks - force refetch on mount
  const { data: quizzes = [], isLoading } = useRecentQuizzes();
  const queryClient = useQueryClient();
  const { data: allTags = [] } = useTagsData();
  const deleteQuizMutation = useDeleteQuiz();
  const duplicateQuizMutation = useDuplicateQuiz();
  const { generateTestLead, isGenerating: isGeneratingTestLead } = useTestLead();

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<Pick<Profile, 'company_slug'> | null>(null);
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [quizToDuplicate, setQuizToDuplicate] = useState<Quiz | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedQuizSlug, setSelectedQuizSlug] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  
  // Slug editing states
  const [slugDialogOpen, setSlugDialogOpen] = useState(false);
  const [quizToEditSlug, setQuizToEditSlug] = useState<{ id: string; currentSlug: string } | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [slugSaving, setSlugSaving] = useState(false);

  // Force refetch quizzes on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
  }, [queryClient]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_slug')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserProfile(profile);
    };
    loadProfile();
  }, [navigate]);

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = !searchQuery || 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = selectedTags.length === 0 || 
      quiz.quiz_tag_relations?.some((rel) => 
        selectedTags.includes(rel.quiz_tags?.id || '')
      );

    return matchesSearch && matchesTags;
  });

  // Handlers
  const handleDelete = (id: string) => {
    setQuizToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    
    try {
      logQuizAction("quiz:deleted", quizToDelete, {});
      await deleteQuizMutation.mutateAsync(quizToDelete);
      setDeleteDialogOpen(false);
      setQuizToDelete(null);
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  const handleDuplicate = (quiz: Quiz) => {
    setQuizToDuplicate(quiz);
    setDuplicateName(`${t('dashboard.copyOf')} ${quiz.title}`);
    setDuplicateDialogOpen(true);
  };

  const confirmDuplicate = async () => {
    if (!quizToDuplicate || !duplicateName.trim()) {
      toast.error(t('dashboard.enterQuizName'));
      return;
    }

    try {
      duplicateQuizNameSchema.parse({ name: duplicateName.trim() });
      
      await duplicateQuizMutation.mutateAsync({ 
        quizId: quizToDuplicate.id, 
        newName: duplicateName.trim() 
      });
      
      setDuplicateDialogOpen(false);
      setQuizToDuplicate(null);
      setDuplicateName('');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('dashboard.errorDuplicating'));
      }
    }
  };

  const handleCopyLink = (slug: string) => {
    const link = userProfile?.company_slug 
      ? `${window.location.origin}/${userProfile.company_slug}/${slug}`
      : `${window.location.origin}/quiz/${slug}`;
    
    navigator.clipboard.writeText(link);
    toast.success(t('dashboard.linkCopied'));
  };

  const handleEmbed = (slug: string) => {
    setSelectedQuizSlug(slug);
    setEmbedDialogOpen(true);
  };

  const handlePreview = (id: string) => {
    const quiz = quizzes.find(q => q.id === id);
    if (quiz?.status === 'active' && quiz.slug) {
      const publicUrl = userProfile?.company_slug
        ? `${window.location.origin}/${userProfile.company_slug}/${quiz.slug}`
        : `${window.location.origin}/quiz/${quiz.slug}`;
      window.open(publicUrl, '_blank');
    } else {
      setSelectedQuizId(id);
      setPreviewDialogOpen(true);
    }
  };

  // Slug editing
  const sanitizeSlugInput = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-{2,}/g, '-');

  const normalizeSlug = (value: string) =>
    sanitizeSlugInput(value).replace(/^-+|-+$/g, '');

  const checkSlugAvailability = useDebouncedCallback(async (slug: string, quizId: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus('invalid');
      return;
    }

    setSlugStatus('checking');
    const { data } = await supabase
      .from('quizzes')
      .select('id')
      .eq('slug', slug)
      .neq('id', quizId)
      .maybeSingle();

    setSlugStatus(data ? 'taken' : 'available');
  }, 400);

  const handleEditSlug = (quizId: string, currentSlug: string) => {
    if (!userProfile?.company_slug) {
      toast.error(t('dashboard.slugRequiresCompanySlug', 'Você precisa configurar o slug da empresa em Configurações antes de editar o slug do quiz.'));
      return;
    }

    setQuizToEditSlug({ id: quizId, currentSlug });
    setNewSlug(currentSlug);
    setSlugStatus('idle');
    setSlugDialogOpen(true);
  };

  const handleSlugInputChange = (value: string) => {
    const sanitizedInput = sanitizeSlugInput(value);
    const normalizedSlug = normalizeSlug(sanitizedInput);

    setNewSlug(sanitizedInput);

    if (!quizToEditSlug) {
      setSlugStatus('idle');
      return;
    }

    if (!normalizedSlug || normalizedSlug.length < 3) {
      setSlugStatus('invalid');
      return;
    }

    if (normalizedSlug === quizToEditSlug.currentSlug) {
      setSlugStatus('idle');
      return;
    }

    checkSlugAvailability(normalizedSlug, quizToEditSlug.id);
  };

  const confirmSlugEdit = async () => {
    if (!quizToEditSlug || slugStatus !== 'available') return;

    const normalizedSlug = normalizeSlug(newSlug);
    if (!normalizedSlug || normalizedSlug.length < 3) {
      setSlugStatus('invalid');
      return;
    }

    setSlugSaving(true);
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ slug: normalizedSlug })
        .eq('id', quizToEditSlug.id);

      if (error) {
        if (error.code === '23505') {
          toast.error(t('dashboard.slugAlreadyTaken', 'Este slug já está em uso.'));
        } else {
          toast.error(error.message);
        }
        return;
      }

      setNewSlug(normalizedSlug);
      queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
      toast.success(t('dashboard.slugUpdated', 'Slug atualizado com sucesso!'));
      setSlugDialogOpen(false);
    } catch (err) {
      toast.error(t('dashboard.errorUpdatingSlug', 'Erro ao atualizar slug.'));
    } finally {
      setSlugSaving(false);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileQuestion className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('nav.myQuizzes')} 
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredQuizzes.length})
              </span>
            </h1>
          </div>
          <Button 
            onClick={() => navigate('/create-quiz')}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.createQuiz')}
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dashboard.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setTagManagerOpen(true)}
            className="gap-2"
          >
            <Tag className="h-4 w-4" />
            {t('dashboard.manageTags')}
          </Button>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.map(tag => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  style={isSelected ? {
                    backgroundColor: tag.color,
                    borderColor: tag.color,
                  } : {
                    color: tag.color,
                    borderColor: tag.color,
                  }}
                  onClick={() => {
                    setSelectedTags(prev =>
                      isSelected
                        ? prev.filter(id => id !== tag.id)
                        : [...prev, tag.id]
                    );
                  }}
                >
                  {tag.name}
                </Badge>
              );
            })}
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="h-6 text-xs"
              >
                {t('dashboard.clearFilters')}
              </Button>
            )}
          </div>
        )}

        {/* Quiz List */}
        {filteredQuizzes.length === 0 && quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-xl font-semibold mb-2">{t('dashboard.noQuizzes')}</h4>
                <p className="text-muted-foreground mb-4">{t('dashboard.startCreating')}</p>
                <FeatureTooltip
                  id="first-quiz-creation"
                  title={t('onboarding.tooltip.createQuiz.title')}
                  description={t('onboarding.tooltip.createQuiz.desc')}
                  position="top"
                  delay={1000}
                >
                  <Button onClick={() => navigate("/create-quiz")} className="animate-pulse-glow">
                    {t('dashboard.createFirstQuiz')}
                  </Button>
                </FeatureTooltip>
              </div>
            </CardContent>
          </Card>
        ) : filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-xl font-semibold mb-2">{t('dashboard.noQuizzesFound')}</h4>
                <p className="text-muted-foreground mb-4">
                  {t('dashboard.tryAdjustingFilters')}
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setSelectedTags([]);
                }}>
                  {t('dashboard.clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TooltipProvider>
            <AnimatePresence mode="popLayout">
              <motion.div 
                className="grid gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {filteredQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <QuizCard
                      quiz={quiz}
                      userProfile={userProfile}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onCopyLink={handleCopyLink}
                      onEmbed={handleEmbed}
                      onPreview={handlePreview}
                      onEditSlug={handleEditSlug}
                      onGenerateTestLead={generateTestLead}
                      isGeneratingTestLead={isGeneratingTestLead}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </TooltipProvider>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard.deleteWarning')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('dashboard.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteQuizMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('dashboard.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Duplicate Dialog */}
        <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.duplicateQuiz')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.duplicateDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="duplicate-name">{t('dashboard.quizName')}</Label>
              <Input
                id="duplicate-name"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                {t('dashboard.cancel')}
              </Button>
              <Button onClick={confirmDuplicate} disabled={duplicateQuizMutation.isPending}>
                {duplicateQuizMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('dashboard.duplicate')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Slug Edit Dialog */}
        <Dialog open={slugDialogOpen} onOpenChange={setSlugDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dashboard.editSlug', 'Editar Slug do Quiz')}</DialogTitle>
              <DialogDescription>
                {t('dashboard.editSlugDescription', 'O slug é a parte final da URL do seu quiz. Use apenas letras minúsculas, números e hífens.')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <Label htmlFor="slug-input">Slug</Label>
              <div className="relative">
                <Input
                  id="slug-input"
                  value={newSlug}
                  onChange={(e) => handleSlugInputChange(e.target.value)}
                  className="pr-10"
                  placeholder="meu-quiz"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {slugStatus === 'available' && <Check className="h-4 w-4 text-primary" />}
                  {slugStatus === 'taken' && <X className="h-4 w-4 text-destructive" />}
                  {slugStatus === 'invalid' && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {slugStatus === 'taken' && (
                <p className="text-xs text-destructive">{t('dashboard.slugAlreadyTaken', 'Este slug já está em uso.')}</p>
              )}
              {slugStatus === 'invalid' && (
                <p className="text-xs text-muted-foreground">{t('dashboard.slugTooShort', 'O slug precisa ter pelo menos 3 caracteres.')}</p>
              )}
              {slugStatus === 'available' && userProfile?.company_slug && (
                <p className="text-xs text-muted-foreground">
                  URL: {window.location.origin}/{userProfile.company_slug}/{newSlug}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSlugDialogOpen(false)}>
                {t('dashboard.cancel')}
              </Button>
              <Button 
                onClick={confirmSlugEdit} 
                disabled={slugStatus !== 'available' || slugSaving}
              >
                {slugSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('dashboard.save', 'Salvar')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lazy Loaded Dialogs */}
        <Suspense fallback={null}>
          {tagManagerOpen && (
            <LazyTagManager 
              open={tagManagerOpen} 
              onClose={() => setTagManagerOpen(false)}
              onTagsUpdate={() => {}}
            />
          )}
          {embedDialogOpen && (
            <EmbedDialog
              open={embedDialogOpen}
              onOpenChange={setEmbedDialogOpen}
              quizSlug={selectedQuizSlug}
              companySlug={userProfile?.company_slug}
            />
          )}
          {previewDialogOpen && (
            <PreviewLinkDialog
              open={previewDialogOpen}
              onOpenChange={setPreviewDialogOpen}
              quizId={selectedQuizId}
            />
          )}
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default MyQuizzes;
