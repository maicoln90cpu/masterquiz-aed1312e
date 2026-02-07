import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AB_TEST_COOKIE_PREFIX = 'mq_ab_';

interface Variant {
  id: string;
  variant_name: string;
  variant_letter: string;
  traffic_weight: number;
  is_control: boolean;
}

interface ABTestSession {
  sessionId: string;
  variantId: string | null;
  variant: Variant | null;
  startedAt: Date;
}

interface UseABTestReturn {
  session: ABTestSession | null;
  isLoading: boolean;
  variant: Variant | null;
  markConversion: () => Promise<void>;
}

/**
 * Gera ou recupera visitor ID persistente
 */
const getVisitorId = (): string => {
  const key = 'mq_visitor_id';
  let visitorId = localStorage.getItem(key);
  
  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  
  return visitorId;
};

/**
 * Seleciona variante baseado nos pesos de tráfego
 */
const selectVariant = (variants: Variant[]): Variant => {
  const totalWeight = variants.reduce((sum, v) => sum + v.traffic_weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const variant of variants) {
    random -= variant.traffic_weight;
    if (random <= 0) {
      return variant;
    }
  }
  
  return variants[0]; // Fallback para primeira variante
};

/**
 * Hook para gerenciar A/B Testing em quizzes
 */
export const useABTest = (quizId: string | undefined, abTestActive: boolean = false): UseABTestReturn => {
  const [session, setSession] = useState<ABTestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (!quizId || !abTestActive) {
      setIsLoading(false);
      return;
    }

    initializeSession();
  }, [quizId, abTestActive]);

  const initializeSession = async () => {
    if (!quizId) return;
    
    try {
      const visitorId = getVisitorId();
      const cookieKey = `${AB_TEST_COOKIE_PREFIX}${quizId}`;
      
      // Verificar se já tem sessão para este quiz
      const existingVariantId = sessionStorage.getItem(cookieKey);
      
      if (existingVariantId) {
        // Recuperar variante existente
        const { data: existingVariant } = await supabase
          .from('quiz_variants')
          .select('*')
          .eq('id', existingVariantId)
          .single();
        
        if (existingVariant) {
          setVariant(existingVariant as Variant);
          setSession({
            sessionId: visitorId,
            variantId: existingVariantId,
            variant: existingVariant as Variant,
            startedAt: new Date(),
          });
          setIsLoading(false);
          return;
        }
      }

      // Buscar variantes ativas do quiz
      const { data: variants, error } = await supabase
        .from('quiz_variants')
        .select('*')
        .eq('parent_quiz_id', quizId)
        .eq('is_active', true);

      if (error || !variants || variants.length === 0) {
        setIsLoading(false);
        return;
      }

      // Selecionar variante baseado nos pesos
      const selectedVariant = selectVariant(variants as Variant[]);
      
      // Salvar no sessionStorage para consistência
      sessionStorage.setItem(cookieKey, selectedVariant.id);
      
      // Criar sessão no banco
      await supabase
        .from('ab_test_sessions')
        .insert({
          quiz_id: quizId,
          variant_id: selectedVariant.id,
          visitor_id: visitorId,
          user_agent: navigator.userAgent,
        } as any);

      setVariant(selectedVariant);
      setSession({
        sessionId: visitorId,
        variantId: selectedVariant.id,
        variant: selectedVariant,
        startedAt: new Date(),
      });
      
      console.log(`🧪 A/B Test: Variante ${selectedVariant.variant_letter} selecionada`);
    } catch (error) {
      console.error('Erro ao inicializar A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markConversion = useCallback(async () => {
    if (!session?.variantId || !quizId) return;
    
    try {
      const visitorId = getVisitorId();
      const completedAt = new Date();
      const startedAt = session.startedAt;
      const timeToComplete = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);

      await supabase
        .from('ab_test_sessions')
        .update({
          converted: true,
          completed_at: completedAt.toISOString(),
          time_to_complete_seconds: timeToComplete,
        } as any)
        .eq('quiz_id', quizId)
        .eq('visitor_id', visitorId);

      console.log(`🧪 A/B Test: Conversão registrada para variante ${session.variant?.variant_letter}`);
    } catch (error) {
      console.error('Erro ao registrar conversão:', error);
    }
  }, [session, quizId]);

  return {
    session,
    isLoading,
    variant,
    markConversion,
  };
};
