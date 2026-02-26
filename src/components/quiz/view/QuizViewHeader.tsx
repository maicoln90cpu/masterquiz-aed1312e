import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/types/quiz";

interface QuizViewHeaderProps {
  quiz: Quiz;
  availableLanguages: string[];
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export function QuizViewHeader({
  quiz,
  availableLanguages,
  selectedLanguage,
  onLanguageChange
}: QuizViewHeaderProps) {
  const { t } = useTranslation();

  const showHeader = quiz.show_logo !== false || quiz.show_title !== false || quiz.show_description !== false;

  return (
    <>
      {showHeader && (
        <div className="text-center space-y-4 mb-8">
          {quiz.show_logo !== false && quiz.logo_url && (
            <div className="flex justify-center mb-4">
              <img src={quiz.logo_url} alt="Logo" className="h-24 md:h-32 w-auto object-contain" />
            </div>
          )}
          {quiz.show_title !== false && (
            <h1 className="quiz-title-responsive font-bold">{quiz.title}</h1>
          )}
          {quiz.show_description !== false && quiz.description && (
            <p className="quiz-body-responsive text-muted-foreground">{quiz.description}</p>
          )}
        </div>
      )}

      {availableLanguages.length > 1 && (
        <div className="flex justify-center gap-2 mb-6">
          {availableLanguages.map(lang => {
            const labels: Record<string, string> = {
              pt: t('quizView.languageLabels.pt'),
              en: t('quizView.languageLabels.en'),
              es: t('quizView.languageLabels.es')
            };
            return (
              <Button
                key={lang}
                variant={selectedLanguage === lang ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLanguageChange(lang)}
              >
                {labels[lang] || lang.toUpperCase()}
              </Button>
            );
          })}
        </div>
      )}
    </>
  );
}
