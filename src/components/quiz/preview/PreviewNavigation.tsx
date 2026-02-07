import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PreviewNavigationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  isAnswered: boolean;
  nextButtonText?: string;
  onPrevious: () => void;
  onNext: () => void;
}

export const PreviewNavigation = ({
  currentQuestionIndex,
  totalQuestions,
  isAnswered,
  nextButtonText,
  onPrevious,
  onNext
}: PreviewNavigationProps) => {
  const { t } = useTranslation();
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;

  return (
    <div className="flex justify-between gap-2 pt-2">
      <Button 
        size="sm" 
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestionIndex === 0}
      >
        <ArrowLeft className="h-3 w-3 mr-1" />
        {t('preview.previous', 'Anterior')}
      </Button>
      
      {!isLastQuestion ? (
        <Button 
          size="sm"
          onClick={onNext}
          disabled={!isAnswered}
        >
          {nextButtonText || t('preview.next', 'Próxima')}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      ) : (
        <Button size="sm" onClick={onNext} disabled={!isAnswered}>
          <Check className="h-3 w-3 mr-1" />
          {t('preview.finish', 'Finalizar')}
        </Button>
      )}
    </div>
  );
};
