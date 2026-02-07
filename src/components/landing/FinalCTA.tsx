import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const FinalCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        cta_location: 'final_cta',
        cta_text: 'start_free_final'
      });
    }
    navigate('/login');
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80" />
      
      <div className="container relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="space-y-8 landing-animate">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
              <Rocket className="h-16 w-16 text-white" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white">
            {t('landing.finalCTA.title')}
          </h2>

          <p className="text-xl text-white/90">
            {t('landing.finalCTA.subtitle')}
          </p>

          <div>
            <Button
              size="lg"
              onClick={handleCTA}
              className="bg-white text-primary hover:bg-white/90 text-xl px-8 py-6 group shadow-2xl"
            >
              {t('landing.finalCTA.cta')}
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 pt-6 text-white/90">
            <span className="flex items-center gap-2">
              ✅ {t('landing.finalCTA.trust1')}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              ✅ {t('landing.finalCTA.trust2')}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              ✅ {t('landing.finalCTA.trust3')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
