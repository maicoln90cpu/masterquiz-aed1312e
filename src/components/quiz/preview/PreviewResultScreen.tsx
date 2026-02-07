import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { QuizResult } from '@/hooks/useQuizPreviewState';

interface PreviewResultScreenProps {
  result: QuizResult;
  totalScore: number;
  onRestart: () => void;
  onClose?: () => void;
}

export const PreviewResultScreen = ({
  result,
  totalScore,
  onRestart,
  onClose
}: PreviewResultScreenProps) => {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>

      <div className="space-y-2">
        <Badge variant="secondary" className="text-lg px-4 py-1">
          {t('preview.yourScore', 'Sua pontuação')}: {totalScore} {t('preview.points', 'pontos')}
        </Badge>
      </div>

      <div className="space-y-4">
        {result.image_url && (
          <img 
            src={result.image_url} 
            alt="Result" 
            className="max-h-48 mx-auto rounded-lg"
          />
        )}
        <h2 className="text-2xl font-bold whitespace-pre-wrap">{result.result_text}</h2>
      </div>

      {result.button_text && (
        <Button size="lg" className="mt-4">{result.button_text}</Button>
      )}

      <div className="pt-6 border-t">
        <p className="text-sm text-muted-foreground mb-4">
          {t('preview.testComplete', 'Teste completo!')}
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('preview.testAgain', 'Testar Novamente')}
          </Button>
          {onClose && (
            <Button onClick={onClose}>
              {t('preview.backToEditor', 'Voltar ao Editor')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
