import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CONSENT_STORAGE_KEY = 'mq_cookie_consent';

interface GlobalTrackingSettings {
  gtm_container_id: string | null;
  facebook_pixel_id: string | null;
  require_cookie_consent: boolean;
}

// Normalize GTM ID: trim, uppercase, validate format
const normalizeGTM = (id: string | null): string | null => {
  if (!id) return null;
  const normalized = id.trim().toUpperCase();
  // Validate format: GTM-XXXXXXX (7-10 alphanumeric chars)
  const GTM_REGEX = /^GTM-[A-Z0-9]{7,10}$/;
  return GTM_REGEX.test(normalized) ? normalized : null;
};

// Normalize Facebook Pixel ID: trim, validate format
const normalizePixel = (id: string | null): string | null => {
  if (!id) return null;
  const normalized = id.trim();
  // Validate format: 15-16 digits only
  const PIXEL_REGEX = /^[0-9]{15,16}$/;
  return PIXEL_REGEX.test(normalized) ? normalized : null;
};

export const useGlobalTracking = () => {
  const [settings, setSettings] = useState<GlobalTrackingSettings>({
    gtm_container_id: null,
    facebook_pixel_id: null,
    require_cookie_consent: true,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadGlobalSettings();
  }, []);

  const loadGlobalSettings = async () => {
    console.log('🔍 [GTM] Starting to load global tracking settings...');
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['gtm_container_id', 'facebook_pixel_id', 'require_cookie_consent']);

      console.log('🔍 [GTM] Query response:', { data, error });

      if (error) throw error;

      const gtmSetting = data?.find(s => s.setting_key === 'gtm_container_id');
      const pixelSetting = data?.find(s => s.setting_key === 'facebook_pixel_id');
      const consentSetting = data?.find(s => s.setting_key === 'require_cookie_consent');

      console.log('🔍 [GTM] Raw GTM setting:', gtmSetting?.setting_value);
      console.log('🔍 [GTM] Raw Pixel setting:', pixelSetting?.setting_value);
      console.log('🔍 [GTM] Raw Consent setting:', consentSetting?.setting_value);

      const normalizedGTM = normalizeGTM(gtmSetting?.setting_value || null);
      const normalizedPixel = normalizePixel(pixelSetting?.setting_value || null);
      const requireConsent = consentSetting?.setting_value !== 'false'; // default true

      console.log('🔍 [GTM] Normalized GTM ID:', normalizedGTM);
      console.log('🔍 [GTM] Normalized Pixel ID:', normalizedPixel);
      console.log('🔍 [GTM] Require consent:', requireConsent);

      // Debug: Check regex validation
      if (gtmSetting?.setting_value && !normalizedGTM) {
        console.warn('⚠️ [GTM] GTM ID failed regex validation! Raw:', gtmSetting.setting_value);
        console.warn('⚠️ [GTM] Expected format: GTM-XXXXXXX (7-10 alphanumeric chars)');
      }

      setSettings({
        gtm_container_id: normalizedGTM,
        facebook_pixel_id: normalizedPixel,
        require_cookie_consent: requireConsent,
      });

      setLoaded(true);
      console.log('✅ [GTM] Global tracking settings loaded successfully');
    } catch (error) {
      console.error('❌ [GTM] Error loading global tracking settings:', error);
      setLoaded(true);
    }
  };

  // Check if consent is given (or not required)
  const checkConsent = (type: 'analytics' | 'marketing'): boolean => {
    // If consent not required, always return true
    if (!settings.require_cookie_consent) {
      console.log(`🚀 [GTM] Consent not required (admin config) - ${type} allowed`);
      return true;
    }

    // Check localStorage for user consent
    const consentStr = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consentStr) {
      console.log(`⏸️ [GTM] Waiting for user consent (${type})`);
      return false;
    }

    try {
      const consent = JSON.parse(consentStr);
      if (!consent[type]) {
        console.log(`⏸️ [GTM] User did not consent to ${type}`);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // Inject GTM script globally (once) - ONLY if user consented to analytics (or consent not required)
  useEffect(() => {
    if (!loaded || !settings.gtm_container_id) return;

    // Check consent
    if (!checkConsent('analytics')) return;

    // Check if already injected
    const gtmExists = document.getElementById('global-gtm-script');
    if (gtmExists) return;

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];

    // Inject GTM script
    const gtmScript = document.createElement('script');
    gtmScript.id = 'global-gtm-script';
    gtmScript.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${settings.gtm_container_id}');
    `;
    document.head.appendChild(gtmScript);

    // GTM noscript
    const gtmNoscript = document.createElement('noscript');
    gtmNoscript.id = 'global-gtm-noscript';
    gtmNoscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${settings.gtm_container_id}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(gtmNoscript, document.body.firstChild);

    console.log('✅ Global GTM loaded:', settings.gtm_container_id);

    return () => {
      // Cleanup on unmount (optional, usually we don't unmount App)
      const script = document.getElementById('global-gtm-script');
      const noscript = document.getElementById('global-gtm-noscript');
      if (script) script.remove();
      if (noscript) noscript.remove();
    };
  }, [loaded, settings.gtm_container_id, settings.require_cookie_consent]);

  // Inject Facebook Pixel globally (once) - ONLY if user consented to marketing (or consent not required)
  useEffect(() => {
    if (!loaded || !settings.facebook_pixel_id) return;

    // Check consent
    if (!checkConsent('marketing')) return;

    // Check if already injected
    if ((window as any).fbq) return;

    const fbScript = document.createElement('script');
    fbScript.id = 'global-fb-pixel-script';
    fbScript.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${settings.facebook_pixel_id}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(fbScript);

    // Noscript fallback
    const fbNoscript = document.createElement('noscript');
    fbNoscript.id = 'global-fb-pixel-noscript';
    const fbImg = document.createElement('img');
    fbImg.height = 1;
    fbImg.width = 1;
    fbImg.style.display = 'none';
    fbImg.src = `https://www.facebook.com/tr?id=${settings.facebook_pixel_id}&ev=PageView&noscript=1`;
    fbNoscript.appendChild(fbImg);
    document.body.appendChild(fbNoscript);

    console.log('✅ Global Facebook Pixel loaded:', settings.facebook_pixel_id);

    return () => {
      const script = document.getElementById('global-fb-pixel-script');
      const noscript = document.getElementById('global-fb-pixel-noscript');
      if (script) script.remove();
      if (noscript) noscript.remove();
    };
  }, [loaded, settings.facebook_pixel_id, settings.require_cookie_consent]);

  return { settings, loaded };
};
