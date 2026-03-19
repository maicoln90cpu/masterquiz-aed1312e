// ✅ FASE 13: Edge-case tests para useQuizState
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn() } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback: string) => fallback }),
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { useQuizState } from '../useQuizState';

describe('useQuizState — edge cases', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const defaultOptions = { isEditMode: false, questionsLimit: 10 };

  // =============================================
  // INITIALIZATION
  // =============================================

  it('deve inicializar com showTemplateSelector=true quando não é editMode', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    expect(result.current.uiState.showTemplateSelector).toBe(true);
    expect(result.current.uiState.isLoadingQuiz).toBe(false);
  });

  it('deve inicializar com isLoadingQuiz=true quando é editMode', () => {
    const { result } = renderHook(() => useQuizState({ isEditMode: true, questionsLimit: 10 }));
    expect(result.current.uiState.showTemplateSelector).toBe(false);
    expect(result.current.uiState.isLoadingQuiz).toBe(true);
  });

  it('questionsLimit deve ser refletido no editorState', () => {
    const { result } = renderHook(() => useQuizState({ isEditMode: false, questionsLimit: 25 }));
    expect(result.current.editorState.questionsLimit).toBe(25);
  });

  // =============================================
  // UPDATE GUARDS (no-op when values unchanged)
  // =============================================

  it('updateUI não deve causar re-render se valores idênticos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    const initialUI = result.current.uiState;
    
    act(() => { result.current.updateUI({ isSaving: false }); }); // já é false
    expect(result.current.uiState).toBe(initialUI); // mesma referência
  });

  it('updateEditor não deve causar re-render se valores idênticos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    const initialEditor = result.current.editorState;
    
    act(() => { result.current.updateEditor({ step: 1 }); }); // já é 1
    expect(result.current.editorState).toBe(initialEditor);
  });

  it('updateAppearance não deve causar re-render se valores idênticos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    const initial = result.current.appearanceState;
    
    act(() => { result.current.updateAppearance({ template: 'moderno' }); }); // default
    expect(result.current.appearanceState).toBe(initial);
  });

  it('updateFormConfig não deve causar re-render se valores idênticos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    const initial = result.current.formConfigState;
    
    act(() => { result.current.updateFormConfig({ collectEmail: false }); });
    expect(result.current.formConfigState).toBe(initial);
  });

  // =============================================
  // STATE MUTATIONS
  // =============================================

  it('updateUI deve atualizar valores diferentes', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    act(() => { result.current.updateUI({ isSaving: true }); });
    expect(result.current.uiState.isSaving).toBe(true);
  });

  it('updateEditor deve atualizar step e currentQuestionIndex', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    act(() => { result.current.updateEditor({ step: 3, currentQuestionIndex: 2 }); });
    expect(result.current.editorState.step).toBe(3);
    expect(result.current.editorState.currentQuestionIndex).toBe(2);
  });

  it('updateAppearance deve atualizar título e template', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    act(() => { result.current.updateAppearance({ title: 'Meu Quiz', template: 'elegante' }); });
    expect(result.current.appearanceState.title).toBe('Meu Quiz');
    expect(result.current.appearanceState.template).toBe('elegante');
  });

  // =============================================
  // INITIALIZE EMPTY QUESTIONS
  // =============================================

  it('initializeEmptyQuestions deve criar N perguntas com IDs únicos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    let questions: ReturnType<typeof result.current.initializeEmptyQuestions>;
    act(() => { questions = result.current.initializeEmptyQuestions(3); });
    
    expect(questions!).toHaveLength(3);
    expect(questions![0].order_number).toBe(0);
    expect(questions![1].order_number).toBe(1);
    expect(questions![2].order_number).toBe(2);
    
    // IDs únicos
    const ids = new Set(questions!.map(q => q.id));
    expect(ids.size).toBe(3);
    
    // Cada pergunta tem 1 block do tipo question
    expect(questions![0].blocks).toHaveLength(1);
    expect(questions![0].blocks![0].type).toBe('question');
  });

  // =============================================
  // HANDLE QUESTION CLICK
  // =============================================

  it('handleQuestionClick deve atualizar índice e step=3', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    act(() => { result.current.handleQuestionClick(5); });
    expect(result.current.editorState.currentQuestionIndex).toBe(5);
    expect(result.current.editorState.step).toBe(3);
  });

  it('handleQuestionClick para mesmo índice com step=3 não deve re-render', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    act(() => { result.current.handleQuestionClick(2); });
    const afterFirst = result.current.editorState;
    
    act(() => { result.current.handleQuestionClick(2); }); // mesmo índice, step já 3
    expect(result.current.editorState).toBe(afterFirst); // mesma referência
  });

  // =============================================
  // CLEAR AND START FRESH
  // =============================================

  it('clearAndStartFresh deve resetar todos os estados', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    // Mudar alguns estados
    act(() => {
      result.current.updateAppearance({ title: 'Changed' });
      result.current.updateEditor({ step: 3, currentQuestionIndex: 5 });
      result.current.updateUI({ isSaving: true });
      result.current.updateFormConfig({ collectEmail: true });
    });
    
    act(() => { result.current.clearAndStartFresh(); });
    
    expect(result.current.appearanceState.title).toBe('');
    expect(result.current.editorState.step).toBe(1);
    expect(result.current.editorState.currentQuestionIndex).toBe(0);
    expect(result.current.formConfigState.collectEmail).toBe(false);
    expect(result.current.questions).toEqual([]);
  });

  // =============================================
  // UNDO/REDO INTEGRATION
  // =============================================

  it('deve expor canUndo/canRedo corretamente', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  // =============================================
  // DEFAULT APPEARANCE VALUES
  // =============================================

  it('deve ter valores default de aparência corretos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    expect(result.current.appearanceState).toEqual({
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
  });

  it('deve ter valores default de formConfig corretos', () => {
    const { result } = renderHook(() => useQuizState(defaultOptions));
    
    expect(result.current.formConfigState).toEqual({
      collectionTiming: 'after',
      collectName: false,
      collectEmail: false,
      collectWhatsapp: false,
      deliveryTiming: 'immediate',
    });
  });
});
