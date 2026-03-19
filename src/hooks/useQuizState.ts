import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { QuizBlock } from "@/types/blocks";
import { createBlock } from "@/types/blocks";
import type { EditorQuestion } from "@/types/quiz";
import { useHistory } from "@/hooks/useHistory";
import { useUndoRedoShortcuts } from "@/hooks/useUndoRedoShortcuts";

// ============================================
// TIPOS
// ============================================

export interface QuizAppearanceState {
  title: string;
  description: string;
  template: string;
  logoUrl: string;
  showLogo: boolean;
  showTitle: boolean;
  showDescription: boolean;
  showQuestionNumber: boolean;
  showResults: boolean;
  progressStyle: 'bar' | 'counter' | 'none';
}

export interface QuizFormConfigState {
  collectionTiming: string;
  collectName: boolean;
  collectEmail: boolean;
  collectWhatsapp: boolean;
  deliveryTiming: string;
}

export interface QuizEditorState {
  step: number;
  currentQuestionIndex: number;
  questionCount: number;
  questionsLimit: number;
  isPublic: boolean;
  quizId: string | null;
  quizSlug: string;
  abTestActive: boolean;
  selectedBlockIndex: number | null;
}

export interface QuizUIState {
  showTemplateSelector: boolean;
  showAIGenerator: boolean;
  isLoadingQuiz: boolean;
  isSaving: boolean;
  shareDialogOpen: boolean;
  deleteDialogOpen: boolean;
  questionToDelete: number | null;
  showInteractivePreview: boolean;
  resetDialogOpen: boolean;
  showInlinePreview: boolean;
  rightPanelMode: 'preview' | 'steps';
}

// ============================================
// HOOKS
// ============================================

interface UseQuizStateOptions {
  isEditMode: boolean;
  questionsLimit: number;
}

