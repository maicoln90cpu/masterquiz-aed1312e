import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export type UserStage = 'explorador' | 'construtor' | 'operador';

export interface UserStageData {
  stage: UserStage;
  stageLabel: string;
  stageEmoji: string;
  primaryCTA: {
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  message: string;
  loading: boolean;
}

/**
 * Hook para gerenciar o nível PQL do usuário
 * - Explorador: ainda não publicou nenhum quiz
 * - Construtor: publicou pelo menos 1 quiz
 * - Operador: visualizou CRM ou Analytics
 */
export function useUserStage(): UserStageData {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stage, setStage] = useState<UserStage>('explorador');
  const [loading, setLoading] = useState(true);

  // Carregar estágio do usuário
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
          .select('user_stage')
          .eq('id', user.id)
          .single();

        if (profile?.user_stage) {
          setStage(profile.user_stage as UserStage);
        }
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
          stage_updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .eq('user_stage', 'construtor');

      setStage('operador');
    } catch (error) {
      console.error('Error upgrading to operador:', error);
    }
  }, [user, stage]);

  // Configurações por estágio
  const stageConfig: Record<UserStage, Omit<UserStageData, 'loading'>> = {
    explorador: {
      stage: 'explorador',
      stageLabel: t('userStage.explorador.label', 'Explorador'),
      stageEmoji: '🧊',
      message: t('userStage.explorador.message', 'Seu quiz só gera valor depois de publicado.'),
      primaryCTA: {
        label: t('userStage.explorador.cta', 'Publicar primeiro quiz'),
        action: () => navigate('/create-quiz'),
        variant: 'default'
      }
    },
    construtor: {
      stage: 'construtor',
      stageLabel: t('userStage.construtor.label', 'Construtor'),
      stageEmoji: '🔥',
      message: t('userStage.construtor.message', 'Transforme respostas em decisões.'),
      primaryCTA: {
        label: t('userStage.construtor.cta', 'Ver leads no CRM'),
        action: () => navigate('/crm'),
        variant: 'default'
      }
    },
    operador: {
      stage: 'operador',
      stageLabel: t('userStage.operador.label', 'Operador'),
      stageEmoji: '🚀',
      message: t('userStage.operador.message', 'Hora de escalar seu funil.'),
      primaryCTA: {
        label: t('userStage.operador.cta', 'Desbloquear recursos'),
        action: () => navigate('/precos'),
        variant: 'default'
      }
    }
  };

  return {
    ...stageConfig[stage],
    loading: loading || authLoading
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
      
      // Atualizar apenas se ainda não foi registrado
      const { error } = await supabase
        .from('profiles')
        .update({ 
          [field]: new Date().toISOString(),
          user_stage: 'operador',
          stage_updated_at: new Date().toISOString()
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
