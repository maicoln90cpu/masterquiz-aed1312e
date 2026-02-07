import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizViewQuestion } from '../view/QuizViewQuestion';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'quizView.next': 'Next',
        'quizView.previous': 'Previous',
        'quizView.finish': 'Finish'
      };
      return translations[key] || key;
    }
  })
}));

// Mock QuizBlockPreview
vi.mock('@/components/quiz/QuizBlockPreview', () => ({
  QuizBlockPreview: ({ blocks }: any) => (
    <div data-testid="quiz-block-preview">
      {blocks.map((b: any) => <div key={b.id}>{b.type}</div>)}
    </div>
  )
}));

const mockQuiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: 'Test description',
  template: 'moderno',
  show_question_number: true,
  is_public: true,
  status: 'active' as const,
  user_id: 'user-1',
  question_count: 2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  slug: 'test-quiz',
  logo_url: null,
  facebook_pixel_id: null,
  hide_branding: false,
  show_logo: true,
  show_title: true,
  show_description: true,
  ab_test_active: false
};

const mockQuestion = {
  id: 'q1',
  quiz_id: 'quiz-1',
  question_text: 'What is your favorite color?',
  order_number: 0,
  answer_format: 'single_choice' as const,
  options: [] as any[],
  media_type: null as any,
  media_url: null as any,
  blocks: [
    {
      id: 'block-1',
      type: 'question' as const,
      order: 0,
      questionText: 'What is your favorite color?',
      answerFormat: 'single_choice' as const,
      options: ['Red', 'Blue', 'Green'],
      emojis: ['🔴', '🔵', '🟢'],
      required: true
    }
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
} as any;

describe('QuizViewQuestion', () => {
  const defaultProps = {
    quiz: mockQuiz,
    question: mockQuestion,
    currentStep: 0,
    totalQuestions: 3,
    visibleQuestionsCount: 3,
    answers: {},
    onAnswer: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    isLastQuestion: false,
    showFormAfter: false,
    onSubmit: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render question number when show_question_number is true', () => {
    render(<QuizViewQuestion {...defaultProps} />);
    
    expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
  });

  it('should not render question number when show_question_number is false', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        quiz={{ ...mockQuiz, show_question_number: false }} 
      />
    );
    
    expect(screen.queryByText('Questão 1 de 3')).not.toBeInTheDocument();
  });

  it('should render question text from blocks', () => {
    render(<QuizViewQuestion {...defaultProps} />);
    
    expect(screen.getByText('What is your favorite color?')).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<QuizViewQuestion {...defaultProps} />);
    
    expect(screen.getByText('Red')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
  });

  it('should render emojis for options', () => {
    render(<QuizViewQuestion {...defaultProps} />);
    
    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('🔵')).toBeInTheDocument();
    expect(screen.getByText('🟢')).toBeInTheDocument();
  });

  it('should call onAnswer when option is clicked', () => {
    render(<QuizViewQuestion {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Blue'));
    
    expect(defaultProps.onAnswer).toHaveBeenCalledWith('q1', 'Blue');
  });

  it('should disable next button when required question has no answer', () => {
    render(<QuizViewQuestion {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it('should enable next button when question is answered', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        answers={{ q1: 'Blue' }} 
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();
  });

  it('should call onNext when next button is clicked', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        answers={{ q1: 'Blue' }} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('should not show previous button on first question', () => {
    render(<QuizViewQuestion {...defaultProps} currentStep={0} />);
    
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('should show previous button after first question', () => {
    render(<QuizViewQuestion {...defaultProps} currentStep={1} />);
    
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
  });

  it('should call onPrev when previous button is clicked', () => {
    render(<QuizViewQuestion {...defaultProps} currentStep={1} />);
    
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    
    expect(defaultProps.onPrev).toHaveBeenCalled();
  });

  it('should show finish button on last question', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        isLastQuestion={true}
        answers={{ q1: 'Blue' }}
      />
    );
    
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument();
  });

  it('should call onSubmit when finish is clicked and no form after', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        isLastQuestion={true}
        showFormAfter={false}
        answers={{ q1: 'Blue' }}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('should call onNext when finish is clicked and form after', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        isLastQuestion={true}
        showFormAfter={true}
        answers={{ q1: 'Blue' }}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    
    expect(defaultProps.onNext).toHaveBeenCalled();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should highlight selected option', () => {
    const { container } = render(
      <QuizViewQuestion 
        {...defaultProps} 
        answers={{ q1: 'Blue' }}
      />
    );
    
    // Find the option container that contains "Blue" and has the selected class
    const blueOption = screen.getByText('Blue').closest('div[class*="border-primary"]');
    expect(blueOption).toBeInTheDocument();
  });

  it('should show check icon for selected option', () => {
    render(
      <QuizViewQuestion 
        {...defaultProps} 
        answers={{ q1: 'Blue' }}
      />
    );
    
    // The Check icon should be rendered for the selected option
    const selectedContainer = screen.getByText('Blue').closest('div');
    expect(selectedContainer?.querySelector('svg')).toBeInTheDocument();
  });
});

describe('QuizViewQuestion - Multiple Choice', () => {
  const multipleChoiceQuestion = {
    ...mockQuestion,
    answer_format: 'multiple_choice' as const,
    blocks: [
      {
        id: 'block-1',
        type: 'question' as const,
        order: 0,
        questionText: 'Select all that apply',
        answerFormat: 'multiple_choice',
        options: ['Option 1', 'Option 2', 'Option 3'],
        emojis: [],
        required: true
      }
    ]
  };

  const props = {
    quiz: mockQuiz,
    question: multipleChoiceQuestion,
    currentStep: 0,
    totalQuestions: 1,
    visibleQuestionsCount: 1,
    answers: {},
    onAnswer: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    isLastQuestion: true,
    showFormAfter: false,
    onSubmit: vi.fn()
  };

  it('should handle multiple selections', () => {
    render(<QuizViewQuestion {...props} />);
    
    fireEvent.click(screen.getByText('Option 1'));
    
    expect(props.onAnswer).toHaveBeenCalledWith('q1', ['Option 1']);
  });

  it('should toggle selection on multiple choice', () => {
    render(
      <QuizViewQuestion 
        {...props} 
        answers={{ q1: ['Option 1'] }}
      />
    );
    
    // Click on Option 1 again to deselect
    fireEvent.click(screen.getByText('Option 1'));
    
    expect(props.onAnswer).toHaveBeenCalledWith('q1', []);
  });

  it('should add to selection on multiple choice', () => {
    render(
      <QuizViewQuestion 
        {...props} 
        answers={{ q1: ['Option 1'] }}
      />
    );
    
    fireEvent.click(screen.getByText('Option 2'));
    
    expect(props.onAnswer).toHaveBeenCalledWith('q1', ['Option 1', 'Option 2']);
  });
});

describe('QuizViewQuestion - Short Text', () => {
  const shortTextQuestion = {
    ...mockQuestion,
    answer_format: 'short_text' as const,
    blocks: [
      {
        id: 'block-1',
        type: 'question' as const,
        order: 0,
        questionText: 'What is your name?',
        answerFormat: 'short_text',
        options: [],
        required: true
      }
    ]
  };

  const props = {
    quiz: mockQuiz,
    question: shortTextQuestion,
    currentStep: 0,
    totalQuestions: 1,
    visibleQuestionsCount: 1,
    answers: {},
    onAnswer: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    isLastQuestion: true,
    showFormAfter: false,
    onSubmit: vi.fn()
  };

  it('should render text input for short_text format', () => {
    render(<QuizViewQuestion {...props} />);
    
    expect(screen.getByPlaceholderText('Digite sua resposta...')).toBeInTheDocument();
  });

  it('should call onAnswer when text is entered', () => {
    render(<QuizViewQuestion {...props} />);
    
    const input = screen.getByPlaceholderText('Digite sua resposta...');
    fireEvent.change(input, { target: { value: 'John Doe' } });
    
    expect(props.onAnswer).toHaveBeenCalledWith('q1', 'John Doe');
  });

  it('should disable next when text is empty', () => {
    render(<QuizViewQuestion {...props} />);
    
    expect(screen.getByRole('button', { name: /finish/i })).toBeDisabled();
  });

  it('should enable next when text is provided', () => {
    render(
      <QuizViewQuestion 
        {...props} 
        answers={{ q1: 'John Doe' }}
      />
    );
    
    expect(screen.getByRole('button', { name: /finish/i })).not.toBeDisabled();
  });
});
