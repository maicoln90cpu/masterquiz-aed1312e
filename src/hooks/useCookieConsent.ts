import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CONSENT_STORAGE_KEY = 'mq_cookie_consent';
const SESSION_ID_KEY = 'mq_session_id';

export interface CookieConsentState {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

interface UseCookieConsentReturn {
  consent: CookieConsentState | null;
  hasConsented: boolean;
  isLoading: boolean;
  acceptAll: () => Promise<void>;
  rejectAll: () => Promise<void>;
  savePreferences: (preferences: Partial<CookieConsentState>) => Promise<void>;
  openPreferences: () => void;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  requireConsent: boolean;
}

// Gera ou recupera session ID para visitantes anônimos
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export const useCookieConsent = (): UseCookieConsentReturn => {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [requireConsent, setRequireConsent] = useState(true);

  // Verificar se o sistema exige consentimento
  useEffect(() => {
    const checkSystemConfig = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'require_cookie_consent')
          .single();
        
        const required = data?.setting_value !== 'false';
        setRequireConsent(required);
        console.log('🍪 [Consent] System requires consent:', required);
        
        // Se não exigir consentimento, não mostrar banner
        if (!required) {
          setShowBanner(false);
          setIsLoading(false);
        }
      } catch (error) {
        // Se erro, assume que exige consentimento (seguro por padrão)
        console.log('🍪 [Consent] Error checking config, defaulting to require consent');
        setRequireConsent(true);
      }
    };
    
    checkSystemConfig();
  }, []);

  // Carregar consentimento do localStorage na inicialização
  useEffect(() => {
    // Só carregar se exigir consentimento
    if (!requireConsent) {
      setIsLoading(false);
      return;
    }

    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CookieConsentState;
          setConsent(parsed);
          setShowBanner(false);
        } else {
          setShowBanner(true);
        }
      } catch (error) {
        console.error('Erro ao carregar consentimento:', error);
        setShowBanner(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, [requireConsent]);

  // Salvar consentimento no localStorage e DB
  const saveConsentToStorage = useCallback(async (newConsent: CookieConsentState) => {
    try {
      // Salvar no localStorage primeiro (mais rápido)
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      setShowBanner(false);

      // Salvar no banco de dados (background)
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      // Usar upsert baseado em session_id ou user_id
      const payload = {
        user_id: user?.id || null,
        session_id: !user ? sessionId : null,
        consent_functional: newConsent.functional,
        consent_analytics: newConsent.analytics,
        consent_marketing: newConsent.marketing,
        user_agent: navigator.userAgent,
      };

      await supabase
        .from('cookie_consents')
        .insert(payload as any);

      console.log('✅ Consentimento de cookies salvo');
    } catch (error) {
      console.error('Erro ao salvar consentimento:', error);
    }
  }, []);

  const acceptAll = useCallback(async () => {
    const newConsent: CookieConsentState = {
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    };
    await saveConsentToStorage(newConsent);
  }, [saveConsentToStorage]);

  const rejectAll = useCallback(async () => {
    const newConsent: CookieConsentState = {
      functional: true, // Funcionais são sempre necessários
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
    await saveConsentToStorage(newConsent);
  }, [saveConsentToStorage]);

  const savePreferences = useCallback(async (preferences: Partial<CookieConsentState>) => {
    const newConsent: CookieConsentState = {
      functional: true, // Sempre true
      analytics: preferences.analytics ?? consent?.analytics ?? false,
      marketing: preferences.marketing ?? consent?.marketing ?? false,
      timestamp: Date.now(),
    };
    await saveConsentToStorage(newConsent);
  }, [consent, saveConsentToStorage]);

  const openPreferences = useCallback(() => {
    if (requireConsent) {
      setShowBanner(true);
    }
  }, [requireConsent]);

  return {
    consent,
    hasConsented: consent !== null,
    isLoading,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    showBanner: requireConsent ? showBanner : false, // Nunca mostrar se não exigir
    setShowBanner,
    requireConsent,
  };
};
