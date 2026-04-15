import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, ArrowLeft, FileText, Upload, ChevronDown, Settings2, GraduationCap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAIGenerationLimits } from "@/hooks/useAIGenerationLimits";
import { useResourceLimits } from "@/hooks/useResourceLimits";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { pushGTMEvent } from "@/lib/gtmLogger";

interface AIQuizGeneratorProps {
  onBack: () => void;
  /** When true, locks the mode to "form" and hides the tab switcher */
  lockedMode?: "form" | "pdf" | "educational";
}

interface GeneratedQuestion {
  question_text: string;
  answer_format: 'single_choice' | 'multiple_choice' | 'yes_no';
  options: string[];
  aiSuggestions?: {
    mediaType: 'image' | 'video' | null;
    mediaReason: string;
    additionalBlocks: Array<{
      type: 'separator' | 'button' | 'text';
      reason: string;
      position: 'before' | 'after';
    }>;
  };
}

interface GeneratedQuizData {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

// Tipos para as novas variáveis
interface FormAdvancedSettings {
  quizIntent: string;
  companyName: string;
  industry: string;
  tone: string;
  leadTemperature: string;
  resultProfiles: string;
  ctaText: string;
}

interface PdfAdvancedSettings {
  focusTopics: string;
  quizIntent: string;
  difficultyLevel: string;
  targetAudiencePdf: string;
  tone: string;
  leadTemperature: string;
}

interface EducationalSettings {
  subject: string;
  topic: string;
  educationLevel: string;
  educationalGoal: string;
  difficultyLevel: string;
  includeExplanations: boolean;
  explanationMode: 'per_question' | 'end_of_quiz';
}

export const AIQuizGenerator = ({ onBack, lockedMode }: AIQuizGeneratorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { allowed, used, limit, isLoading: limitsLoading } = useAIGenerationLimits();
  const { limits: resourceLimits, isLoading: resourceLimitsLoading } = useResourceLimits();
  
  // Dynamic max questions based on user's plan
  const maxQuestions = resourceLimits?.questionsPerQuizLimit || 10;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadMode, setUploadMode] = useState<"form" | "pdf" | "educational">(lockedMode || "form");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfContent, setPdfContent] = useState<string>("");
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfProposal, setPdfProposal] = useState<'infoprodutor' | 'gestor_trafego' | 'educational'>('infoprodutor');
  const [educationalSettings, setEducationalSettings] = useState<EducationalSettings>({
    subject: '',
    topic: '',
    educationLevel: 'medio',
    educationalGoal: 'fixacao',
    difficultyLevel: 'medium',
    includeExplanations: false,
    explanationMode: 'per_question',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Adjust numberOfQuestions if it exceeds plan limit
  useEffect(() => {
    if (resourceLimits && formData.numberOfQuestions > resourceLimits.questionsPerQuizLimit) {
      setFormData(prev => ({
        ...prev,
        numberOfQuestions: Math.min(prev.numberOfQuestions, resourceLimits.questionsPerQuizLimit)
      }));
    }
  }, [resourceLimits?.questionsPerQuizLimit]);
  
  // Campos básicos
  const [formData, setFormData] = useState({
    productName: "",
    problemSolved: "",
    targetAudience: "",
    desiredAction: "",
    numberOfQuestions: 5,
  });

  // Campos avançados - Modo Formulário
  const [formAdvanced, setFormAdvanced] = useState<FormAdvancedSettings>({
    quizIntent: "",
    companyName: "",
    industry: "",
    tone: "",
    leadTemperature: "",
    resultProfiles: "",
    ctaText: "",
  });

  // Campos avançados - Modo PDF
  const [pdfAdvanced, setPdfAdvanced] = useState<PdfAdvancedSettings>({
    focusTopics: "",
    quizIntent: "",
    difficultyLevel: "",
    targetAudiencePdf: "",
    tone: "",
    leadTemperature: "",
  });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error(t('components.aiGenerator.pdfOnly'));
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast.error(t('components.aiGenerator.pdfTooLarge', { size: 20 }));
      return;
    }

    setPdfFile(file);
    setIsParsingPdf(true);

    try {
      toast.info(t('components.aiGenerator.extractingPdf'));
      
      // Upload file to virtual filesystem
      const virtualPath = `user-uploads://${file.name}`;
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // In a real implementation, we would:
      // 1. Upload the file to a temporary location
      // 2. Call document--parse_document via backend API
      // 3. Get structured content back
      
      // Convert file to base64 for efficient transfer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const fileBase64 = btoa(binary);
      
      // Call backend Edge Function to parse PDF
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-pdf-document', {
        body: {
          fileName: file.name,
          fileBase64,
        }
      });

      if (parseError) {
        console.error('[AIQuizGenerator] Parse PDF error:', parseError);
        const errorMsg = parseError.message || '';
        if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          toast.error('Serviço de parsing de PDF indisponível. Tente novamente mais tarde.');
        } else if (errorMsg.includes('413')) {
          toast.error('Arquivo PDF muito grande. Máximo 20MB.');
        } else {
          toast.error(t('components.aiGenerator.pdfProcessError'));
        }
        setPdfFile(null);
        setIsParsingPdf(false);
        return;
      }

      // Check for semantic error responses (status 4xx returned as data)
      if (parseResult?.error) {
        console.error('[AIQuizGenerator] Parse PDF semantic error:', parseResult);
        const errCode = parseResult.error;
        if (errCode === 'INVALID_PDF') {
          toast.error('Arquivo inválido. Envie um PDF válido.');
        } else if (errCode === 'PDF_PROTECTED') {
          toast.error('O PDF está protegido por senha. Remova a senha e tente novamente.');
        } else if (errCode === 'LOW_TEXT_DENSITY') {
          toast.error('O PDF contém pouco texto extraível. Pode ser um documento escaneado/baseado em imagens.');
        } else if (errCode === 'INVALID_BASE64') {
          toast.error('Erro ao processar o arquivo. Tente novamente.');
        } else if (errCode === 'FILE_TOO_LARGE') {
          toast.error('Arquivo PDF muito grande. Máximo 20MB.');
        } else {
          toast.error(`Erro ao processar PDF: ${parseResult.details || errCode}`);
        }
        setPdfFile(null);
        setIsParsingPdf(false);
        return;
      }

      // Extract meaningful content from parsed result
      let extractedContent = '';
      
      if (parseResult.markdown) {
        extractedContent = parseResult.markdown;
      } else if (parseResult.text) {
        extractedContent = parseResult.text;
      } else {
        extractedContent = JSON.stringify(parseResult);
      }

      // Add metadata about images and tables if present
      if (parseResult.images && parseResult.images.length > 0) {
        extractedContent += `\n\n[Documento contém ${parseResult.images.length} imagem(ns)]`;
      }
      
      if (parseResult.tables && parseResult.tables.length > 0) {
        extractedContent += `\n\n[Documento contém ${parseResult.tables.length} tabela(s)]`;
      }

      // ✅ LOG DETALHADO PARA DEBUG
      console.log(`[AIQuizGenerator] PDF content extracted successfully`);
      console.log(`[AIQuizGenerator] Content length: ${extractedContent.length} chars`);
      console.log(`[AIQuizGenerator] Content preview (first 500 chars):`, extractedContent.substring(0, 500));
      
      // Verificar qualidade do conteúdo
      if (extractedContent.length < 200) {
        console.warn(`[AIQuizGenerator] ⚠️ Content seems too short - may be metadata only`);
        toast.warning(t('components.aiGenerator.contentShort'));
      }
      
      if (extractedContent.includes('%PDF-') || extractedContent.includes('endobj')) {
        console.error(`[AIQuizGenerator] ❌ Content contains raw PDF markers - extraction failed`);
        toast.error(t('components.aiGenerator.extractionFailed'));
      }

      setPdfContent(extractedContent);
      toast.success(t('components.aiGenerator.pdfProcessed', { 
        pages: parseResult.pages || 'Multiple', 
        chars: extractedContent.length 
      }));
      
    } catch (error) {
      console.error('Error parsing PDF:', error);
      toast.error(t('components.aiGenerator.pdfProcessError'));
      setPdfFile(null);
    } finally {
      setIsParsingPdf(false);
    }
  };

  const handleGenerateQuiz = async () => {
    // Validação baseada no modo
    if (uploadMode === "form") {
      if (!formData.productName || !formData.problemSolved || !formData.targetAudience) {
        toast.error(t('components.aiGenerator.fillRequired'));
        return;
      }
    } else if (uploadMode === "educational") {
      if (!educationalSettings.subject || !educationalSettings.topic) {
        toast.error('Preencha a Disciplina e o Conteúdo/Tema');
        return;
      }
    } else {
      if (!pdfFile || !pdfContent) {
        toast.error(t('components.aiGenerator.uploadPdfFirst'));
        return;
      }
    }

    setIsGenerating(true);

    try {
      // Preparar payload baseado no modo com novas variáveis
      let requestBody: Record<string, any>;
      if (uploadMode === "form") {
        requestBody = {
          ...formData,
          quizIntent: formAdvanced.quizIntent || undefined,
          companyName: formAdvanced.companyName || undefined,
          industry: formAdvanced.industry || undefined,
          tone: formAdvanced.tone || undefined,
          leadTemperature: formAdvanced.leadTemperature || undefined,
          resultProfiles: formAdvanced.resultProfiles || undefined,
          ctaText: formAdvanced.ctaText || undefined,
        };
      } else if (uploadMode === "educational") {
        requestBody = {
          mode: 'educational',
          numberOfQuestions: formData.numberOfQuestions,
          subject: educationalSettings.subject,
          topic: educationalSettings.topic,
          educationLevel: educationalSettings.educationLevel,
          educationalGoal: educationalSettings.educationalGoal,
          difficultyLevel: educationalSettings.difficultyLevel,
          includeExplanations: educationalSettings.includeExplanations,
          explanationMode: educationalSettings.includeExplanations ? educationalSettings.explanationMode : undefined,
        };
      } else {
        requestBody = {
          pdfContent: pdfContent,
          pdfFileName: pdfFile?.name,
          numberOfQuestions: formData.numberOfQuestions,
          mode: "pdf",
          pdfProposal: pdfProposal,
          focusTopics: pdfAdvanced.focusTopics || undefined,
          quizIntent: pdfAdvanced.quizIntent || undefined,
          difficultyLevel: pdfAdvanced.difficultyLevel || undefined,
          targetAudiencePdf: pdfAdvanced.targetAudiencePdf || undefined,
          tone: pdfAdvanced.tone || undefined,
          leadTemperature: pdfAdvanced.leadTemperature || undefined,
        };
      }

      // Chamar edge function para gerar quiz com Gemini
      const { data, error } = await supabase.functions.invoke('generate-quiz-ai', {
        body: requestBody
      });

      if (error) {
        console.error('AI generation error:', error);
        
        if (error.message?.includes('429')) {
          toast.error(t('components.aiGenerator.limitReached', { used: '', limit: '' }));
          return;
        }
        
        if (error.message?.includes('403')) {
          toast.error(t('components.aiGenerator.aiNotAvailable'));
          return;
        }

        if (error.message?.includes('Rate limit')) {
          toast.error(t('components.aiGenerator.rateLimitExceeded'));
          return;
        }

        throw error;
      }

      // ✅ Verificar se a resposta contém erro de limite (status 429 retorna como data)
      if (data?.error) {
        console.error('AI generation data error:', data);
        
        if (data.error === 'Monthly AI generation limit reached') {
          toast.error(t('components.aiGenerator.limitReached', { used: data.used, limit: data.limit }), {
            description: t('components.aiGenerator.limitDesc'),
            duration: 8000,
          });
          return;
        }

        if (data.error === 'AI generation not available in your plan') {
          toast.error(t('components.aiGenerator.aiNotAvailable'), {
            description: t('components.aiGenerator.upgradeToUnlock'),
          });
          return;
        }

        throw new Error(data.error);
      }

      // ✅ NORMALIZAÇÃO CRÍTICA: Garantir formato correto do JSON da IA
      const rawData = data;
      console.log('[AIQuizGenerator] Raw AI response:', JSON.stringify(rawData, null, 2));
      
      const quizData: GeneratedQuizData = {
        title: rawData.title || 'Quiz Gerado por IA',
        description: rawData.description || '',
        questions: (rawData.questions || []).map((q: any, idx: number) => {
          // Normalizar answer_format (fallback para single_choice)
          let answerFormat: 'single_choice' | 'multiple_choice' | 'yes_no' = 'single_choice';
          if (q.answer_format === 'multiple_choice') answerFormat = 'multiple_choice';
          else if (q.answer_format === 'yes_no') answerFormat = 'yes_no';
          
          // Normalizar options (converter objetos para strings se necessário)
          let normalizedOptions: string[] = [];
          if (Array.isArray(q.options)) {
            normalizedOptions = q.options.map((opt: any) => {
              if (typeof opt === 'string') return opt;
              if (opt && typeof opt === 'object' && opt.text) return opt.text;
              return String(opt);
            }).filter((opt: string) => opt && opt.trim() !== '');
          }
          
          // Fallback para opções se vazio
          if (normalizedOptions.length < 2) {
            if (answerFormat === 'yes_no') {
              normalizedOptions = ['Sim', 'Não'];
            } else {
              normalizedOptions = ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'];
              console.warn(`[AIQuizGenerator] Pergunta ${idx + 1} sem opções válidas, usando fallback`);
            }
          }
          
          console.log(`[AIQuizGenerator] Pergunta ${idx + 1}: format=${answerFormat}, options=${normalizedOptions.length}`);
          
          return {
            question_text: q.question_text || `Pergunta ${idx + 1}`,
            answer_format: answerFormat,
            options: normalizedOptions,
            aiSuggestions: q.aiSuggestions || null,
          };
        }),
      };
      
      console.log('[AIQuizGenerator] Normalized quiz data:', JSON.stringify(quizData, null, 2));

      // Buscar user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Criar quiz no banco
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: quizData.title,
          description: quizData.description,
          question_count: quizData.questions.length,
          template: 'moderno',
          status: 'draft',
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // ✅ VALIDAÇÃO CRÍTICA: Garantir opções mínimas e blocos válidos
      const questionsData = quizData.questions.map((q, index) => {
        // Validar e normalizar opções baseado no tipo de pergunta
        let validatedOptions = q.options || [];
        
        if (q.answer_format === 'yes_no') {
          // yes_no SEMPRE deve ter exatamente ["Sim", "Não"]
          if (validatedOptions.length !== 2 || !validatedOptions.includes('Sim') || !validatedOptions.includes('Não')) {
            console.warn(`[AI Validation] Pergunta ${index + 1} (yes_no) sem opções corretas. Corrigindo...`);
            validatedOptions = ['Sim', 'Não'];
          }
        } else if (q.answer_format === 'single_choice' || q.answer_format === 'multiple_choice') {
          // single_choice/multiple_choice devem ter pelo menos 2 opções
          if (validatedOptions.length < 2) {
            console.error(`[AI Validation] Pergunta ${index + 1} (${q.answer_format}) tem menos de 2 opções:`, validatedOptions);
            toast.error(`Erro: Pergunta "${q.question_text.substring(0, 50)}..." não tem opções válidas`);
            throw new Error(`Pergunta ${index + 1} não tem opções suficientes`);
          }
        }

        // Log de validação bem-sucedida
        console.log(`[AI Validation] ✅ Pergunta ${index + 1}: ${q.answer_format}, ${validatedOptions.length} opções`);

        // 🆕 FASE 4: Garantir que TODAS as perguntas tenham sugestões de IA
        const defaultSuggestions = {
          suggestedMedia: ['image', 'video'],
          additionalBlocks: ['text', 'image', 'video', 'button', 'separator']
        };

        const aiSuggestions = q.aiSuggestions || defaultSuggestions;

        // Criar bloco com opções validadas e sugestões
        // Preservar explanation e correct_answer da IA (modo educacional)
        const rawQuestion = (rawData.questions || [])[index];
        const explanation = rawQuestion?.explanation || undefined;
        const correctAnswer = rawQuestion?.correct_answer || undefined;
        const explanationMode = requestBody.explanationMode || undefined;

        const blocks = [
          {
            id: `block-question-${index}`,
            type: 'question',
            order: 0,
            questionText: q.question_text,
            answerFormat: q.answer_format,
            options: validatedOptions,
            aiSuggestions: aiSuggestions,
            ...(explanation && { explanation }),
            ...(correctAnswer && { correct_answer: correctAnswer }),
            ...(explanationMode && { explanationMode }),
          }
        ];

        console.log(`[AI Suggestions] Pergunta ${index + 1}: ${q.aiSuggestions ? 'IA' : 'fallback'} suggestions`);

        return {
          quiz_id: quiz.id,
          order_number: index,
          question_text: q.question_text,
          answer_format: q.answer_format,
          options: validatedOptions,
          blocks: blocks,
          media_type: null,
          media_url: null,
        };
      });

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      // Criar configuração de formulário padrão
      await supabase.from('quiz_form_config').insert({
        quiz_id: quiz.id,
        collection_timing: 'after',
        collect_name: true,
        collect_email: true,
        collect_whatsapp: false,
      });

      // Invalidar queries para atualizar dashboard imediatamente
      queryClient.invalidateQueries({ queryKey: ['recent-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      // Disparar evento GTM por tipo de criação IA (legado + unificado)
      const iaEventMap: Record<string, string> = { form: 'quiz_ia_form', pdf: 'quiz_ia_pdf', educational: 'quiz_ia_edu' };
      pushGTMEvent(iaEventMap[uploadMode] || 'quiz_ia_form', {
        quiz_id: quiz.id,
        questions_count: quizData.questions.length,
        upload_mode: uploadMode,
      });
      // 🎯 Evento unificado para facilitar análise
      pushGTMEvent('ai_generation_used', {
        type: uploadMode === 'educational' ? 'edu' : uploadMode,
        quiz_id: quiz.id,
        questions_count: quizData.questions.length,
      });

      toast.success(t('components.aiGenerator.quizCreated'));
      navigate('/meus-quizzes');

    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error(t('components.aiGenerator.errorGenerating'));
    } finally {
      setIsGenerating(false);
    }
  };

  if (limitsLoading || resourceLimitsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">{t('createQuiz.aiGeneration.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('components.aiGenerator.notAvailableTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {t('components.aiGenerator.notAvailableDesc')}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <Button onClick={() => navigate('/pricing')}>
              {t('components.aiGenerator.seePlans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Criar Quiz com IA</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <CardDescription>
          Use IA para criar um quiz completo: responda perguntas sobre seu produto ou envie um PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Info */}
        <Card className="bg-muted/30 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Gerações de IA usadas este mês</p>
                <p className="text-2xl font-bold text-primary">{used} / {limit === 0 ? "∞" : limit}</p>
              </div>
              <Sparkles className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Mode Tabs — hidden when mode is locked (e.g. Express flow) */}
        <Tabs value={uploadMode} onValueChange={(v) => !lockedMode && setUploadMode(v as "form" | "pdf" | "educational")}>
          {!lockedMode && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form" className="gap-2">
                <FileText className="h-4 w-4" />
                Formulário Guiado
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload de PDF
              </TabsTrigger>
              <TabsTrigger value="educational" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Uso Educacional
              </TabsTrigger>
            </TabsList>
          )}

          {/* Form Mode */}
          <TabsContent value="form" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Campos Básicos Obrigatórios */}
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do Produto/Serviço *</Label>
                <Input
                  id="productName"
                  placeholder="Ex: Consultoria de Marketing Digital"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemSolved">Que Problema Resolve? *</Label>
                <Textarea
                  id="problemSolved"
                  placeholder="Ex: Ajuda empresas a aumentar vendas online através de estratégias digitais"
                  value={formData.problemSolved}
                  onChange={(e) => setFormData({ ...formData, problemSolved: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Público-Alvo *</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Ex: Pequenas e médias empresas que querem crescer online"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredAction">Ação Desejada (opcional)</Label>
                <Input
                  id="desiredAction"
                  placeholder="Ex: Agendar consultoria gratuita"
                  value={formData.desiredAction}
                  onChange={(e) => setFormData({ ...formData, desiredAction: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfQuestions">{t('components.aiGenerator.numberOfQuestions')}</Label>
                <Input
                  id="numberOfQuestions"
                  type="number"
                  min="3"
                  max={maxQuestions}
                  value={formData.numberOfQuestions}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, numberOfQuestions: value });
                  }}
                  onBlur={() => {
                    const clamped = Math.min(Math.max(formData.numberOfQuestions, 3), maxQuestions);
                    setFormData({ ...formData, numberOfQuestions: clamped });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t('components.aiGenerator.questionRange', { min: 3, max: maxQuestions })}
                </p>
              </div>

              {/* Configurações Avançadas - Form Mode */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Configurações Avançadas
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      🎯 Configure opções avançadas para um quiz mais personalizado e eficaz
                    </p>

                    {/* Quiz Intent (F) */}
                    <div className="space-y-2">
                      <Label htmlFor="quizIntent">Objetivo do Quiz</Label>
                      <p className="text-xs text-muted-foreground">Define o arco persuasivo do funil de perguntas</p>
                      <Select 
                        value={formAdvanced.quizIntent} 
                        onValueChange={(v) => setFormAdvanced({ ...formAdvanced, quizIntent: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o objetivo principal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discover_problem">
                            <div><span className="font-medium">Revelar um Problema</span><span className="text-xs text-muted-foreground ml-1">— Faz o lead perceber uma dor que talvez não reconheça</span></div>
                          </SelectItem>
                          <SelectItem value="amplify_urgency">
                            <div><span className="font-medium">Amplificar Urgência</span><span className="text-xs text-muted-foreground ml-1">— Mostra o custo de não agir agora</span></div>
                          </SelectItem>
                          <SelectItem value="compare_solutions">
                            <div><span className="font-medium">Comparar Soluções</span><span className="text-xs text-muted-foreground ml-1">— Apresenta alternativas e critérios de escolha</span></div>
                          </SelectItem>
                          <SelectItem value="validate_need">
                            <div><span className="font-medium">Validar Necessidade</span><span className="text-xs text-muted-foreground ml-1">— Confirma o cenário e a gravidade do problema</span></div>
                          </SelectItem>
                          <SelectItem value="overcome_objections">
                            <div><span className="font-medium">Quebrar Objeções</span><span className="text-xs text-muted-foreground ml-1">— Antecipa barreiras e crenças limitantes</span></div>
                          </SelectItem>
                          <SelectItem value="drive_to_checkout">
                            <div><span className="font-medium">Conduzir ao Checkout</span><span className="text-xs text-muted-foreground ml-1">— Foca em decisão, prontidão e próximo passo</span></div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        placeholder="Ex: Acme Corp"
                        value={formAdvanced.companyName}
                        onChange={(e) => setFormAdvanced({ ...formAdvanced, companyName: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Personaliza o tom do quiz com a identidade da marca</p>
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                      <Label htmlFor="industry">Setor/Indústria</Label>
                      <Select 
                        value={formAdvanced.industry} 
                        onValueChange={(v) => setFormAdvanced({ ...formAdvanced, industry: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saas">SaaS / Software</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="education">Educação / Cursos</SelectItem>
                          <SelectItem value="health">Saúde / Bem-estar</SelectItem>
                          <SelectItem value="finance">Finanças / Investimentos</SelectItem>
                          <SelectItem value="real_estate">Imobiliário</SelectItem>
                          <SelectItem value="marketing">Marketing / Agências</SelectItem>
                          <SelectItem value="consulting">Consultoria</SelectItem>
                          <SelectItem value="food">Alimentação</SelectItem>
                          <SelectItem value="fashion">Moda / Vestuário</SelectItem>
                          <SelectItem value="tech">Tecnologia</SelectItem>
                          <SelectItem value="services">Serviços Gerais</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone */}
                    <div className="space-y-2">
                      <Label htmlFor="tone">Tom de Voz</Label>
                      <Select 
                        value={formAdvanced.tone} 
                        onValueChange={(v) => setFormAdvanced({ ...formAdvanced, tone: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Profissional — Sério e corporativo</SelectItem>
                          <SelectItem value="casual">Casual — Amigável e próximo</SelectItem>
                          <SelectItem value="technical">Técnico — Denso em termos da área</SelectItem>
                          <SelectItem value="playful">Divertido — Leve e descontraído</SelectItem>
                          <SelectItem value="persuasive">Persuasivo — Direto e convincente</SelectItem>
                          <SelectItem value="empathetic">Empático — Acolhedor e compreensivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lead Temperature (G) */}
                    <div className="space-y-2">
                      <Label htmlFor="leadTemperature">Temperatura do Lead</Label>
                      <Select 
                        value={formAdvanced.leadTemperature} 
                        onValueChange={(v) => setFormAdvanced({ ...formAdvanced, leadTemperature: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Em que estágio está o lead?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cold">Frio — Ainda não sabe que tem um problema (foco em educação)</SelectItem>
                          <SelectItem value="warm">Morno — Sabe do problema, mas não decidiu (foco em comparação)</SelectItem>
                          <SelectItem value="hot">Quente — Quer resolver agora (foco em decisão e ação)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Define a profundidade e pressão do funil de perguntas</p>
                    </div>

                    {/* Result Profiles */}
                    <div className="space-y-2">
                      <Label htmlFor="resultProfiles">Perfis de Resultado</Label>
                      <Textarea
                        id="resultProfiles"
                        placeholder="Ex: Iniciante, Intermediário, Avançado&#10;ou&#10;Perfil A (precisa do produto X), Perfil B (precisa do produto Y)"
                        value={formAdvanced.resultProfiles}
                        onChange={(e) => setFormAdvanced({ ...formAdvanced, resultProfiles: e.target.value })}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">Liste os perfis de resultado separados por vírgula ou linha</p>
                    </div>

                    {/* CTA Text */}
                    <div className="space-y-2">
                      <Label htmlFor="ctaText">Texto do CTA Final</Label>
                      <Input
                        id="ctaText"
                        placeholder="Ex: Quero minha consultoria gratuita!"
                        value={formAdvanced.ctaText}
                        onChange={(e) => setFormAdvanced({ ...formAdvanced, ctaText: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Call-to-action que aparecerá no resultado</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>

          {/* Educational Mode */}
          <TabsContent value="educational" className="space-y-4 mt-4">
            <div className="space-y-4">
              <Alert className="border-primary/30 bg-primary/5">
                <GraduationCap className="h-4 w-4" />
                <AlertDescription>
                  🎓 Crie quizzes educacionais para fixação de conteúdo, avaliação de conhecimento e preparação para provas. Foco 100% pedagógico.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="eduSubject">Disciplina/Matéria *</Label>
                <Input
                  id="eduSubject"
                  placeholder="Ex: Matemática, História do Brasil, Biologia"
                  value={educationalSettings.subject}
                  onChange={(e) => setEducationalSettings({ ...educationalSettings, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eduTopic">Conteúdo/Tema *</Label>
                <Textarea
                  id="eduTopic"
                  placeholder="Ex: Equações de 2º grau, Revolução Francesa, Fotossíntese"
                  value={educationalSettings.topic}
                  onChange={(e) => setEducationalSettings({ ...educationalSettings, topic: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nível de Ensino</Label>
                  <Select
                    value={educationalSettings.educationLevel}
                    onValueChange={(v) => setEducationalSettings({ ...educationalSettings, educationLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamental">Fundamental</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="superior">Superior</SelectItem>
                      <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                      <SelectItem value="livre">Livre / Autodidata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Objetivo Educacional</Label>
                  <Select
                    value={educationalSettings.educationalGoal}
                    onValueChange={(v) => setEducationalSettings({ ...educationalSettings, educationalGoal: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revisao">Revisão de conteúdo</SelectItem>
                      <SelectItem value="diagnostica">Avaliação diagnóstica</SelectItem>
                      <SelectItem value="fixacao">Fixação de conceitos</SelectItem>
                      <SelectItem value="prova">Preparação para prova</SelectItem>
                      <SelectItem value="autoestudo">Autoestudo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nível de Dificuldade</Label>
                  <Select
                    value={educationalSettings.difficultyLevel}
                    onValueChange={(v) => setEducationalSettings({ ...educationalSettings, difficultyLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a dificuldade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                      <SelectItem value="mixed">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eduNumberOfQuestions">{t('components.aiGenerator.numberOfQuestions')}</Label>
                  <Input
                    id="eduNumberOfQuestions"
                    type="number"
                    min="3"
                    max={maxQuestions}
                    value={formData.numberOfQuestions}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, numberOfQuestions: value });
                    }}
                    onBlur={() => {
                      const clamped = Math.min(Math.max(formData.numberOfQuestions, 3), maxQuestions);
                      setFormData({ ...formData, numberOfQuestions: clamped });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('components.aiGenerator.questionRange', { min: 3, max: maxQuestions })}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/20">
                  <Checkbox
                    id="includeExplanations"
                    checked={educationalSettings.includeExplanations}
                    onCheckedChange={(checked) => setEducationalSettings({ ...educationalSettings, includeExplanations: !!checked })}
                  />
                  <Label htmlFor="includeExplanations" className="text-sm cursor-pointer">
                    Incluir explicação para cada alternativa (gabarito comentado)
                  </Label>
                </div>

                {educationalSettings.includeExplanations && (
                  <div className="space-y-2 pl-6">
                    <Label>Quando exibir o gabarito?</Label>
                    <Select
                      value={educationalSettings.explanationMode}
                      onValueChange={(v) => setEducationalSettings({ ...educationalSettings, explanationMode: v as 'per_question' | 'end_of_quiz' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_question">Mostrar a cada pergunta</SelectItem>
                        <SelectItem value="end_of_quiz">Mostrar tudo ao final do quiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {educationalSettings.explanationMode === 'per_question'
                        ? '💡 O aluno verá a explicação logo após responder cada questão'
                        : '📋 O aluno verá todas as explicações e seu desempenho ao final do quiz'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* PDF Upload Mode */}
          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Proposta do Quiz - Select antes do upload */}
              <div className="space-y-2">
                <Label>Proposta do Quiz</Label>
                <Select
                  value={pdfProposal}
                  onValueChange={(v) => setPdfProposal(v as 'infoprodutor' | 'gestor_trafego' | 'educational')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a proposta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infoprodutor">Infoprodutor — Ideal para vender cursos, e-books e mentorias. Conduz o lead a perceber que precisa do seu produto.</SelectItem>
                    <SelectItem value="gestor_trafego">Gestor de Tráfego — Segmenta sua audiência por perfil e intenção de compra. Ideal para campanhas pagas.</SelectItem>
                    <SelectItem value="educational">Uso Educacional — Para professores e formadores. Foco em fixação de conteúdo e avaliação.</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define como a IA interpretará o conteúdo do PDF para criar as perguntas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfUpload">Upload de PDF *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <Input
                    id="pdfUpload"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={isParsingPdf}
                    className="hidden"
                  />
                  <label htmlFor="pdfUpload" className="cursor-pointer">
                    {isParsingPdf ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Processando PDF...</p>
                      </div>
                    ) : pdfFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <p className="text-sm font-medium">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground">Clique para trocar o arquivo</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Clique para enviar PDF</p>
                        <p className="text-xs text-muted-foreground">Máximo 20MB, primeiras 50 páginas</p>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  📄 A IA extrairá o conteúdo do PDF e criará um quiz baseado nas informações do documento
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfNumberOfQuestions">{t('components.aiGenerator.numberOfQuestions')}</Label>
                <Input
                  id="pdfNumberOfQuestions"
                  type="number"
                  min="3"
                  max={maxQuestions}
                  value={formData.numberOfQuestions}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, numberOfQuestions: value });
                  }}
                  onBlur={() => {
                    const clamped = Math.min(Math.max(formData.numberOfQuestions, 3), maxQuestions);
                    setFormData({ ...formData, numberOfQuestions: clamped });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {t('components.aiGenerator.questionRange', { min: 3, max: maxQuestions })}
                </p>
              </div>

              {/* Configurações Avançadas - PDF Mode */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" type="button">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Configurações Avançadas
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      🎯 Configure opções avançadas para personalizar a geração baseada no PDF
                    </p>

                    {/* Focus Topics */}
                    <div className="space-y-2">
                      <Label htmlFor="focusTopics">Tópicos a Focar</Label>
                      <Textarea
                        id="focusTopics"
                        placeholder="Ex: Cap. 3 sobre vendas, seção de benefícios, FAQ"
                        value={pdfAdvanced.focusTopics}
                        onChange={(e) => setPdfAdvanced({ ...pdfAdvanced, focusTopics: e.target.value })}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">Especifique partes do PDF para a IA focar</p>
                    </div>

                    {/* Quiz Intent (D) */}
                    <div className="space-y-2">
                      <Label htmlFor="pdfQuizIntent">Objetivo do Quiz</Label>
                      <p className="text-xs text-muted-foreground">Define como a IA conduzirá as perguntas baseadas no conteúdo do seu documento</p>
                      <Select 
                        value={pdfAdvanced.quizIntent} 
                        onValueChange={(v) => setPdfAdvanced({ ...pdfAdvanced, quizIntent: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o objetivo principal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discover_problem">
                            <div><span className="font-medium">Revelar um Problema</span><span className="text-xs text-muted-foreground ml-1">— Faz o lead perceber uma dor</span></div>
                          </SelectItem>
                          <SelectItem value="amplify_urgency">
                            <div><span className="font-medium">Amplificar Urgência</span><span className="text-xs text-muted-foreground ml-1">— Mostra o custo de não agir</span></div>
                          </SelectItem>
                          <SelectItem value="compare_solutions">
                            <div><span className="font-medium">Comparar Soluções</span><span className="text-xs text-muted-foreground ml-1">— Alternativas e critérios</span></div>
                          </SelectItem>
                          <SelectItem value="validate_need">
                            <div><span className="font-medium">Validar Necessidade</span><span className="text-xs text-muted-foreground ml-1">— Confirma cenário e gravidade</span></div>
                          </SelectItem>
                          <SelectItem value="overcome_objections">
                            <div><span className="font-medium">Quebrar Objeções</span><span className="text-xs text-muted-foreground ml-1">— Antecipa barreiras</span></div>
                          </SelectItem>
                          <SelectItem value="drive_to_checkout">
                            <div><span className="font-medium">Conduzir ao Checkout</span><span className="text-xs text-muted-foreground ml-1">— Decisão e próximo passo</span></div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Difficulty Level / Profundidade (A) */}
                    <div className="space-y-2">
                      <Label htmlFor="difficultyLevel">
                        {pdfProposal === 'educational' ? 'Nível de Dificuldade' : 'Profundidade das Perguntas'}
                      </Label>
                      <Select 
                        value={pdfAdvanced.difficultyLevel} 
                        onValueChange={(v) => setPdfAdvanced({ ...pdfAdvanced, difficultyLevel: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={pdfProposal === 'educational' ? 'Selecione o nível' : 'Selecione a profundidade'} />
                        </SelectTrigger>
                        <SelectContent>
                          {pdfProposal === 'educational' ? (
                            <>
                              <SelectItem value="easy">Fácil — Conceitos básicos</SelectItem>
                              <SelectItem value="medium">Médio — Aplicação prática</SelectItem>
                              <SelectItem value="hard">Difícil — Análise profunda</SelectItem>
                              <SelectItem value="mixed">Misto — Variado</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="easy">Simples e direto — Perguntas rápidas e objetivas</SelectItem>
                              <SelectItem value="medium">Equilibrado — Profundidade moderada</SelectItem>
                              <SelectItem value="hard">Detalhado e analítico — Raciocínio mais elaborado</SelectItem>
                              <SelectItem value="mixed">Variado — Mistura de níveis</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tone (B/E) - novo campo PDF */}
                    {pdfProposal !== 'educational' && (
                      <div className="space-y-2">
                        <Label htmlFor="pdfTone">Tom de Voz</Label>
                        <Select 
                          value={pdfAdvanced.tone} 
                          onValueChange={(v) => setPdfAdvanced({ ...pdfAdvanced, tone: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tom" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Profissional — Sério e corporativo</SelectItem>
                            <SelectItem value="casual">Casual — Amigável e próximo</SelectItem>
                            <SelectItem value="technical">Técnico — Denso em termos da área</SelectItem>
                            <SelectItem value="playful">Divertido — Leve e descontraído</SelectItem>
                            <SelectItem value="persuasive">Persuasivo — Direto e convincente</SelectItem>
                            <SelectItem value="empathetic">Empático — Acolhedor e compreensivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Lead Temperature (B) - novo campo PDF */}
                    {pdfProposal !== 'educational' && (
                      <div className="space-y-2">
                        <Label htmlFor="pdfLeadTemperature">Temperatura do Lead</Label>
                        <Select 
                          value={pdfAdvanced.leadTemperature} 
                          onValueChange={(v) => setPdfAdvanced({ ...pdfAdvanced, leadTemperature: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Em que estágio está o lead?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cold">Frio — Ainda não sabe que tem um problema</SelectItem>
                            <SelectItem value="warm">Morno — Sabe do problema, mas não decidiu</SelectItem>
                            <SelectItem value="hot">Quente — Quer resolver agora</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Define a profundidade e pressão do funil</p>
                      </div>
                    )}

                    {/* Target Audience PDF */}
                    <div className="space-y-2">
                      <Label htmlFor="targetAudiencePdf">Público-Alvo</Label>
                      <Input
                        id="targetAudiencePdf"
                        placeholder="Ex: Alunos do curso de marketing"
                        value={pdfAdvanced.targetAudiencePdf}
                        onChange={(e) => setPdfAdvanced({ ...pdfAdvanced, targetAudiencePdf: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Adapta linguagem, exemplos e dores ao perfil do respondente</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateQuiz} 
          disabled={isGenerating || formData.numberOfQuestions < 3 || (uploadMode === "pdf" && !pdfFile) || (uploadMode === "educational" && (!educationalSettings.subject || !educationalSettings.topic))}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Gerando Quiz com IA...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Gerar Quiz com IA
            </>
          )}
        </Button>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              💡 A IA criará todas as perguntas e fornecerá sugestões estratégicas de onde adicionar 
              imagens, vídeos, separadores e outros elementos para maximizar a conversão.
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
