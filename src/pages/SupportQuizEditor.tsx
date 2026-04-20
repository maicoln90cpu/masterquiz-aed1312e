import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupportMode } from '@/contexts/SupportModeContext';
import { logAudit } from '@/lib/auditLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Loader2, ArrowLeft, Save, Shield, AlertTriangle,
  ChevronDown, ChevronRight, GripVertical, Plus, Trash2,
  ArrowRight
} from 'lucide-react';
import { SupportBlockEditor } from './support/SupportBlockEditor';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/quiz/blocks/RichTextEditor';
import { stripHtml } from '@/lib/htmlUtils';

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  status: string;
  is_public: boolean;
  template: string;
  show_title: boolean;
  show_description: boolean;
  show_logo: boolean;
  show_question_number: boolean;
  progress_style: string | null;
}

interface QuestionData {
  id: string;
  question_text: string;
  answer_format: string;
  order_number: number;
  blocks: any[];
  options: any[];
  media_url: string | null;
  media_type: string | null;
  conditions: any | null;
  custom_label: string | null;
}

interface ResultData {
  id: string;
  result_text: string;
  min_score: number | null;
  max_score: number | null;
  condition_type: string;
  redirect_url: string | null;
  button_text: string | null;
  order_number: number;
  image_url: string | null;
}

// Diff helpers
const QUIZ_DIFF_FIELDS: { key: keyof QuizData; label: string }[] = [
  { key: 'title', label: 'Título' },
  { key: 'description', label: 'Descrição' },
  { key: 'slug', label: 'Slug' },
  { key: 'status', label: 'Status' },
  { key: 'is_public', label: 'Público' },
  { key: 'show_title', label: 'Exibir Título' },
  { key: 'show_description', label: 'Exibir Descrição' },
  { key: 'show_question_number', label: 'Nº Pergunta' },
  { key: 'progress_style', label: 'Estilo Progresso' },
];

const formatDiffValue = (val: any): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? '✅' : '❌';
  return String(val);
};

