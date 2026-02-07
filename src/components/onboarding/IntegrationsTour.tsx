import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

interface IntegrationsTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const IntegrationsTour = ({ onComplete, onSkip }: IntegrationsTourProps) => {
  const { t } = useTranslation();
  const { updateOnboardingStep, status } = useOnboarding();

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} / {{total}}',
      nextBtnText: t('onboarding.next', 'Próximo'),
      prevBtnText: t('onboarding.previous', 'Anterior'),
      doneBtnText: t('onboarding.done', 'Concluir'),
      popoverClass: 'onboarding-popover',
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      animate: true,
      allowClose: true,
      onDestroyStarted: () => {
        if (!driverObj.hasNextStep()) {
          updateOnboardingStep('integrations_tour_completed', true);
          onComplete?.();
        } else {
          onSkip?.();
        }
        driverObj.destroy();
      },
      steps: [
        {
          element: '#integrations-header',
          popover: {
            title: t('onboarding.integrationsTour.header.title', '🔌 Central de Integrações'),
            description: t('onboarding.integrationsTour.header.desc', 'Aqui você conecta seus quizzes com CRMs, email marketing e ferramentas de automação.'),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#integrations-add-button',
          popover: {
            title: t('onboarding.integrationsTour.addButton.title', '➕ Nova Integração'),
            description: t('onboarding.integrationsTour.addButton.desc', 'Clique aqui para adicionar uma nova integração. Suportamos HubSpot, RD Station, Mailchimp, ActiveCampaign e webhooks personalizados.'),
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#integrations-list',
          popover: {
            title: t('onboarding.integrationsTour.list.title', '📋 Suas Integrações'),
            description: t('onboarding.integrationsTour.list.desc', 'Suas integrações ativas aparecem aqui. Você pode ativar/desativar, configurar ou remover cada uma.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#integrations-logs',
          popover: {
            title: t('onboarding.integrationsTour.logs.title', '📊 Logs de Sincronização'),
            description: t('onboarding.integrationsTour.logs.desc', 'Acompanhe o histórico de sincronizações e identifique erros rapidamente.'),
            side: 'left',
            align: 'start',
          },
        },
        {
          popover: {
            title: t('onboarding.integrationsTour.complete.title', '🎯 Integrações Dominadas!'),
            description: t('onboarding.integrationsTour.complete.desc', 'Agora você sabe conectar seus quizzes com outras ferramentas. Automatize seu fluxo de leads!'),
          },
        },
      ],
    });

    driverObj.drive();
  }, [t, updateOnboardingStep, onComplete, onSkip]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!status.integrations_tour_completed) {
        startTour();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [startTour, status.integrations_tour_completed]);

  return null;
};
