import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { createBlock } from "@/types/blocks";
import type { EditorQuestion } from "@/types/quiz";
import type { QuizAppearanceState, QuizFormConfigState } from "./useQuizState";

// ============================================
// TIPOS
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Template = any;

interface UseQuizTemplateSelectionOptions {
  updateUI: (updates: { showTemplateSelector?: boolean; showAIGenerator?: boolean }) => void;
  updateAppearance: (updates: Partial<QuizAppearanceState>) => void;
  updateFormConfig: (updates: Partial<QuizFormConfigState>) => void;
  updateEditor: (updates: { questionCount?: number }) => void;
  setQuestions: (questions: EditorQuestion[]) => void;
}

// ============================================
// HOOK
// ============================================

export function useQuizTemplateSelection({
  updateUI,
  updateAppearance,
  updateFormConfig,
  updateEditor,
  setQuestions,
}: UseQuizTemplateSelectionOptions) {
  const { t } = useTranslation();
  
  // ✅ Guard contra múltiplas chamadas simultâneas
  const isProcessingRef = useRef(false);

  // ✅ Selecionar template com validações robustas
  const handleSelectTemplate = useCallback((template: Template) => {
    // Guard contra chamadas duplicadas
    if (isProcessingRef.current) {
      console.warn('[useQuizTemplateSelection] Already processing template selection');
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      // ✅ Validar estrutura do template
      if (!template?.config) {
        console.error('[useQuizTemplateSelection] Invalid template: missing config');
        toast.error(t('createQuiz.invalidTemplate', 'Template inválido'));
        return;
      }

      // ✅ Fechar seletor primeiro (única atualização de UI)
      updateUI({ showTemplateSelector: false });
      
      // ✅ Atualizar aparência com fallbacks seguros
      updateAppearance({
        title: template.config.title || '',
        description: template.config.description || '',
        template: template.config.template || 'moderno',
      });
      
      // ✅ Atualizar form config com validação e fallbacks
      const formConfig = template.config.formConfig || {};
      updateFormConfig({
        collectName: formConfig.collect_name ?? false,
        collectEmail: formConfig.collect_email ?? false,
        collectWhatsapp: formConfig.collect_whatsapp ?? false,
        collectionTiming: formConfig.collection_timing || 'after',
      });
      
      // ✅ Atualizar contagem de perguntas
      updateEditor({ questionCount: template.config.questionCount || 5 });
      
      // ✅ Processar perguntas com validação robusta
      const templateQuestions = template.config.questions || [];
      const processedQuestions: EditorQuestion[] = templateQuestions.map((q: any, index: number) => ({
        id: q.id || `temp-${Date.now()}-${index}`,
        question_text: q.question_text || q.questionText || '',
        answer_format: (q.answer_format || q.answerFormat || 'single_choice') as 'yes_no' | 'single_choice' | 'multiple_choice' | 'short_text',
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => typeof opt === 'object' && opt?.text ? String(opt.text) : String(opt))
          : [],
        scores: Array.isArray(q.options)
          ? q.options.map((opt: any) => typeof opt === 'object' && typeof opt?.score === 'number' ? opt.score : 0)
          : [],
        order_number: index,
        custom_label: q.custom_label || '',
        blocks: Array.isArray(q.blocks) ? (q.blocks as EditorQuestion['blocks']) : [createBlock('question', 0)]
      }));
      
      setQuestions(processedQuestions);
      toast.success(t('createQuiz.templateLoaded', { name: template.name || 'Template' }));
    } catch (error) {
      console.error('[useQuizTemplateSelection] Error applying template:', error);
      toast.error(t('createQuiz.templateError', 'Erro ao carregar template'));
    } finally {
      // ✅ Liberar lock após processamento
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    }
  }, [updateUI, updateAppearance, updateFormConfig, updateEditor, setQuestions, t]);

  // ✅ Criar do zero com guard
  const handleCreateFromScratch = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    updateUI({ showTemplateSelector: false });
    toast.info(t('createQuiz.createCustom'));
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, [updateUI, t]);

  // ✅ Criar com IA com guard
  const handleCreateWithAI = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    updateUI({ showTemplateSelector: false, showAIGenerator: true });
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, [updateUI]);

  // ✅ Voltar do gerador de IA
  const handleBackFromAI = useCallback(() => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    updateUI({ showAIGenerator: false, showTemplateSelector: true });
    
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 100);
  }, [updateUI]);

  return {
    handleSelectTemplate,
    handleCreateFromScratch,
    handleCreateWithAI,
    handleBackFromAI,
  };
}
