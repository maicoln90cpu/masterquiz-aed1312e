import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuizViewState } from '../useQuizViewState';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

vi.mock('@/hooks/useRateLimit', () => ({
  useRateLimit: () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true })
  })
}));

vi.mock('@/hooks/useABTest', () => ({
  useABTest: () => ({
    variant: null,
    markConversion: vi.fn()
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
        })
      })
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}));

vi.mock('@/lib/ipCache', () => ({
  fetchIPWithCache: vi.fn().mockResolvedValue('127.0.0.1')
}));

const mockQuiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'A test quiz',
  template: 'moderno',
  is_public: true,
  status: 'active',
  user_id: 'user-1',
  question_count: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockQuestions = [
  {
    id: 'q1',
    quiz_id: 'quiz-1',
    question_text: 'Question 1',
    order_number: 0,
    answer_format: 'single_choice',
    blocks: [
      {
        id: 'block-1',
        type: 'question',
        order: 0,
        questionText: 'Question 1',
        answerFormat: 'single_choice',
        options: ['Option A', 'Option B'],
        scores: [10, 5]
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'q2',
    quiz_id: 'quiz-1',
    question_text: 'Question 2',
    order_number: 1,
    answer_format: 'single_choice',
    blocks: [
      {
        id: 'block-2',
        type: 'question',
        order: 0,
        questionText: 'Question 2',
        answerFormat: 'single_choice',
        options: ['Option C', 'Option D'],
        scores: [15, 20]
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockResults = [
  {
    id: 'result-1',
    quiz_id: 'quiz-1',
    result_text: 'Great job!',
    condition_type: 'score_range',
    min_score: 0,
    max_score: 20,
    order_number: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const mockFormConfig = {
  id: 'config-1',
  quiz_id: 'quiz-1',
  collect_name: true,
  collect_email: true,
  collect_whatsapp: false,
  collection_timing: 'after' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('useQuizViewState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with preview data when provided', () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: mockQuestions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        company: 'test-company',
        previewMode: true,
        previewData
      })
    );

    expect(result.current.quiz).toEqual(mockQuiz);
    expect(result.current.questions).toEqual(mockQuestions);
    expect(result.current.loading).toBe(false);
  });

  it('should handle answer selection', () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: mockQuestions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        previewMode: true,
        previewData
      })
    );

    act(() => {
      result.current.handleAnswer('q1', 'Option A');
    });

    expect(result.current.answers['q1']).toBe('Option A');
  });

  it('should calculate score when answering questions', () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: mockQuestions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        previewMode: true,
        previewData
      })
    );

    act(() => {
      result.current.handleAnswer('q1', 'Option A');
    });

    // Score should be 10 for Option A
    expect(result.current.totalScore).toBe(10);
  });

  it('should navigate between steps', async () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: mockQuestions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        previewMode: true,
        previewData
      })
    );

    expect(result.current.currentStep).toBe(0);

    await act(async () => {
      await result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should filter visible questions based on conditions', () => {
    const questionsWithConditions = [
      ...mockQuestions,
      {
        id: 'q3',
        quiz_id: 'quiz-1',
        question_text: 'Conditional Question',
        order_number: 2,
        answer_format: 'single_choice',
        conditions: {
          logic: 'and',
          rules: [{ questionId: 'q1', operator: 'equals', value: 'Option B' }]
        },
        blocks: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const previewData = {
      quiz: mockQuiz as any,
      questions: questionsWithConditions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        previewMode: true,
        previewData
      })
    );

    // Initially, conditional question should not be visible (q1 not answered)
    expect(result.current.visibleQuestions.length).toBe(2);

    // Answer q1 with Option B (which matches condition)
    act(() => {
      result.current.handleAnswer('q1', 'Option B');
    });

    // Now conditional question should be visible
    expect(result.current.visibleQuestions.length).toBe(3);
  });

  it('should update form data', () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: mockQuestions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        previewMode: true,
        previewData
      })
    );

    act(() => {
      result.current.setFormData({ name: 'John', email: 'john@example.com' });
    });

    expect(result.current.formData.name).toBe('John');
    expect(result.current.formData.email).toBe('john@example.com');
  });

  it('should handle language change', () => {
    const previewData = {
      quiz: mockQuiz as any,
      questions: mockQuestions as any,
      results: mockResults as any,
      formConfig: mockFormConfig as any,
      customFields: [],
      ownerProfile: null
    };

    const { result } = renderHook(() =>
      useQuizViewState({
        slug: 'test-quiz',
        previewMode: true,
        previewData
      })
    );

    expect(result.current.selectedLanguage).toBe('pt');

    act(() => {
      result.current.setSelectedLanguage('en');
    });

    expect(result.current.selectedLanguage).toBe('en');
  });
});
