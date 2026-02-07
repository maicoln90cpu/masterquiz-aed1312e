import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

interface AnalyticsTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const AnalyticsTour = ({ onComplete, onSkip }: AnalyticsTourProps) => {
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
        updateOnboardingStep('analytics_tour_completed', true);
        if (!driverObj.hasNextStep()) {
          onComplete?.();
        } else {
          onSkip?.();
        }
        driverObj.destroy();
      },
      steps: [
        {
          element: '#analytics-stats-cards',
          popover: {
            title: t('onboarding.analyticsTour.stats.title', '📊 Métricas Resumidas'),
            description: t('onboarding.analyticsTour.stats.desc', 'Aqui você vê os números mais importantes: visualizações, inícios, conclusões e taxa de conversão.'),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#analytics-filters',
          popover: {
            title: t('onboarding.analyticsTour.filters.title', '🔍 Filtros de Período'),
            description: t('onboarding.analyticsTour.filters.desc', 'Selecione datas personalizadas ou use os períodos rápidos (7, 30 ou 90 dias) para filtrar os dados.'),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#analytics-chart',
          popover: {
            title: t('onboarding.analyticsTour.chart.title', '📈 Gráfico de Evolução'),
            description: t('onboarding.analyticsTour.chart.desc', 'Visualize a evolução das métricas ao longo do tempo. Cada linha representa uma métrica diferente.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#analytics-funnel',
          popover: {
            title: t('onboarding.analyticsTour.funnel.title', '🔄 Funil de Conversão'),
            description: t('onboarding.analyticsTour.funnel.desc', 'Veja exatamente onde os usuários abandonam o quiz. Identifique gargalos e otimize seu funil.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#analytics-export',
          popover: {
            title: t('onboarding.analyticsTour.export.title', '📥 Exportar Relatórios'),
            description: t('onboarding.analyticsTour.export.desc', 'Exporte dados para Excel ou gere relatórios PDF profissionais para compartilhar com seu time.'),
            side: 'bottom',
            align: 'end',
          },
        },
        {
          popover: {
            title: t('onboarding.analyticsTour.complete.title', '🎯 Analytics Dominado!'),
            description: t('onboarding.analyticsTour.complete.desc', 'Agora você sabe usar o Analytics! Acompanhe suas métricas regularmente para otimizar seus quizzes.'),
          },
        },
      ],
    });

    driverObj.drive();
  }, [t, updateOnboardingStep, onComplete, onSkip]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!status.analytics_tour_completed) {
        startTour();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [startTour, status.analytics_tour_completed]);

  return null;
};
