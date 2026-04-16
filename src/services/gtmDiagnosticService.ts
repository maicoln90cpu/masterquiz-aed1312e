/**
 * Service Layer — GTM Diagnostic
 * Busca GTM ID das configurações e verifica instalação no DOM.
 */
import { supabase } from '@/integrations/supabase/client';

export interface GTMDiagnosticResult {
  step1_configured: boolean | null;
  step2_scriptLoaded: boolean | null;
  step3_dataLayerReady: boolean | null;
  gtmId: string | null;
  error: string | null;
}

/**
 * Step 1: Busca GTM ID configurado no banco (profiles do admin ou system_settings)
 */
export async function fetchGTMId(): Promise<string | null> {
  // Check admin profile for GTM container ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('gtm_container_id')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.gtm_container_id ?? null;
}

/**
 * Step 2: Verifica se o script GTM foi injetado no DOM
 */
export function checkGTMScript(gtmId: string): boolean {
  if (typeof document === 'undefined') return false;
  const scripts = document.querySelectorAll('script[src*="gtm.js"]');
  for (const s of scripts) {
    if ((s as HTMLScriptElement).src.includes(gtmId)) return true;
  }
  // Also check for any gtm script
  return scripts.length > 0;
}

/**
 * Step 3: Verifica se window.dataLayer existe e está populado
 */
export function checkDataLayer(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as Window & { dataLayer?: unknown[] };
  return Array.isArray(w.dataLayer) && w.dataLayer.length > 0;
}

/**
 * Run full diagnostic with retry
 */
export async function runGTMDiagnostic(maxRetries = 3, retryDelayMs = 2000): Promise<GTMDiagnosticResult> {
  let lastResult: GTMDiagnosticResult = {
    step1_configured: null,
    step2_scriptLoaded: null,
    step3_dataLayerReady: null,
    gtmId: null,
    error: null,
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Step 1
      const gtmId = await fetchGTMId();
      lastResult.gtmId = gtmId;
      lastResult.step1_configured = !!gtmId;

      if (!gtmId) {
        lastResult.error = 'GTM ID não configurado no sistema';
        return lastResult;
      }

      // Step 2
      lastResult.step2_scriptLoaded = checkGTMScript(gtmId);

      // Step 3
      lastResult.step3_dataLayerReady = checkDataLayer();

      // If all passed, return immediately
      if (lastResult.step1_configured && lastResult.step2_scriptLoaded && lastResult.step3_dataLayerReady) {
        lastResult.error = null;
        return lastResult;
      }

      // If not all passed and we have retries left, wait
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    } catch (e) {
      lastResult.error = e instanceof Error ? e.message : 'Erro desconhecido';
    }
  }

  return lastResult;
}
