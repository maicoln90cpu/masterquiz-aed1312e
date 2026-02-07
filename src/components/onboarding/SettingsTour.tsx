import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

interface SettingsTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const SettingsTour = ({ onComplete, onSkip }: SettingsTourProps) => {
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
          updateOnboardingStep('settings_tour_completed', true);
          onComplete?.();
        } else {
          onSkip?.();
        }
        driverObj.destroy();
      },
      steps: [
        {
          element: '#settings-tabs',
          popover: {
            title: t('onboarding.settingsTour.tabs.title', '⚙️ Abas de Configuração'),
            description: t('onboarding.settingsTour.tabs.desc', 'Navegue entre Perfil, Integrações, Plano e Privacidade para configurar sua conta.'),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#settings-profile',
          popover: {
            title: t('onboarding.settingsTour.profile.title', '👤 Dados do Perfil'),
            description: t('onboarding.settingsTour.profile.desc', 'Configure seu nome, WhatsApp e URL personalizada para seus quizzes.'),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#settings-slug',
          popover: {
            title: t('onboarding.settingsTour.slug.title', '🔗 URL Personalizada'),
            description: t('onboarding.settingsTour.slug.desc', 'Defina um slug único para ter URLs personalizadas: masterquiz.com.br/sua-empresa/quiz'),
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#settings-tracking',
          popover: {
            title: t('onboarding.settingsTour.tracking.title', '📊 Tracking e Pixels'),
            description: t('onboarding.settingsTour.tracking.desc', 'Configure Facebook Pixel e Google Tag Manager para rastrear conversões dos seus quizzes.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#settings-plan',
          popover: {
            title: t('onboarding.settingsTour.plan.title', '💎 Seu Plano'),
            description: t('onboarding.settingsTour.plan.desc', 'Veja os limites do seu plano atual e faça upgrade para desbloquear mais recursos.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#settings-notifications',
          popover: {
            title: t('onboarding.settingsTour.notifications.title', '🔔 Notificações'),
            description: t('onboarding.settingsTour.notifications.desc', 'Configure quando você quer receber alertas sobre novos leads e relatórios.'),
            side: 'top',
            align: 'start',
          },
        },
        {
          popover: {
            title: t('onboarding.settingsTour.complete.title', '✅ Configurações Dominadas!'),
            description: t('onboarding.settingsTour.complete.desc', 'Sua conta está configurada! Lembre-se de salvar alterações antes de sair.'),
          },
        },
      ],
    });

    driverObj.drive();
  }, [t, updateOnboardingStep, onComplete, onSkip]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!status.settings_tour_completed) {
        startTour();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [startTour, status.settings_tour_completed]);

  return null;
};
