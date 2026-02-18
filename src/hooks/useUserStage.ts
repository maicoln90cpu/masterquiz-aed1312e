import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export type UserStage = 'explorador' | 'construtor' | 'operador';

export type UserIntent =
  | 'lead_capture_launch'
  | 'vsl_conversion'
  | 'paid_traffic'
  | 'offer_validation'
  | 'educational'
  | 'other';

interface StageIntentConfig {
  headline: string;
  ctaLabel: string;
  ctaRoute: string;
  upgradeHint: string | null;
}

export interface UserStageData {
  stage: UserStage;
  intent: UserIntent;
  stageLabel: string;
  stageEmoji: string;
  headline: string;
  upgradeHint: string | null;
  primaryCTA: {
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  /** @deprecated use headline */
  message: string;
  loading: boolean;
}

// ── Matriz 3×6: Estágio × Intenção ──────────────────────────────────
const STAGE_INTENT_MATRIX: Record<UserStage, Record<UserIntent, StageIntentConfig>> = {
  explorador: {
    lead_capture_launch: {
      headline: 'Seu quiz pode aquecer o lead antes do carrinho abrir.',
      ctaLabel: 'Criar quiz de captação',
      ctaRoute: '/create-quiz',
      upgradeHint: null,
    },
    vsl_conversion: {
      headline: 'Filtre curiosos antes de mandar para sua VSL.',
      ctaLabel: 'Criar quiz pré-VSL',
      ctaRoute: '/create-quiz',
      upgradeHint: null,
    },
    paid_traffic: {
      headline: 'Reduza custo por lead antes do checkout.',
      ctaLabel: 'Criar quiz de qualificação',
      ctaRoute: '/create-quiz',
      upgradeHint: null,
    },
    offer_validation: {
      headline: 'Descubra se sua oferta resolve uma dor real.',
      ctaLabel: 'Criar quiz de validação',
      ctaRoute: '/create-quiz',
      upgradeHint: null,
    },
    educational: {
      headline: 'Meça aprendizado antes de avançar conteúdo.',
      ctaLabel: 'Criar quiz avaliativo',
      ctaRoute: '/create-quiz',
      upgradeHint: null,
    },
    other: {
      headline: 'Comece publicando seu primeiro quiz.',
      ctaLabel: 'Criar primeiro quiz',
      ctaRoute: '/create-quiz',
      upgradeHint: null,
    },
  },

  construtor: {
    lead_capture_launch: {
      headline: 'Agora transforme respostas em compradores.',
      ctaLabel: 'Gerar lead de teste',
      ctaRoute: '/crm',
      upgradeHint: 'Remover limite de respostas',
    },
    vsl_conversion: {
      headline: 'Veja quem chega na VSL já convencido.',
      ctaLabel: 'Gerar lead de teste',
      ctaRoute: '/crm',
      upgradeHint: 'Analytics avançado',
    },
    paid_traffic: {
      headline: 'Veja como cada perfil responde ao seu funil.',
      ctaLabel: 'Ver CRM',
      ctaRoute: '/crm',
      upgradeHint: 'Integração pixel/webhook',
    },
    offer_validation: {
      headline: 'Descubra se o padrão confirma sua hipótese.',
      ctaLabel: 'Ver analytics',
      ctaRoute: '/analytics',
      upgradeHint: 'Heatmap / relatórios',
    },
    educational: {
      headline: 'Veja onde seus alunos mais erram.',
      ctaLabel: 'Ver resultados',
      ctaRoute: '/responses',
      upgradeHint: 'Exportação / relatórios',
    },
    other: {
      headline: 'Agora o jogo é transformar respostas em decisão.',
      ctaLabel: 'Gerar lead de teste',
      ctaRoute: '/crm',
      upgradeHint: null,
    },
  },

  operador: {
    lead_capture_launch: {
      headline: 'Hora de aumentar volume sem perder qualificação.',
      ctaLabel: 'Desbloquear mais respostas',
      ctaRoute: '/precos',
      upgradeHint: 'Limite + automação',
    },
    vsl_conversion: {
      headline: 'Ajuste perguntas e aumente taxa antes da VSL.',
      ctaLabel: 'Ativar analytics avançado',
      ctaRoute: '/analytics',
      upgradeHint: 'Métricas completas',
    },
    paid_traffic: {
      headline: 'Conecte seu tráfego ao comportamento real do lead.',
      ctaLabel: 'Ativar integração avançada',
      ctaRoute: '/integrations',
      upgradeHint: 'Pixel, webhook',
    },
    offer_validation: {
      headline: 'Compare hipóteses e valide com dados reais.',
      ctaLabel: 'Criar nova variação',
      ctaRoute: '/meus-quizzes',
      upgradeHint: 'Múltiplos quizzes / A/B',
    },
    educational: {
      headline: 'Transforme seu quiz em ferramenta de avaliação real.',
      ctaLabel: 'Desbloquear relatórios completos',
      ctaRoute: '/precos',
      upgradeHint: 'Exportação + escala',
    },
    other: {
      headline: 'Você já opera um funil. Hora de expandir.',
      ctaLabel: 'Desbloquear recursos Pro',
      ctaRoute: '/precos',
      upgradeHint: null,
    },
  },
};

const STAGE_META: Record<UserStage, { label: string; emoji: string }> = {
  explorador: { label: 'Explorador', emoji: '🧊' },
  construtor: { label: 'Construtor', emoji: '🔥' },
  operador: { label: 'Operador', emoji: '🚀' },
};

/**
 * Deriva a intenção primária a partir do array user_objectives
 */
function deriveIntent(objectives: string[] | null | undefined): UserIntent {
  if (!objectives || objectives.length === 0) return 'other';
  const first = objectives[0];
  const valid: UserIntent[] = [
    'lead_capture_launch',
    'vsl_conversion',
    'paid_traffic',
    'offer_validation',
    'educational',
    'other',
  ];
  return valid.includes(first as UserIntent) ? (first as UserIntent) : 'other';
}

/**
 * Hook para gerenciar o nível PQL do usuário + intenção
 */
export function useUserStage(): UserStageData {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stage, setStage] = useState<UserStage>('explorador');
  const [intent, setIntent] = useState<UserIntent>('other');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStage = async () => {
      if (authLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_stage, user_objectives')
          .eq('id', user.id)
          .single();

        if (profile?.user_stage) {
          setStage(profile.user_stage as UserStage);
        }
        setIntent(deriveIntent(profile?.user_objectives as string[] | null));
      } catch (error) {
        console.error('Error fetching user stage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStage();
  }, [user, authLoading]);

  // Atualizar estágio para operador quando visualizar CRM/Analytics
  const upgradeToOperador = useCallback(async () => {
    if (!user || stage !== 'construtor') return;

    try {
      await supabase
        .from('profiles')
        .update({
          user_stage: 'operador',
          stage_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .eq('user_stage', 'construtor');

      setStage('operador');
    } catch (error) {
      console.error('Error upgrading to operador:', error);
    }
  }, [user, stage]);

  const meta = STAGE_META[stage];
  const config = STAGE_INTENT_MATRIX[stage][intent];

  return {
    stage,
    intent,
    stageLabel: t(`pqlMatrix.stageLabel.${stage}`, meta.label),
    stageEmoji: meta.emoji,
    headline: t(`pqlMatrix.${stage}.${intent}.headline`, config.headline),
    upgradeHint: config.upgradeHint
      ? t(`pqlMatrix.${stage}.${intent}.upgrade`, config.upgradeHint)
      : null,
    message: config.headline, // backward compat
    primaryCTA: {
      label: t(`pqlMatrix.${stage}.${intent}.cta`, config.ctaLabel),
      action: () => navigate(config.ctaRoute),
      variant: 'default',
    },
    loading: loading || authLoading,
  };
}

/**
 * Hook auxiliar para rastrear visualização de páginas
 * e atualizar o estágio automaticamente
 */
export function useTrackPageView(page: 'crm' | 'analytics') {
  const { user } = useAuth();

  useEffect(() => {
    const trackView = async () => {
      if (!user) return;

      const field = page === 'crm' ? 'crm_viewed_at' : 'analytics_viewed_at';

      const { error } = await supabase
        .from('profiles')
        .update({
          [field]: new Date().toISOString(),
          user_stage: 'operador',
          stage_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .is(field, null);

      if (!error) {
        console.log(`🎯 [PQL] Tracked ${page} view, user upgraded to operador`);
      }
    };

    trackView();
  }, [user, page]);
}
