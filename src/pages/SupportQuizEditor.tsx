import { useState, useEffect, useCallback } from 'react';
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
import {
  Loader2, ArrowLeft, Save, Shield, AlertTriangle,
  ChevronDown, ChevronRight, GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Track changes
  const [quizChanged, setQuizChanged] = useState(false);
  const [changedQuestionIds, setChangedQuestionIds] = useState<Set<string>>(new Set());
  const [changedResultIds, setChangedResultIds] = useState<Set<string>>(new Set());

  // UI state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

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
      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setResults(data.results || []);
      setFormConfig(data.formConfig);
      trackAction('Abriu editor de quiz', quizId, data.quiz?.title);
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

  const hasChanges = quizChanged || changedQuestionIds.size > 0 || changedResultIds.size > 0;

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
          .filter(q => changedQuestionIds.has(q.id))
          .map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            blocks: q.blocks,
            custom_label: q.custom_label,
          }));
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

      // Reset change tracking
      setQuizChanged(false);
      setChangedQuestionIds(new Set());
      setChangedResultIds(new Set());
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
                Alterações pendentes
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
                <Input
                  value={quiz.title}
                  onChange={(e) => updateQuizField('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={quiz.slug || ''}
                  onChange={(e) => updateQuizField('slug', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={quiz.description || ''}
                  onChange={(e) => updateQuizField('description', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={quiz.is_public}
                  onCheckedChange={(v) => updateQuizField('is_public', v)}
                />
                <Label>Público</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={quiz.show_title ?? true}
                  onCheckedChange={(v) => updateQuizField('show_title', v)}
                />
                <Label>Exibir Título</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={quiz.show_description ?? true}
                  onCheckedChange={(v) => updateQuizField('show_description', v)}
                />
                <Label>Exibir Descrição</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={quiz.show_question_number ?? true}
                  onCheckedChange={(v) => updateQuizField('show_question_number', v)}
                />
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
            <CardTitle className="text-base">Perguntas ({questions.length})</CardTitle>
            <CardDescription>Clique para expandir e editar</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <Card key={q.id} className="border">
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Badge variant="outline" className="text-xs shrink-0">#{q.order_number}</Badge>
                      <span className="font-medium text-sm flex-1 truncate">{q.question_text}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{q.answer_format}</Badge>
                      {changedQuestionIds.has(q.id) && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-600 shrink-0">editado</Badge>
                      )}
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

                        {/* Blocks summary */}
                        {Array.isArray(q.blocks) && q.blocks.length > 0 && (
                          <div>
                            <Label className="mb-2 block">Blocos ({q.blocks.length})</Label>
                            <div className="flex flex-wrap gap-1">
                              {q.blocks.map((b: any, bi: number) => (
                                <Badge key={bi} variant="secondary" className="text-xs">{b.type || 'unknown'}</Badge>
                              ))}
                            </div>
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
                    <span className="font-medium text-sm flex-1 truncate">{r.result_text}</span>
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
                        <Textarea
                          value={r.result_text}
                          onChange={(e) => updateResultField(r.id, 'result_text', e.target.value)}
                          className="min-h-[60px]"
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

      {/* Save Confirmation Dialog */}
      <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Alterações
            </DialogTitle>
            <DialogDescription>
              Você está prestes a modificar o quiz de <strong>{target?.fullName || target?.email}</strong>.
              Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {quizChanged && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Quiz</Badge>
                <span>Metadados alterados</span>
              </div>
            )}
            {changedQuestionIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Perguntas</Badge>
                <span>{changedQuestionIds.size} pergunta(s) editada(s)</span>
              </div>
            )}
            {changedResultIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Resultados</Badge>
                <span>{changedResultIds.size} resultado(s) editado(s)</span>
              </div>
            )}
          </div>
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
