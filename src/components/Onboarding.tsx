import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles, Zap, Target, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingProps {
  open: boolean;
  onClose: () => void;
}

export const Onboarding = ({ open, onClose }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateOnboardingStep, status } = useOnboarding();

  const steps = [
    {
      title: t('onboarding.welcome.title', 'Bem-vindo ao MasterQuiz! 🎉'),
      description: t('onboarding.welcome.desc', 'Transforme visitantes em leads qualificados com quizzes inteligentes'),
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {t('onboarding.welcome.intro', 'MasterQuiz ajuda você a criar quizzes interativos que capturam leads com')}
            <strong className="text-primary"> {t('onboarding.welcome.highlight', 'intenção de compra real')}</strong>.
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('onboarding.welcome.feature1.title', 'Criação em minutos')}</p>
                <p className="text-sm text-muted-foreground">{t('onboarding.welcome.feature1.desc', 'Configure seu primeiro quiz em menos de 5 minutos')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('onboarding.welcome.feature2.title', 'Templates prontos')}</p>
                <p className="text-sm text-muted-foreground">{t('onboarding.welcome.feature2.desc', 'Escolha entre modelos otimizados para conversão')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t('onboarding.welcome.feature3.title', 'Analytics em tempo real')}</p>
                <p className="text-sm text-muted-foreground">{t('onboarding.welcome.feature3.desc', 'Acompanhe performance e geração de leads')}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.howItWorks.title', 'Como funciona? ⚡'),
      description: t('onboarding.howItWorks.desc', 'Processo simples em 3 etapas'),
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-1">{t('onboarding.howItWorks.step1.title', 'Escolha um template')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.howItWorks.step1.desc', 'Selecione um modelo pronto ou crie do zero')}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-1">{t('onboarding.howItWorks.step2.title', 'Configure perguntas e resultados')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.howItWorks.step2.desc', 'Personalize aparência, campos de captura e feedbacks')}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-1">{t('onboarding.howItWorks.step3.title', 'Publique e compartilhe')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('onboarding.howItWorks.step3.desc', 'Receba um link único e acompanhe os resultados em tempo real')}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.ready.title', 'Pronto para começar? 🚀'),
      description: t('onboarding.ready.desc', 'Crie seu primeiro quiz agora'),
      icon: Target,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {t('onboarding.ready.intro', 'Vamos criar seu primeiro quiz juntos! Você pode:')}
          </p>
          <div className="grid gap-3">
            <Button variant="default" size="lg" className="w-full justify-start" asChild>
              <a href="/create-quiz?template=descoberta-produto">
                <Sparkles className="mr-2 h-5 w-5" />
                {t('onboarding.ready.option1', 'Usar template "Descoberta de Produto"')}
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full justify-start" asChild>
              <a href="/create-quiz?template=qualificacao-lead">
                <Target className="mr-2 h-5 w-5" />
                {t('onboarding.ready.option2', 'Usar template "Qualificação de Lead"')}
              </a>
            </Button>
            <Button variant="outline" size="lg" className="w-full justify-start" asChild>
              <a href="/create-quiz">
                <Zap className="mr-2 h-5 w-5" />
                {t('onboarding.ready.option3', 'Criar do zero')}
              </a>
            </Button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await updateOnboardingStep('welcome_completed', true);
      onClose();
    }
  };

  const handleSkip = async () => {
    await updateOnboardingStep('welcome_completed', true);
    onClose();
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{currentStepData.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStepData.content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-8'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                <SkipForward className="h-4 w-4 mr-2" />
                {t('onboarding.skip', 'Pular')}
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? t('onboarding.next', 'Próximo') : t('onboarding.start', 'Começar')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
