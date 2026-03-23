import { useTranslation } from "react-i18next";

interface Question {
  id: string;
  question_text: string;
  order_number: number;
  blocks?: any[];
}

interface ResponseAnswersListProps {
  answers: Record<string, any>;
  questions?: Question[];
}

/**
 * Formata as respostas do quiz em uma lista numerada legível
 * Substitui a exibição de JSON bruto por texto formatado
 */
const formatAnswer = (answer: any): string => {
  if (answer === null || answer === undefined) return '-';
  if (Array.isArray(answer)) {
    return answer.join(', ');
  }
  if (typeof answer === 'object') {
    return JSON.stringify(answer);
  }
  return String(answer);
};

/** Extrai texto real da pergunta dos blocos, fazendo strip de HTML */
const getQuestionLabel = (question: Question): string => {
  if (Array.isArray(question.blocks)) {
    const qBlock = question.blocks.find((b: any) => b.type === 'question');
    if (qBlock?.questionText) {
      const clean = qBlock.questionText.replace(/<[^>]*>/g, '').trim();
      if (clean) return clean;
    }
    // Also check for textInput blocks (short_text fields)
    const textBlock = question.blocks.find((b: any) => b.type === 'textInput');
    if (textBlock?.label) {
      const clean = String(textBlock.label).replace(/<[^>]*>/g, '').trim();
      if (clean) return clean;
    }
  }
  return question.question_text;
};

/** Identifica se a pergunta é um slide informativo sem resposta esperada */
const isInfoSlide = (question: Question): boolean => {
  if (!Array.isArray(question.blocks)) return false;
  const hasQuestion = question.blocks.some((b: any) => b.type === 'question');
  const hasTextInput = question.blocks.some((b: any) => b.type === 'textInput');
  return !hasQuestion && !hasTextInput;
};

export function ResponseAnswersList({ answers, questions }: ResponseAnswersListProps) {
  const { t } = useTranslation();

  // Se não temos perguntas, mostrar fallback simples
  if (!questions || questions.length === 0) {
    const entries = Object.entries(answers || {});
    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted-foreground italic">
          {t('responses.noAnswers', 'Nenhuma resposta registrada')}
        </p>
      );
    }
    
    return (
      <div className="space-y-3">
        {entries.map(([_, value], index) => (
          <div key={index} className="border-l-2 border-primary/30 pl-4 py-1">
            <p className="text-sm font-medium text-muted-foreground">
              {t('responses.questionNumber', 'Pergunta')} {index + 1}
            </p>
            <p className="text-base mt-1 flex items-start gap-2">
              <span className="text-primary shrink-0">►</span>
              <span className="break-words">{formatAnswer(value)}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Filtrar slides informativos e ordenar por order_number
  const answerableQuestions = [...questions]
    .sort((a, b) => a.order_number - b.order_number)
    .filter(q => !isInfoSlide(q));
  
  let questionIndex = 0;

  return (
    <div className="space-y-3">
      {answerableQuestions.map((question) => {
        const answer = answers?.[question.id];
        const hasAnswer = answer !== null && answer !== undefined;
        questionIndex++;
        
        const label = getQuestionLabel(question);
        const displayLabel = label.length > 100 ? label.slice(0, 100) + '...' : label;
        
        return (
          <div 
            key={question.id} 
            className="border-l-2 border-primary/30 pl-4 py-1"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {questionIndex}. {displayLabel}
            </p>
            <p className="text-base mt-1 flex items-start gap-2">
              <span className="text-primary shrink-0">►</span>
              <span className={`break-words ${!hasAnswer ? 'text-muted-foreground italic' : ''}`}>
                {hasAnswer 
                  ? formatAnswer(answer) 
                  : t('responses.notAnswered', 'Não respondida')}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
