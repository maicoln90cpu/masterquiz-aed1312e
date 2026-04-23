import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { appendUTMsToPath } from "@/lib/utmPropagate";

export const UseCaseTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const useCases = [
    {
      id: 'health',
      emoji: '🏃',
      title: t('landing.useCases.health.title'),
      quizName: t('landing.useCases.health.quizName'),
      questions: t('landing.useCases.health.questions'),
      result: t('landing.useCases.health.result'),
    },
    {
      id: 'legal',
      emoji: '⚖️',
      title: t('landing.useCases.legal.title'),
      quizName: t('landing.useCases.legal.quizName'),
      questions: t('landing.useCases.legal.questions'),
      result: t('landing.useCases.legal.result'),
    },
    {
      id: 'lowticket',
      emoji: '💵',
      title: t('landing.useCases.lowticket.title'),
      quizName: t('landing.useCases.lowticket.quizName'),
      questions: t('landing.useCases.lowticket.questions'),
      result: t('landing.useCases.lowticket.result'),
    },
    {
      id: 'consultant',
      emoji: '💼',
      title: t('landing.useCases.consultant.title'),
      quizName: t('landing.useCases.consultant.quizName'),
      questions: t('landing.useCases.consultant.questions'),
      result: t('landing.useCases.consultant.result'),
    },
    {
      id: 'freelancer',
      emoji: '✨',
      title: t('landing.useCases.freelancer.title'),
      quizName: t('landing.useCases.freelancer.quizName'),
      questions: t('landing.useCases.freelancer.questions'),
      result: t('landing.useCases.freelancer.result'),
    },
  ];

  const handleUseTemplate = (useCaseId: string) => {
    pushGTMEvent('template_click', {
      template_type: useCaseId,
      cta_location: 'use_cases',
    });
    navigate(appendUTMsToPath('/login'));
  };

  return (
    <Tabs defaultValue={useCases[0].id} className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
        {useCases.map((useCase) => (
          <TabsTrigger key={useCase.id} value={useCase.id} className="text-sm py-3">
            <span className="mr-2">{useCase.emoji}</span>
            <span className="hidden sm:inline">{useCase.title}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {useCases.map((useCase) => (
        <TabsContent key={useCase.id} value={useCase.id}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <span>{useCase.emoji}</span>
                    {useCase.title}
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {useCase.quizName}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{t('landing.useCases.premiumTemplate')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">{t('landing.useCases.questionsLabel')}</h4>
                <p className="text-muted-foreground">{useCase.questions}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">{t('landing.useCases.resultLabel')}</h4>
                <p className="text-muted-foreground">{useCase.result}</p>
              </div>
              <Button
                onClick={() => handleUseTemplate(useCase.id)}
                className="w-full sm:w-auto"
              >
                {t('landing.useCases.ctaButton')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
};
