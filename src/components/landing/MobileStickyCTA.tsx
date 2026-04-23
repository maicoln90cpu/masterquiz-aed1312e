import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSiteMode } from "@/hooks/useSiteMode";
import { useLandingCopy } from "@/hooks/useLandingCopy";
import { useLandingABTest } from "@/hooks/useLandingABTest";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { appendUTMsToPath } from "@/lib/utmPropagate";

/**
 * CTA fixo no rodapé do mobile. Aparece após o usuário rolar 30% da página
 * (evita cobrir o hero) e desaparece quando ele chega no rodapé final.
 *
 * Copy: vem do helper `useLandingCopy` — respeita teste A/B `mobile_sticky_cta`
 * quando ativo, senão usa `landing_content.mobile_sticky_cta_text`, senão o
 * fallback hardcoded "Criar quiz grátis".
 */
export const MobileStickyCTA = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isModeB } = useSiteMode();
  const { getCopy } = useLandingCopy();
  const { getTestByElement, trackConversion } = useLandingABTest();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? scrolled / total : 0;
      // Aparece após 15% e some nos últimos 5% (rodapé)
      setShouldShow(pct > 0.15 && pct < 0.95);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  if (!isMobile || !shouldShow) return null;

  const ctaText = getCopy(
    "mobile_sticky_cta",
    "mobile_sticky_cta_text",
    "Criar quiz grátis"
  );

  const handleClick = () => {
    const test = getTestByElement("mobile_sticky_cta");
    if (test?.is_active) {
      trackConversion({ testId: test.id, conversionType: "cta_click" });
    }
    pushGTMEvent("cta_click", {
      cta_location: "mobile_sticky",
      cta_text: ctaText,
    });
    navigate(appendUTMsToPath(isModeB ? "/precos" : "/login"));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg lg:hidden animate-slide-in-up">
      <Button
        size="lg"
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-base group"
      >
        {ctaText}
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-smooth" />
      </Button>
    </div>
  );
};