const SupportQuizEditor = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { isSupportMode, target, trackAction } = useSupportMode();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [results, setResults] = useState<ResultData[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);

  // Snapshots for diff
  const originalQuiz = useRef<QuizData | null>(null);
  const originalQuestions = useRef<QuestionData[]>([]);
  const originalResults = useRef<ResultData[]>([]);

  // Track changes
  const [quizChanged, setQuizChanged] = useState(false);
  const [changedQuestionIds, setChangedQuestionIds] = useState<Set<string>>(new Set());
  const [changedResultIds, setChangedResultIds] = useState<Set<string>>(new Set());
  const [addedQuestionIds, setAddedQuestionIds] = useState<Set<string>>(new Set());
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<Set<string>>(new Set());

  // UI state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupportMode || !target || !quizId) {
      navigate('/masteradm/support');
      return;
    }
    loadQuizData();
  }, [isSupportMode, target, quizId]);

  const callEdgeFunction = useCallback(async (body: any) => {
    const { data, error } = await supabase.functions.invoke('admin-view-user-data', { body });
    if (error) throw error;
    return data;
  }, []);

  const loadQuizData = async () => {
    setLoading(true);
    try {
      const data = await callEdgeFunction({
        target_user_id: target!.userId,
        data_type: 'quiz_detail',
        quiz_id: quizId,
      });
      const q = data.quiz;
      const qs = data.questions || [];
      const rs = data.results || [];

      setQuiz(q);
      setQuestions(qs);
      setResults(rs);
      setFormConfig(data.formConfig);

      // Save snapshots for diff
      originalQuiz.current = q ? { ...q } : null;
      originalQuestions.current = qs.map((qq: any) => ({ ...qq }));
      originalResults.current = rs.map((rr: any) => ({ ...rr }));

      trackAction('Abriu editor de quiz', quizId, q?.title);
    } catch (err: any) {
      console.error('Error loading quiz:', err);
      toast.error('Erro ao carregar quiz');
      navigate('/masteradm/support');
    } finally {
      setLoading(false);
    }
  };

  const updateQuizField = (field: keyof QuizData, value: any) => {
    if (!quiz) return;
    setQuiz({ ...quiz, [field]: value });
    setQuizChanged(true);
  };

  const updateQuestionField = (questionId: string, field: keyof QuestionData, value: any) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, [field]: value } : q));
    setChangedQuestionIds(prev => new Set(prev).add(questionId));
  };

  const updateResultField = (resultId: string, field: keyof ResultData, value: any) => {
    setResults(prev => prev.map(r => r.id === resultId ? { ...r, [field]: value } : r));
    setChangedResultIds(prev => new Set(prev).add(resultId));
  };

  // Add question
  const addQuestion = () => {
    const tempId = `temp-${Date.now()}`;
    const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order_number)) : -1;
    const newQuestion: QuestionData = {
      id: tempId,
      question_text: 'Nova pergunta',
      answer_format: 'single_choice',
      order_number: maxOrder + 1,
      blocks: [{ type: 'question', content: { questionText: 'Nova pergunta', options: [{ text: 'Opção 1', score: 0 }, { text: 'Opção 2', score: 0 }] } }],
      options: [{ text: 'Opção 1', score: 0 }, { text: 'Opção 2', score: 0 }],
      media_url: null,
      media_type: null,
      conditions: null,
      custom_label: null,
    };
    setQuestions(prev => [...prev, newQuestion]);
    setAddedQuestionIds(prev => new Set(prev).add(tempId));
    setExpandedQuestionId(tempId);
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    if (addedQuestionIds.has(questionId)) {
      // Was a new question — just remove from added set
      setAddedQuestionIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    } else {
      // Existing question — mark for deletion
      setDeletedQuestionIds(prev => new Set(prev).add(questionId));
    }
    // Clean up other tracking
    setChangedQuestionIds(prev => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
    setConfirmDeleteId(null);
    if (expandedQuestionId === questionId) setExpandedQuestionId(null);
  };

  const hasChanges = quizChanged || changedQuestionIds.size > 0 || changedResultIds.size > 0 || addedQuestionIds.size > 0 || deletedQuestionIds.size > 0;

  // Build diff for confirmation modal
  const buildDiff = () => {
    const diff: {
      metadataChanges: { field: string; before: string; after: string }[];
      modifiedQuestions: { orderNum: number; text: string; changes: string[] }[];
      addedQuestions: { text: string }[];
      deletedQuestions: { orderNum: number; text: string }[];
      modifiedResults: { orderNum: number; text: string; changes: string[] }[];
    } = {
      metadataChanges: [],
      modifiedQuestions: [],
      addedQuestions: [],
      deletedQuestions: [],
      modifiedResults: [],
    };

    // Quiz metadata diff
    if (quizChanged && quiz && originalQuiz.current) {
      for (const { key, label } of QUIZ_DIFF_FIELDS) {
        const before = originalQuiz.current[key];
        const after = quiz[key];
        if (String(before) !== String(after)) {
          diff.metadataChanges.push({
            field: label,
            before: formatDiffValue(before),
            after: formatDiffValue(after),
          });
        }
      }
    }

    // Added questions
    for (const id of addedQuestionIds) {
      const q = questions.find(qq => qq.id === id);
      if (q) diff.addedQuestions.push({ text: q.question_text });
    }

    // Deleted questions
    for (const id of deletedQuestionIds) {
      const orig = originalQuestions.current.find(qq => qq.id === id);
      if (orig) diff.deletedQuestions.push({ orderNum: orig.order_number, text: orig.question_text });
    }

    // Modified questions
    for (const id of changedQuestionIds) {
      if (addedQuestionIds.has(id) || deletedQuestionIds.has(id)) continue;
      const current = questions.find(q => q.id === id);
      const orig = originalQuestions.current.find(q => q.id === id);
      if (!current || !orig) continue;
      const changes: string[] = [];
      if (current.question_text !== orig.question_text) changes.push('texto');
      if (JSON.stringify(current.options) !== JSON.stringify(orig.options)) changes.push('opções');
      if (JSON.stringify(current.blocks) !== JSON.stringify(orig.blocks)) changes.push('blocos');
      if (current.custom_label !== orig.custom_label) changes.push('label');
      if (changes.length > 0) {
        diff.modifiedQuestions.push({ orderNum: current.order_number, text: current.question_text.substring(0, 50), changes });
      }
    }

    // Modified results
    for (const id of changedResultIds) {
      const current = results.find(r => r.id === id);
      const orig = originalResults.current.find(r => r.id === id);
      if (!current || !orig) continue;
      const changes: string[] = [];
      if (current.result_text !== orig.result_text) changes.push('texto');
      if (current.min_score !== orig.min_score || current.max_score !== orig.max_score) changes.push('scores');
      if (current.redirect_url !== orig.redirect_url) changes.push('URL');
      if (current.button_text !== orig.button_text) changes.push('botão');
      if (changes.length > 0) {
        diff.modifiedResults.push({ orderNum: current.order_number, text: current.result_text.substring(0, 50), changes });
      }
    }

    return diff;
  };

  const handleSave = async () => {
    setConfirmSaveOpen(false);
    setSaving(true);
    try {
      const payload: any = {
        target_user_id: target!.userId,
        data_type: 'save_quiz',
        quiz_id: quizId,
      };

      if (quizChanged && quiz) {
        payload.quiz_updates = {
          title: quiz.title,
          description: quiz.description,
          slug: quiz.slug,
          status: quiz.status,
          is_public: quiz.is_public,
          show_title: quiz.show_title,
          show_description: quiz.show_description,
          show_question_number: quiz.show_question_number,
          progress_style: quiz.progress_style,
        };
      }

      if (changedQuestionIds.size > 0) {
        payload.questions_updates = questions
          .filter(q => changedQuestionIds.has(q.id) && !addedQuestionIds.has(q.id))
          .map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            blocks: q.blocks,
            custom_label: q.custom_label,
          }));
      }

      // New questions to add
      if (addedQuestionIds.size > 0) {
        payload.questions_to_add = questions
          .filter(q => addedQuestionIds.has(q.id))
          .map(q => ({
            question_text: q.question_text,
            answer_format: q.answer_format,
            order_number: q.order_number,
            blocks: q.blocks,
            options: q.options,
            custom_label: q.custom_label,
          }));
      }

      // Questions to delete
      if (deletedQuestionIds.size > 0) {
        payload.questions_to_delete = Array.from(deletedQuestionIds);
      }

      if (changedResultIds.size > 0) {
        payload.results_updates = results
          .filter(r => changedResultIds.has(r.id))
          .map(r => ({
            id: r.id,
            result_text: r.result_text,
            min_score: r.min_score,
            max_score: r.max_score,
            redirect_url: r.redirect_url,
            button_text: r.button_text,
          }));
      }

      const data = await callEdgeFunction(payload);
      toast.success('Alterações salvas com sucesso');
      trackAction('Salvou alterações no quiz', quizId, `Mudanças: ${data.changes?.join(', ')}`);
      logAudit('support:edit_quiz', 'support', quizId!, { target_user_id: target!.userId, changes: data.changes });

      // Reload to get fresh data with real IDs
      await loadQuizData();

      // Reset change tracking
      setQuizChanged(false);
      setChangedQuestionIds(new Set());
      setChangedResultIds(new Set());
      setAddedQuestionIds(new Set());
      setDeletedQuestionIds(new Set());
    } catch (err: any) {
      console.error('Error saving quiz:', err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || !target) return null;

  const diff = buildDiff();
  const totalDiffItems = diff.metadataChanges.length + diff.modifiedQuestions.length + diff.addedQuestions.length + diff.deletedQuestions.length + diff.modifiedResults.length;

  return (
    <div className="min-h-screen bg-background pt-12">
      {/* Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">MODO SUPORTE — Editando quiz de {target.fullName || target.email}</span>
          <span className="text-xs ml-auto">Todas as alterações são registradas no audit_log</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/masteradm/support')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Editor de Suporte
              </h1>
              <p className="text-sm text-muted-foreground">{quiz.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                {totalDiffItems} alteração(ões)
              </Badge>
            )}
            <Button
              onClick={() => setConfirmSaveOpen(true)}
              disabled={!hasChanges || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Quiz Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configurações do Quiz</CardTitle>
            <CardDescription>Metadados e opções de exibição</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={quiz.title} onChange={(e) => updateQuizField('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={quiz.slug || ''} onChange={(e) => updateQuizField('slug', e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea value={quiz.description || ''} onChange={(e) => updateQuizField('description', e.target.value)} className="min-h-[60px]" />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch checked={quiz.is_public} onCheckedChange={(v) => updateQuizField('is_public', v)} />
                <Label>Público</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={quiz.show_title ?? true} onCheckedChange={(v) => updateQuizField('show_title', v)} />
                <Label>Exibir Título</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={quiz.show_description ?? true} onCheckedChange={(v) => updateQuizField('show_description', v)} />
                <Label>Exibir Descrição</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={quiz.show_question_number ?? true} onCheckedChange={(v) => updateQuizField('show_question_number', v)} />
                <Label>Nº da Pergunta</Label>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <span>Status: <Badge variant={quiz.status === 'active' ? 'default' : 'secondary'}>{quiz.status}</Badge></span>
              <span>Template: {quiz.template}</span>
              <span>Progresso: {quiz.progress_style || 'default'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Perguntas ({questions.length})</CardTitle>
                <CardDescription>Clique para expandir e editar</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {questions.map((q) => (
                  <Card key={q.id} className={`border ${addedQuestionIds.has(q.id) ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Badge variant="outline" className="text-xs shrink-0">#{q.order_number}</Badge>
                      <span className="font-medium text-sm flex-1 truncate">{q.question_text}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{q.answer_format}</Badge>
                      {addedQuestionIds.has(q.id) && (
                        <Badge className="text-xs bg-green-600 shrink-0">nova</Badge>
                      )}
                      {changedQuestionIds.has(q.id) && !addedQuestionIds.has(q.id) && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600 shrink-0">editado</Badge>
                      )}
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(q.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expandedQuestionId === q.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>

                    {expandedQuestionId === q.id && (
                      <CardContent className="pt-0 pb-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Texto da Pergunta</Label>
                          <Textarea
                            value={q.question_text}
                            onChange={(e) => updateQuestionField(q.id, 'question_text', e.target.value)}
                            className="min-h-[60px]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Label Customizada</Label>
                          <Input
                            value={q.custom_label || ''}
                            onChange={(e) => updateQuestionField(q.id, 'custom_label', e.target.value || null)}
                            placeholder="Ex: Pergunta sobre preferências"
                          />
                        </div>

                        {/* Options editor */}
                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="space-y-2">
                            <Label>Opções ({q.options.length})</Label>
                            <div className="space-y-2">
                              {q.options.map((opt: any, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs shrink-0 w-6 justify-center">{optIdx + 1}</Badge>
                                  <Input
                                    value={typeof opt === 'string' ? opt : opt.text || opt.label || ''}
                                    onChange={(e) => {
                                      const newOptions = [...q.options];
                                      if (typeof opt === 'string') {
                                        newOptions[optIdx] = e.target.value;
                                      } else {
                                        newOptions[optIdx] = { ...opt, text: e.target.value };
                                      }
                                      updateQuestionField(q.id, 'options', newOptions);
                                    }}
                                    className="flex-1"
                                  />
                                  {typeof opt === 'object' && opt.score !== undefined && (
                                    <Input
                                      type="number"
                                      value={opt.score}
                                      onChange={(e) => {
                                        const newOptions = [...q.options];
                                        newOptions[optIdx] = { ...opt, score: Number(e.target.value) };
                                        updateQuestionField(q.id, 'options', newOptions);
                                      }}
                                      className="w-20"
                                      placeholder="Score"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Blocks editor */}
                        {Array.isArray(q.blocks) && q.blocks.length > 0 && (
                          <div className="space-y-2">
                            <Label className="mb-1 block">Blocos ({q.blocks.length})</Label>
                            {q.blocks.map((b: any, bi: number) => (
                              <SupportBlockEditor
                                key={b.id || bi}
                                block={b}
                                blockIndex={bi}
                                onBlockChange={(updatedBlock) => {
                                  const newBlocks = [...q.blocks];
                                  newBlocks[bi] = updatedBlock;
                                  updateQuestionField(q.id, 'blocks', newBlocks);
                                }}
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {q.media_url && <span>📎 {q.media_type || 'Mídia'}</span>}
                          {q.conditions && <span>🔀 Lógica condicional</span>}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultados ({results.length})</CardTitle>
            <CardDescription>Clique para expandir e editar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r) => (
                <Card key={r.id} className="border">
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedResultId(expandedResultId === r.id ? null : r.id)}
                  >
                    <Badge variant="outline" className="text-xs shrink-0">#{r.order_number}</Badge>
                    <span className="font-medium text-sm flex-1 truncate">{stripHtml(r.result_text)}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {r.min_score ?? '-'} — {r.max_score ?? '-'}
                    </span>
                    {changedResultIds.has(r.id) && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600 shrink-0">editado</Badge>
                    )}
                    {expandedResultId === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>

                  {expandedResultId === r.id && (
                    <CardContent className="pt-0 pb-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Texto do Resultado</Label>
                        <RichTextEditor
                          value={r.result_text}
                          onChange={(value) => updateResultField(r.id, 'result_text', value)}
                          minHeight="120px"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Score Mínimo</Label>
                          <Input
                            type="number"
                            value={r.min_score ?? ''}
                            onChange={(e) => updateResultField(r.id, 'min_score', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Score Máximo</Label>
                          <Input
                            type="number"
                            value={r.max_score ?? ''}
                            onChange={(e) => updateResultField(r.id, 'max_score', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>URL de Redirecionamento</Label>
                          <Input
                            value={r.redirect_url || ''}
                            onChange={(e) => updateResultField(r.id, 'redirect_url', e.target.value || null)}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto do Botão</Label>
                          <Input
                            value={r.button_text || ''}
                            onChange={(e) => updateResultField(r.id, 'button_text', e.target.value || null)}
                            placeholder="Ex: Ver oferta"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Tipo: {r.condition_type}</span>
                        {r.image_url && <span>🖼️ Com imagem</span>}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Config (read-only) */}
        {formConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formulário de Captura</CardTitle>
              <CardDescription>Configuração atual (somente leitura)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>Email: {formConfig.collect_email ? '✅' : '❌'}</div>
                <div>Nome: {formConfig.collect_name ? '✅' : '❌'}</div>
                <div>WhatsApp: {formConfig.collect_whatsapp ? '✅' : '❌'}</div>
                <div>Timing: {formConfig.collection_timing}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Pergunta
            </DialogTitle>
            <DialogDescription>
              Esta ação removerá a pergunta permanentemente ao salvar. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmDeleteId && deleteQuestion(confirmDeleteId)}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog with Visual Diff */}
      <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Alterações
            </DialogTitle>
            <DialogDescription>
              Revise as alterações antes de salvar no quiz de <strong>{target?.fullName || target?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* Metadata diff table */}
            {diff.metadataChanges.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">📋 Metadados do Quiz</h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 font-medium">Campo</th>
                        <th className="text-left p-2 font-medium text-destructive">Antes</th>
                        <th className="text-center p-2 w-8"></th>
                        <th className="text-left p-2 font-medium text-green-600">Depois</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diff.metadataChanges.map((ch, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-medium">{ch.field}</td>
                          <td className="p-2 text-destructive line-through">{ch.before}</td>
                          <td className="p-2 text-center"><ArrowRight className="h-3 w-3 text-muted-foreground" /></td>
                          <td className="p-2 text-green-600 font-medium">{ch.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Added questions */}
            {diff.addedQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">➕ Perguntas Adicionadas ({diff.addedQuestions.length})</h4>
                <div className="space-y-1">
                  {diff.addedQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                      <Badge className="bg-green-600 text-xs">nova</Badge>
                      <span>{q.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deleted questions */}
            {diff.deletedQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">🗑️ Perguntas Excluídas ({diff.deletedQuestions.length})</h4>
                <div className="space-y-1">
                  {diff.deletedQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
                      <Badge variant="destructive" className="text-xs">#{q.orderNum}</Badge>
                      <span className="line-through">{q.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified questions */}
            {diff.modifiedQuestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">✏️ Perguntas Editadas ({diff.modifiedQuestions.length})</h4>
                <div className="space-y-1">
                  {diff.modifiedQuestions.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">#{q.orderNum}</Badge>
                      <span className="flex-1 truncate">{q.text}</span>
                      <span className="text-muted-foreground">{q.changes.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modified results */}
            {diff.modifiedResults.length > 0 && (
              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">🏆 Resultados Editados ({diff.modifiedResults.length})</h4>
                <div className="space-y-1">
                  {diff.modifiedResults.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">#{r.orderNum}</Badge>
                      <span className="flex-1 truncate">{r.text}</span>
                      <span className="text-muted-foreground">{r.changes.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalDiffItems === 0 && hasChanges && (
              <p className="text-muted-foreground text-center py-4">Alterações detectadas mas sem diferenças visíveis nos campos rastreados.</p>
            )}
          </div>

          <Separator />

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSaveOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Confirmar e Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportQuizEditor;
