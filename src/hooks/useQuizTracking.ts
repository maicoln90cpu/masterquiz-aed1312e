import { useEffect } from "react";
import { pushGTMEvent } from "@/lib/gtmLogger";
import type { Quiz, Profile } from "@/types/quiz";

interface UseQuizTrackingProps {
  quiz: Quiz | null;
  quizOwnerProfile: Pick<Profile, 'facebook_pixel_id' | 'gtm_container_id'> | null;
}

export function useQuizTracking({ quiz, quizOwnerProfile }: UseQuizTrackingProps) {
  useEffect(() => {
    if (!quizOwnerProfile) return;

    // Initialize dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];

    let pixelInjected = false;
    let gtmInjected = false;

    // Defer tracking script injection to not block interactivity
    const scheduleIdle = (fn: () => void) => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(fn, { timeout: 3000 });
      } else {
        setTimeout(fn, 1500);
      }
    };

    // ✅ BLOCO 1: Facebook Pixel (independente do GTM) — deferred
    const injectPixel = () => {
    if (quizOwnerProfile.facebook_pixel_id) {
      const FB_PIXEL_REGEX = /^[0-9]{15,16}$/;
      if (FB_PIXEL_REGEX.test(quizOwnerProfile.facebook_pixel_id)) {
        // De-duplicação: verificar se o global pixel já tem o mesmo ID
        const globalPixelScript = document.getElementById('global-fb-pixel-script');
        const globalPixelId = globalPixelScript?.textContent?.match(/fbq\('init',\s*'(\d+)'\)/)?.[1];
        const isSameAsGlobal = globalPixelId === quizOwnerProfile.facebook_pixel_id;

        if (!isSameAsGlobal) {
          if (!(window as any).fbq) {
            const fbScript = document.createElement('script');
            fbScript.id = 'quiz-fb-pixel-script';
            fbScript.textContent = `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${quizOwnerProfile.facebook_pixel_id}');
              fbq('track', 'PageView');
            `;
            document.head.appendChild(fbScript);

            const fbNoscript = document.createElement('noscript');
            fbNoscript.id = 'quiz-fb-pixel-noscript';
            const fbImg = document.createElement('img');
            fbImg.height = 1;
            fbImg.width = 1;
            fbImg.style.display = 'none';
            fbImg.src = `https://www.facebook.com/tr?id=${quizOwnerProfile.facebook_pixel_id}&ev=PageView&noscript=1`;
            fbNoscript.appendChild(fbImg);
            document.body.appendChild(fbNoscript);
            pixelInjected = true;
          } else {
            (window as any).fbq('track', 'PageView');
          }

          if ((window as any).fbq) {
            (window as any).fbq('track', 'ViewContent', {
              content_name: quiz?.title || 'Quiz',
              content_ids: [quiz?.id || 'unknown'],
              content_type: 'quiz'
            });
          }
        }
      } else {
        console.error('Invalid Facebook Pixel ID format');
      }
    }
    }; // end injectPixel

    // ✅ BLOCO 2: GTM do Criador (independente do Pixel) — deferred
    const injectGTM = () => {
    const normalizedGTM = quizOwnerProfile.gtm_container_id?.trim().toUpperCase();
    if (normalizedGTM) {
      const GTM_REGEX = /^GTM-[A-Z0-9]{7,10}$/;
      if (GTM_REGEX.test(normalizedGTM)) {
        // De-duplicação de segurança: verificar se GTM global já tem o mesmo ID
        const quizGtmExists = document.getElementById('quiz-gtm-script');
        const globalGtmExists = document.getElementById('global-gtm-script');
        const globalGtmId = globalGtmExists?.textContent?.match(/GTM-[A-Z0-9]{7,10}/)?.[0];
        const isDifferentFromGlobal = globalGtmId !== normalizedGTM;

        if (!quizGtmExists && isDifferentFromGlobal) {
          const gtmScript = document.createElement('script');
          gtmScript.id = 'quiz-gtm-script';
          gtmScript.textContent = `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${normalizedGTM}');
          `;
          document.head.appendChild(gtmScript);

          const gtmNoscript = document.createElement('noscript');
          gtmNoscript.id = 'quiz-gtm-noscript';
          gtmNoscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${normalizedGTM}"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
          document.body.insertBefore(gtmNoscript, document.body.firstChild);
          gtmInjected = true;

          console.log('✅ Quiz-specific GTM loaded:', normalizedGTM);
        }

        // Push quiz_view event
        (window as any).dataLayer.push({
          event: 'quiz_view',
          quiz_id: quiz?.id,
          quiz_title: quiz?.title
        });
      } else {
        console.error('Invalid GTM Container ID format:', normalizedGTM);
      }
    }
    }; // end injectGTM

    // Schedule both injections during idle time
    scheduleIdle(injectPixel);
    scheduleIdle(injectGTM);

    // Cleanup: remover apenas o que foi injetado neste hook
    return () => {
      if (pixelInjected) {
        document.getElementById('quiz-fb-pixel-script')?.remove();
        document.getElementById('quiz-fb-pixel-noscript')?.remove();
      }
      if (gtmInjected) {
        document.getElementById('quiz-gtm-script')?.remove();
        document.getElementById('quiz-gtm-noscript')?.remove();
      }
    };
  }, [quizOwnerProfile, quiz]);

  const trackQuizStart = (quizId: string, quizTitle: string) => {
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'quiz_start',
        quiz_id: quizId,
        quiz_title: quizTitle
      });
    }

    if ((window as any).fbq) {
      (window as any).fbq('trackCustom', 'QuizStart', {
        content_name: quizTitle,
        quiz_id: quizId
      });
    }
  };

  const trackQuizComplete = (quizId: string, quizTitle: string, resultId?: string) => {
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'quiz_complete',
        quiz_id: quizId,
        quiz_title: quizTitle,
        result_id: resultId
      });
    }

    if ((window as any).fbq) {
      (window as any).fbq('trackCustom', 'QuizComplete', {
        content_name: quizTitle,
        quiz_id: quizId,
        result_id: resultId
      });
    }
  };

  const trackLeadCaptured = (quizId: string, quizTitle: string, hasEmail: boolean, hasWhatsapp: boolean, email?: string, name?: string) => {
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'lead_captured',
        quiz_id: quizId,
        quiz_title: quizTitle,
        has_email: hasEmail,
        has_whatsapp: hasWhatsapp,
        lead_email: email || undefined,
        lead_name: name || undefined
      });
    }

    if ((window as any).fbq && (hasEmail || hasWhatsapp)) {
      (window as any).fbq('track', 'Lead', {
        content_name: quizTitle,
        content_category: 'quiz_completion',
        value: 1,
        currency: 'BRL'
      });
    }
  };

  return {
    trackQuizStart,
    trackQuizComplete,
    trackLeadCaptured
  };
}
