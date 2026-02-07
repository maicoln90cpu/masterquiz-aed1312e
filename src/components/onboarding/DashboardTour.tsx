import { useEffect, useCallback, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

interface DashboardTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const DashboardTour = ({ onComplete, onSkip }: DashboardTourProps) => {
  const { t } = useTranslation();
  const { updateOnboardingStep, status } = useOnboarding();
  const tourStartedRef = useRef(false);

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
        // Always mark as completed (whether finished or skipped)
        updateOnboardingStep('dashboard_tour_completed', true);
        if (!driverObj.hasNextStep()) {
          onComplete?.();
        } else {
          onSkip?.();
        }
        driverObj.destroy();
      },
      steps: [
        {
          element: '#dashboard-overview',
          popover: {
            title: t('onboarding.dashboardTour.overview.title', '📊 Visão Geral'),
            description: t('onboarding.dashboardTour.overview.desc', 'Aqui você vê um resumo de todos os seus quizzes, respostas e métricas importantes.'),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#create-quiz-btn',
          popover: {
            title: t('onboarding.dashboardTour.createQuiz.title', '➕ Criar Quiz'),
            description: t('onboarding.dashboardTour.createQuiz.desc', 'Clique aqui para criar um novo quiz. Você pode usar templates prontos ou começar do zero.'),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#seus-quizzes',
          popover: {
            title: t('onboarding.dashboardTour.quizList.title', '📋 Seus Quizzes'),
            description: t('onboarding.dashboardTour.quizList.desc', 'Todos os seus quizzes aparecem aqui. Você pode editar, duplicar, ver respostas e analytics.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '[data-sidebar="menu"]',
          popover: {
            title: t('onboarding.dashboardTour.sidebar.title', '🧭 Navegação'),
            description: t('onboarding.dashboardTour.sidebar.desc', 'Use o menu lateral para acessar CRM, Analytics, Respostas, Webhooks e Configurações.'),
            side: 'right',
            align: 'start',
          },
        },
        {
          popover: {
            title: t('onboarding.dashboardTour.complete.title', '🎉 Pronto!'),
            description: t('onboarding.dashboardTour.complete.desc', 'Você está pronto para começar! Crie seu primeiro quiz e comece a capturar leads qualificados.'),
          },
        },
      ],
    });

    driverObj.drive();
  }, [t, updateOnboardingStep, onComplete, onSkip]);

  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      // Só inicia se:
      // 1. Tour não foi completado no banco
      // 2. Tour não foi iniciado nesta sessão
      if (!status.dashboard_tour_completed && !tourStartedRef.current) {
        tourStartedRef.current = true;
        startTour();
      }
    }, 500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.dashboard_tour_completed]);

  return null;
};
