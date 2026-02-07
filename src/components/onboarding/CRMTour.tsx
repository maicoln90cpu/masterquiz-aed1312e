import { useEffect, useCallback } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '@/hooks/useOnboarding';

interface CRMTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export const CRMTour = ({ onComplete, onSkip }: CRMTourProps) => {
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
        updateOnboardingStep('crm_tour_completed', true);
        if (!driverObj.hasNextStep()) {
          onComplete?.();
        } else {
          onSkip?.();
        }
        driverObj.destroy();
      },
      steps: [
        {
          element: '#crm-stats-cards',
          popover: {
            title: t('onboarding.crmTour.stats.title', '📊 Estatísticas de Leads'),
            description: t('onboarding.crmTour.stats.desc', 'Veja o total de leads, novos leads, convertidos e sua taxa de conversão em tempo real.'),
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#crm-filters',
          popover: {
            title: t('onboarding.crmTour.filters.title', '🔍 Filtros Inteligentes'),
            description: t('onboarding.crmTour.filters.desc', 'Filtre leads por quiz ou status. Encontre rapidamente os leads que você precisa.'),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#crm-kanban',
          popover: {
            title: t('onboarding.crmTour.kanban.title', '📋 Kanban de Leads'),
            description: t('onboarding.crmTour.kanban.desc', 'Organize seus leads em colunas: Novo, Checkout, Negociação, Convertido, Relacionamento ou Perdido.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#crm-kanban',
          popover: {
            title: t('onboarding.crmTour.dragDrop.title', '🖱️ Arrastar e Soltar'),
            description: t('onboarding.crmTour.dragDrop.desc', 'Arraste um card de lead para outra coluna para atualizar seu status automaticamente.'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#crm-export',
          popover: {
            title: t('onboarding.crmTour.export.title', '📥 Exportar para Excel'),
            description: t('onboarding.crmTour.export.desc', 'Exporte todos os seus leads para uma planilha Excel com um clique.'),
            side: 'bottom',
            align: 'end',
          },
        },
        {
          popover: {
            title: t('onboarding.crmTour.complete.title', '🎉 CRM Dominado!'),
            description: t('onboarding.crmTour.complete.desc', 'Você está pronto para gerenciar seus leads! Clique em um lead para ver detalhes e ações.'),
          },
        },
      ],
    });

    driverObj.drive();
  }, [t, updateOnboardingStep, onComplete, onSkip]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!status.crm_tour_completed) {
        startTour();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [startTour, status.crm_tour_completed]);

  return null;
};
