import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuestionConfigStep } from "@/components/quiz/QuestionConfigStep";
import { AppearanceConfigStep } from "@/components/quiz/AppearanceConfigStep";
import { VisitorFormConfigStep } from "@/components/quiz/VisitorFormConfigStep";
import { ResultsConfigStep } from "@/components/quiz/ResultsConfigStep";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { QuizBlock } from "@/types/blocks";
import { createBlock } from "@/types/blocks";
import type { EditorQuestion } from "@/types/quiz";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  is_premium: boolean;
  is_active: boolean;
  display_order: number;
}

const AdminTemplateEditor = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const queryClient = useQueryClient();
  const isNewTemplate = templateId === 'new';
  
  // Estados de loading e salvamento
  const [isLoading, setIsLoading] = useState(!isNewTemplate);
  const [isSaving, setIsSaving] = useState(false);
  
  // Metadados do template
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    id: '',
    name: '',
    description: '',
    category: 'lead_qualification',
    icon: '📝',
    is_premium: false,
    is_active: true,
    display_order: 0
  });
  
  // Estados do quiz (igual ao CreateQuiz)
  const [step, setStep] = useState(0); // 0 = metadados, 1-5 = steps do quiz
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<EditorQuestion[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('moderno');
  const [logoUrl, setLogoUrl] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showQuestionNumber, setShowQuestionNumber] = useState(true);
  const [collectionTiming, setCollectionTiming] = useState('after');
  const [collectName, setCollectName] = useState(false);
  const [collectEmail, setCollectEmail] = useState(false);
  const [collectWhatsapp, setCollectWhatsapp] = useState(false);
  const [deliveryTiming, setDeliveryTiming] = useState('immediate');

  const totalSteps = 5;
  const progress = step === 0 ? 0 : (step / totalSteps) * 100;

  // Função auxiliar movida para cima para ser usada no loadTemplate
  const initializeEmptyQuestions = useCallback((count: number): EditorQuestion[] => {
    const timestamp = Date.now();
    return Array.from({ length: count }, (_, index) => ({
      id: `temp-${timestamp}-${index}`,
      question_text: '',
      answer_format: 'single_choice' as const,
      options: [],
      order_number: index,
      blocks: [createBlock('question', 0)]
    }));
  }, []);

  // Carregar template existente
  useEffect(() => {
    if (!isNewTemplate && templateId) {
      loadTemplate(templateId);
    }
  }, [templateId, isNewTemplate]);

  const loadTemplate = async (id: string) => {
    try {
      setIsLoading(true);
      logger.log('Loading template:', id);
      
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      logger.log('Template data loaded:', data);

      // Preencher metadados
      setMetadata({
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category,
        icon: data.icon || '📝',
        is_premium: data.is_premium || false,
        is_active: data.is_active ?? true,
        display_order: data.display_order || 0
      });

      // Preencher dados do quiz a partir do full_config
      const config = data.full_config as Record<string, any> | null;
      const previewConfig = data.preview_config as Record<string, any> | null;
      
      logger.log('Full config:', config);
      logger.log('Preview config:', previewConfig);
      
      if (config && typeof config === 'object') {
        setTitle(config.title || previewConfig?.title || data.name || '');
        setDescription(config.description || previewConfig?.description || data.description || '');
        setTemplate(config.template || previewConfig?.template || 'moderno');
        
        const qCount = config.questionCount || (Array.isArray(config.questions) ? config.questions.length : 5);
        setQuestionCount(qCount);
        
        // Carregar form config
        if (config.formConfig && typeof config.formConfig === 'object') {
          setCollectName(config.formConfig.collect_name ?? false);
          setCollectEmail(config.formConfig.collect_email ?? false);
          setCollectWhatsapp(config.formConfig.collect_whatsapp ?? false);
          setCollectionTiming(config.formConfig.collection_timing || 'after');
        }

        // Carregar perguntas
        if (config.questions && Array.isArray(config.questions) && config.questions.length > 0) {
          logger.log('Loading questions:', config.questions.length);
          
          const loadedQuestions: EditorQuestion[] = config.questions.map((q: any, idx: number) => {
            // Processar options - pode ser array de strings ou array de objetos
            let processedOptions: string[] = [];
            if (Array.isArray(q.options)) {
              processedOptions = q.options.map((opt: any) => 
                typeof opt === 'string' ? opt : (opt.text || opt.label || String(opt))
              );
            }
            
            return {
              id: q.id || `temp-${Date.now()}-${idx}`,
              question_text: q.question_text || '',
              answer_format: q.answer_format || 'single_choice',
              options: processedOptions,
              order_number: idx,
              blocks: q.blocks && Array.isArray(q.blocks) && q.blocks.length > 0
                ? q.blocks.map((b: any, bIdx: number) => ({
                    ...b,
                    id: b.id || `block-${idx}-${bIdx}`,
                    order: b.order ?? bIdx
                  }))
                : [createBlock('question', 0)]
            };
          });
          
          logger.log('Processed questions:', loadedQuestions);
          setQuestions(loadedQuestions);
        } else {
          logger.log('No questions found, initializing empty');
          setQuestions(initializeEmptyQuestions(qCount));
        }
      } else {
        logger.log('No config found, using preview config');
        // Se não tem full_config, usar preview_config
        if (previewConfig) {
          setTitle(previewConfig.title || data.name || '');
          setDescription(previewConfig.description || data.description || '');
          setTemplate(previewConfig.template || 'moderno');
          setQuestionCount(previewConfig.questionCount || 5);
        }
        setQuestions(initializeEmptyQuestions(previewConfig?.questionCount || 5));
      }

      toast.success('Template carregado com sucesso');
    } catch (error) {
      logger.error('Error loading template:', error);
      toast.error('Erro ao carregar template');
      navigate('/masteradm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionsUpdate = useCallback((updatedQuestions: EditorQuestion[]) => {
    setQuestions(updatedQuestions);
  }, []);

  const buildFullConfig = () => {
    return {
      title,
      description,
      questionCount: questions.length || questionCount,
      template,
      questions: questions.map((q, idx) => ({
        id: q.id,
        question_text: q.question_text,
        answer_format: q.answer_format,
        options: q.options,
        order_number: idx,
        blocks: q.blocks
      })),
      formConfig: {
        collect_name: collectName,
        collect_email: collectEmail,
        collect_whatsapp: collectWhatsapp,
        collection_timing: collectionTiming
      },
      results: [] // Resultados serão adicionados separadamente se necessário
    };
  };

  const handleSave = async () => {
    if (!metadata.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    try {
      setIsSaving(true);

      const templateData = {
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        icon: metadata.icon,
        is_premium: metadata.is_premium,
        is_active: metadata.is_active,
        display_order: metadata.display_order,
        preview_config: {
          title: title || metadata.name,
          description: description || metadata.description,
          questionCount: questions.length || questionCount,
          template: template
        },
        full_config: buildFullConfig()
      };

      if (isNewTemplate) {
        const { error } = await supabase
          .from('quiz_templates')
          .insert(templateData);

        if (error) throw error;
        toast.success('Template criado com sucesso!');
      } else {
        const { error } = await supabase
          .from('quiz_templates')
          .update(templateData)
          .eq('id', templateId);

        if (error) throw error;
        toast.success('Template atualizado com sucesso!');
      }

      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['quiz-templates'] });
      queryClient.invalidateQueries({ queryKey: ['all-quiz-templates'] });
      
      navigate('/masteradm');
    } catch (error: any) {
      logger.error('Error saving template:', error);
      toast.error(error.message || 'Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Card>
            <CardContent className="p-8">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/masteradm')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isNewTemplate ? 'Novo Template' : 'Editar Template'}
                </h1>
                <p className="text-muted-foreground">
                  Editor visual de templates de quiz
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={metadata.is_active ? 'default' : 'secondary'}>
              {metadata.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            {metadata.is_premium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                Premium
              </Badge>
            )}
          </div>
        </div>

        {/* Progress */}
        {step > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Etapa {step} de {totalSteps}</span>
              <span>{Math.round(progress)}% completo</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Step Navigation Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={step === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(0)}
          >
            📋 Metadados
          </Button>
          <Button
            variant={step === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (questions.length === 0) {
                setQuestions(initializeEmptyQuestions(questionCount));
              }
              setStep(1);
            }}
          >
            🔢 Quantidade
          </Button>
          <Button
            variant={step === 2 ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (questions.length === 0) {
                setQuestions(initializeEmptyQuestions(questionCount));
              }
              setStep(2);
            }}
            className="relative"
          >
            ❓ Perguntas
            {questions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {questions.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={step === 3 ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(3)}
          >
            🎨 Aparência
          </Button>
          <Button
            variant={step === 4 ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(4)}
          >
            📝 Formulário
          </Button>
          <Button
            variant={step === 5 ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(5)}
          >
            🎯 Resultados
          </Button>
        </div>

        {/* Step 0: Metadata */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Template</CardTitle>
              <CardDescription>
                Configure os metadados que serão exibidos na seleção de templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={metadata.name}
                    onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                    placeholder="Ex: Qualificação de Lead"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone (Emoji)</Label>
                  <Input
                    id="icon"
                    value={metadata.icon}
                    onChange={(e) => setMetadata({ ...metadata, icon: e.target.value })}
                    placeholder="📝"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Breve descrição do template"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={metadata.category}
                    onValueChange={(value) => setMetadata({ ...metadata, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead_qualification">Qualificação de Lead</SelectItem>
                      <SelectItem value="product_discovery">Descoberta de Produto</SelectItem>
                      <SelectItem value="customer_satisfaction">Satisfação do Cliente</SelectItem>
                      <SelectItem value="engagement">Engajamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={metadata.display_order}
                    onChange={(e) => setMetadata({ ...metadata, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_premium">Template Premium</Label>
                    <Switch
                      id="is_premium"
                      checked={metadata.is_premium}
                      onCheckedChange={(checked) => setMetadata({ ...metadata, is_premium: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Ativo</Label>
                    <Switch
                      id="is_active"
                      checked={metadata.is_active}
                      onCheckedChange={(checked) => setMetadata({ ...metadata, is_active: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Question Count */}
        {step === 1 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl">Quantidade de Perguntas</CardTitle>
              <CardDescription>
                Defina quantas perguntas o template terá por padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-4">
                  <p className="text-6xl font-bold text-primary">{questionCount}</p>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={questionCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value)) {
                        setQuestionCount(Math.min(Math.max(1, value), 50));
                      }
                    }}
                    className="w-20 h-12 text-center text-xl font-bold"
                  />
                </div>
                <p className="text-muted-foreground mt-4">Ajuste o slider ou digite o número</p>
              </div>

              <div className="space-y-4">
                <Slider
                  value={[questionCount]}
                  onValueChange={(value) => setQuestionCount(value[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 pergunta</span>
                  <span>50 perguntas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configure Questions */}
        {step === 2 && (
          <div className="space-y-4">
            {questions.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{questions.length} perguntas carregadas</Badge>
                      <span className="text-sm text-muted-foreground">
                        do template
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <QuestionConfigStep
              questions={questions}
              questionCount={questionCount}
              isPublic={true}
              onPublicChange={() => {}}
              quizTitle={title || metadata.name}
              quizDescription={description || metadata.description}
              onQuestionsUpdate={handleQuestionsUpdate}
              initialQuestionIndex={0}
            />
          </div>
        )}

        {/* Step 3: Appearance */}
        {step === 3 && (
          <AppearanceConfigStep 
            title={title || metadata.name}
            description={description || metadata.description}
            template={template}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onTemplateChange={setTemplate}
            questionCount={questionCount}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            showLogo={showLogo}
            showTitle={showTitle}
            showDescription={showDescription}
            showQuestionNumber={showQuestionNumber}
            onShowLogoChange={setShowLogo}
            onShowTitleChange={setShowTitle}
            onShowDescriptionChange={setShowDescription}
            onShowQuestionNumberChange={setShowQuestionNumber}
          />
        )}

        {/* Step 4: Visitor Form */}
        {step === 4 && (
          <VisitorFormConfigStep
            collectionTiming={collectionTiming}
            collectName={collectName}
            collectEmail={collectEmail}
            collectWhatsapp={collectWhatsapp}
            onCollectionTimingChange={setCollectionTiming}
            onCollectNameChange={setCollectName}
            onCollectEmailChange={setCollectEmail}
            onCollectWhatsappChange={setCollectWhatsapp}
          />
        )}

        {/* Step 5: Results Preview */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Resultados</CardTitle>
              <CardDescription>
                Os resultados serão configurados quando o usuário criar um quiz a partir deste template.
                Aqui você pode definir as configurações padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border rounded-lg bg-muted/50 text-center">
                <p className="text-muted-foreground">
                  A configuração de resultados será herdada pelo quiz criado.
                  O usuário poderá personalizar após criar o quiz.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Template
            </Button>

            {step < totalSteps && (
              <Button 
                onClick={() => {
                  if (step === 1 && questions.length === 0) {
                    const emptyQuestions = initializeEmptyQuestions(questionCount);
                    setQuestions(emptyQuestions);
                  }
                  setStep(Math.min(totalSteps, step + 1));
                }}
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminTemplateEditor;