export function useQuizState({ isEditMode, questionsLimit }: UseQuizStateOptions) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // ✅ Ref para prevenir updates durante transições
  const isTransitioningRef = useRef(false);

  // ✅ Estados de UI
  const [uiState, setUIState] = useState<QuizUIState>(() => ({
    showTemplateSelector: !isEditMode,
    showAIGenerator: false,
    isLoadingQuiz: isEditMode,
    isSaving: false,
    shareDialogOpen: false,
    deleteDialogOpen: false,
    questionToDelete: null,
    showInteractivePreview: false,
    resetDialogOpen: false,
    showInlinePreview: true,
    rightPanelMode: 'steps',
  }));

  // ✅ Sincronizar estado quando isEditMode muda (corrige race condition)
  useEffect(() => {
    if (isEditMode) {
      setUIState(prev => ({
        ...prev,
        showTemplateSelector: false,
        isLoadingQuiz: true,
      }));
    }
  }, [isEditMode]);

  // ✅ Estado do editor
  const [editorState, setEditorState] = useState<QuizEditorState>({
    step: 1,
    currentQuestionIndex: 0,
    questionCount: 5,
    questionsLimit,
    isPublic: true,
    quizId: null,
    quizSlug: '',
    abTestActive: false,
    selectedBlockIndex: null,
  });

  // ✅ Estado de aparência
  const [appearanceState, setAppearanceState] = useState<QuizAppearanceState>({
    title: '',
    description: '',
    template: 'moderno',
    logoUrl: '',
    showLogo: true,
    showTitle: true,
    showDescription: true,
    showQuestionNumber: true,
    showResults: true,
    progressStyle: 'counter',
  });

  // ✅ Estado do formulário de coleta
  const [formConfigState, setFormConfigState] = useState<QuizFormConfigState>({
    collectionTiming: 'after',
    collectName: false,
    collectEmail: false,
    collectWhatsapp: false,
    deliveryTiming: 'immediate',
  });

  // ✅ Usar useHistory para questions com Undo/Redo
  const {
    state: questions,
    setState: setQuestionsInternal,
    undo: undoQuestions,
    redo: redoQuestions,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    forceSave: forceSaveHistory,
    clearHistory
  } = useHistory<EditorQuestion[]>([], { maxHistory: 50, debounceMs: 500 });

  // ✅ Wrapper estável para setQuestions que previne updates durante transições
  const setQuestions = useCallback((newQuestions: EditorQuestion[]) => {
    if (isTransitioningRef.current) {
      // Agendar para depois da transição
      setTimeout(() => {
        setQuestionsInternal(newQuestions);
      }, 50);
    } else {
      setQuestionsInternal(newQuestions);
    }
  }, [setQuestionsInternal]);

  // ✅ Atalhos de teclado para Undo/Redo
  const handleUndo = useCallback(() => {
    undoQuestions();
    toast.info(t('editor.undone', 'Ação desfeita'), { duration: 1500 });
  }, [undoQuestions, t]);

  const handleRedo = useCallback(() => {
    redoQuestions();
    toast.info(t('editor.redone', 'Ação refeita'), { duration: 1500 });
  }, [redoQuestions, t]);

  useUndoRedoShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    canUndo,
    canRedo,
    enabled: !uiState.showTemplateSelector && !uiState.showAIGenerator && !uiState.isLoadingQuiz
  });

  // ✅ Helper estável para atualizar UI com guard de transição
  const updateUI = useCallback((updates: Partial<QuizUIState>) => {
    // Marcar início de transição se estiver mudando views principais
    if ('showTemplateSelector' in updates || 'showAIGenerator' in updates || 'isLoadingQuiz' in updates) {
      isTransitioningRef.current = true;
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 100);
    }
    
    setUIState(prev => {
      // ✅ Guard: não atualizar se valores já são iguais
      const hasChanges = Object.entries(updates).some(
        ([key, value]) => prev[key as keyof QuizUIState] !== value
      );
      if (!hasChanges) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // ✅ Helper estável para atualizar editor
  const updateEditor = useCallback((updates: Partial<QuizEditorState>) => {
    setEditorState(prev => {
      const hasChanges = Object.entries(updates).some(
        ([key, value]) => prev[key as keyof QuizEditorState] !== value
      );
      if (!hasChanges) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // ✅ Helper estável para atualizar aparência
  const updateAppearance = useCallback((updates: Partial<QuizAppearanceState>) => {
    setAppearanceState(prev => {
      const hasChanges = Object.entries(updates).some(
        ([key, value]) => prev[key as keyof QuizAppearanceState] !== value
      );
      if (!hasChanges) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // ✅ Helper estável para atualizar form config
  const updateFormConfig = useCallback((updates: Partial<QuizFormConfigState>) => {
    setFormConfigState(prev => {
      const hasChanges = Object.entries(updates).some(
        ([key, value]) => prev[key as keyof QuizFormConfigState] !== value
      );
      if (!hasChanges) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // ✅ Inicializar perguntas vazias
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

  // ✅ Handler para atualização de perguntas (alias estável)
  const handleQuestionsUpdate = useCallback((updatedQuestions: EditorQuestion[]) => {
    setQuestions(updatedQuestions);
  }, [setQuestions]);

  // ✅ Helper para atualizar blocos da pergunta atual (CORRIGIDO: sem chamada duplicada)
  const updateCurrentQuestionBlocks = useCallback((updatedBlocks: QuizBlock[]) => {
    const currentIndex = editorState.currentQuestionIndex;
    
    setQuestionsInternal(prevQuestions => {
      if (!prevQuestions[currentIndex]) return prevQuestions;
      
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentIndex] = {
        ...updatedQuestions[currentIndex],
        blocks: updatedBlocks
      };
      return updatedQuestions;
    });
  }, [editorState.currentQuestionIndex, setQuestionsInternal]);

  // ✅ Handler para click em pergunta
  const handleQuestionClick = useCallback((index: number) => {
    setEditorState(prev => {
      if (prev.currentQuestionIndex === index && prev.step === 3) return prev;
      return {
        ...prev,
        currentQuestionIndex: index,
        step: 3
      };
    });
  }, []);

  // ✅ Limpar estado e começar do zero
  const clearAndStartFresh = useCallback(() => {
    isTransitioningRef.current = true;
    
    setEditorState({
      step: 1,
      currentQuestionIndex: 0,
      questionCount: 5,
      questionsLimit,
      isPublic: true,
      quizId: null,
      quizSlug: '',
      abTestActive: false,
    });
    setAppearanceState({
      title: '',
      description: '',
      template: 'moderno',
      logoUrl: '',
      showLogo: true,
      showTitle: true,
      showDescription: true,
      showQuestionNumber: true,
      showResults: true,
      progressStyle: 'counter',
    });
    setFormConfigState({
      collectionTiming: 'after',
      collectName: false,
      collectEmail: false,
      collectWhatsapp: false,
      deliveryTiming: 'immediate',
    });
    setQuestionsInternal([]);
    clearHistory();
    
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 100);
    
    toast.success(t('createQuiz.clearedState', 'Estado limpo! Começando do zero.'));
  }, [questionsLimit, setQuestionsInternal, clearHistory, t]);

  return {
    // Estados
    uiState,
    editorState,
    appearanceState,
    formConfigState,
    questions,
    
    // Setters agrupados
    updateUI,
    updateEditor,
    updateAppearance,
    updateFormConfig,
    setQuestions,
    
    // Undo/Redo
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    forceSaveHistory,
    clearHistory,
    
    // Handlers
    handleQuestionsUpdate,
    updateCurrentQuestionBlocks,
    handleQuestionClick,
    initializeEmptyQuestions,
    clearAndStartFresh,
  };
}
