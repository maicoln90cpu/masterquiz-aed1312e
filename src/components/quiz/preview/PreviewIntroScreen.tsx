import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PreviewIntroScreenProps {
  title: string;
  description?: string;
  template?: string;
  logoUrl?: string;
  showLogo?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  questionsCount: number;
  onStart: () => void;
}

export const PreviewIntroScreen = ({
  title,
  description,
  template,
  logoUrl,
  showLogo = true,
  showTitle = true,
  showDescription = true,
  questionsCount,
  onStart
}: PreviewIntroScreenProps) => {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6">
      {showLogo && logoUrl && (
        <img src={logoUrl} alt="Logo" className="h-16 mx-auto" />
      )}
      {showTitle && (
        <h1 className="text-2xl md:text-3xl font-bold">
          {title || t('createQuiz.newQuiz', 'Título do Quiz')}
        </h1>
      )}
      {showDescription && description && (
        <p className="text-muted-foreground text-lg">{description}</p>
      )}
      {template && <Badge variant="outline">{template}</Badge>}
      <div className="pt-4">
        <Button size="lg" onClick={onStart} className="px-8">
          {t('preview.startQuiz', 'Começar Quiz')}
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {questionsCount} {t('preview.questions', 'perguntas')}
      </p>
    </div>
  );
};
