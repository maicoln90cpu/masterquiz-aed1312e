import { useTranslation } from "react-i18next";

interface Question {
  id: string;
  question_text: string;
  order_number: number;
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

export function ResponseAnswersList({ answers, questions }: ResponseAnswersListProps) {
  const { t } = useTranslation();

  // Se não temos perguntas, mostrar fallback simples
  if (!questions || questions.length === 0) {
    // Fallback: mostrar as respostas sem os IDs como chave
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

  // Ordenar perguntas por order_number e mapear respostas
  const sortedQuestions = [...questions].sort((a, b) => a.order_number - b.order_number);
  
  return (
    <div className="space-y-3">
      {sortedQuestions.map((question, index) => {
        const answer = answers?.[question.id];
        const hasAnswer = answer !== null && answer !== undefined;
        
        return (
          <div 
            key={question.id} 
            className="border-l-2 border-primary/30 pl-4 py-1"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {index + 1}. {question.question_text.length > 100 
                ? question.question_text.slice(0, 100) + '...' 
                : question.question_text}
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
