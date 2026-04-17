import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LandingQuizDemo } from "./LandingQuizDemo";
import { BlockIndicators } from "./BlockIndicators";
import { useLandingContent } from "@/hooks/useLandingContent";
import { useLandingABTest } from "@/hooks/useLandingABTest";
import { useLandingCopy } from "@/hooks/useLandingCopy";
import { useSiteMode } from "@/hooks/useSiteMode";
import { pushGTMEvent } from "@/lib/gtmLogger";

// Fallback content for instant render (no loading state) - PARADIGMA AUTO-CONVENCIMENTO
const FALLBACK_CONTENT = {
  hero_badge: "Quizzes que qualificam leads",
  hero_headline_main: "Transforme cliques em decisões antes do checkout",
  hero_headline_sub: "Com quizzes que qualificam",
  hero_subheadline: "Crie quizzes que fazem o lead perceber o problema, se qualificar sozinho e chegar pronto para comprar — sem empurrar oferta.",
  hero_bullet_1: "Crie um quiz estratégico sem código",
  hero_bullet_2: "Faça o lead se autoqualificar enquanto responde",
  hero_bullet_3: "Direcione cada perfil para a oferta certa",
  hero_bullet_4: "Veja quem está pronto para comprar (e quem não está)",
  hero_bullet_5: "Templates prontos para começar em minutos",
  hero_cta_primary: "Criar quiz grátis",
  hero_cta_secondary: "Ver como funciona",
  hero_trust_1: "Sem cartão de crédito",
  hero_trust_2: "Leva menos de 10 minutos",
  hero_trust_3: "Cancele quando quiser",
};

export const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentBlocks, setCurrentBlocks] = useState<string[]>(["Texto", "Título", "Botão"]);
  const [isVisible, setIsVisible] = useState(false);
  
  // CMS content with instant fallback
  const { getContent, isLoading: isLoadingContent } = useLandingContent();
  const { isModeB } = useSiteMode();

  // Helper centralizado: respeita prioridade A/B ativo > landing_content > fallback
  const { getCopy, getActiveVariantContent } = useLandingCopy();

  // A/B Testing — apenas para tracking de conversão (texto vem do helper)
  const { getTestByElement, trackConversion } = useLandingABTest('hero_cta');

  // Trigger animations after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Testes (para tracking de conversão no clique)
  const heroCtaTest = getTestByElement('hero_cta'); // legado
  const ctaPrimaryTest = getTestByElement('hero_cta_primary');
  const ctaSecondaryTest = getTestByElement('hero_cta_secondary');

  // Variante ativa do CTA primário (para pegar o `style`)
  const ctaPrimaryVariant =
    getActiveVariantContent('hero_cta_primary') ||
    getActiveVariantContent('hero_cta');

  // Helper antigo para bullets/badge/trust (sem A/B test associado)
  const c = (key: keyof typeof FALLBACK_CONTENT, i18nKey: string) => {
    const dbValue = getContent(key);
    if (dbValue && dbValue.trim() !== '') return dbValue;
    return FALLBACK_CONTENT[key] || t(i18nKey);
  };

  // CTAs com prioridade unificada
  const ctaPrimaryText = isModeB
    ? 'Escolher meu plano'
    : getCopy('hero_cta_primary', 'hero_cta_primary', FALLBACK_CONTENT.hero_cta_primary);

  const ctaSecondaryText = isModeB
    ? 'Ver planos'
    : getCopy('hero_cta_secondary', 'hero_cta_secondary', FALLBACK_CONTENT.hero_cta_secondary);

  // Headline e subheadline com prioridade unificada
  const headlineText = getCopy('hero_headline', 'hero_headline_main', FALLBACK_CONTENT.hero_headline_main);
  const subheadlineText = getCopy('hero_subheadline', 'hero_subheadline', FALLBACK_CONTENT.hero_subheadline);
  // A headline secundária só aparece quando NÃO há A/B ativo de headline
  // (evita duplicar mensagem quando o teste sobrescreve a principal).
  const showHeadlineSub = !getActiveVariantContent('hero_headline');

  const handleGetStarted = () => {
    if (heroCtaTest?.is_active) {
      trackConversion({ testId: heroCtaTest.id, conversionType: 'cta_click' });
    }
    if (ctaPrimaryTest?.is_active) {
      trackConversion({ testId: ctaPrimaryTest.id, conversionType: 'cta_click' });
    }
    pushGTMEvent('cta_click', {
      cta_location: 'hero',
      cta_text: 'start_free',
    });
    navigate(isModeB ? '/precos' : '/login');
  };

  const handleDemo = () => {
    if (ctaSecondaryTest?.is_active) {
      trackConversion({ testId: ctaSecondaryTest.id, conversionType: 'cta_click' });
    }
    pushGTMEvent('cta_click', {
      cta_location: 'hero',
      cta_text: 'view_demo',
    });
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Estilo do CTA vem da variante ativa (se houver)
  const getCtaStyle = () => {
    if (ctaPrimaryVariant?.style === 'gradient') {
      return 'bg-gradient-to-r from-primary to-accent text-primary-foreground';
    }
    return '';
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden section-spacing-hero">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      <div className="container relative z-10 max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-[45%_55%] gap-responsive items-center">
          {/* Left Column: Content - CSS animations instead of framer-motion */}
          <div
            className={`space-y-6 transition-all duration-700 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            {/* Badge */}
            <div
              className={`transition-all duration-500 delay-100 ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-4 py-2 animate-pulse-glow">
                ✨ {c('hero_badge', 'landing.hero.badge')}
              </Badge>
            </div>

            {/* Headline */}
            <div
              className={`space-y-3 transition-all duration-500 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
                  {headlineText}
                </span>
              </h1>
              {showHeadlineSub && (
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                    {c('hero_headline_sub', 'landing.hero.headlineSub')}
                  </span>
                </p>
              )}
            </div>

            {/* Subheadline */}
            <p
              className={`text-body-lg text-muted-foreground transition-all duration-500 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              {subheadlineText}
            </p>

            {/* Bullets */}
            <div
              className={`space-y-3 transition-all duration-500 delay-400 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0 transition-smooth group-hover:scale-110" />
                  <span className="text-foreground">
                    {c(`hero_bullet_${i}` as keyof typeof FALLBACK_CONTENT, `landing.hero.bullet${i}`)}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div
              className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-500 delay-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              <Button
                size="lg"
                onClick={handleGetStarted}
                className={`text-lg group hover-lift hover-glow ${getCtaStyle()}`}
              >
                {ctaPrimaryText}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={isModeB ? () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) : handleDemo}
                className="text-lg group hover-scale-sm"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-smooth" />
                {ctaSecondaryText}
              </Button>
            </div>

            {/* Trust Badges */}
            <div
              className={`flex flex-wrap items-center gap-4 pt-4 text-caption text-muted-foreground transition-all duration-500 delay-600 ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isModeB ? (
                <>
                  <span className="flex items-center gap-2">🛡️ 15 dias de garantia</span>
                  <span className="hidden sm:inline">•</span>
                  <span>⚡ Acesso imediato</span>
                  <span className="hidden sm:inline">•</span>
                  <span>🎯 Suporte prioritário</span>
                </>
              ) : (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>🔒 {c('hero_trust_1', 'landing.hero.trust1')}</span>
                  <span aria-hidden="true">•</span>
                  <span>{c('hero_trust_2', 'landing.hero.trust2')}</span>
                  <span aria-hidden="true">•</span>
                  <span>{c('hero_trust_3', 'landing.hero.trust3')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Demo - Lazy animations */}
          <div
            className={`relative hidden lg:flex items-center justify-center gap-8 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-8'
            }`}
          >
            {/* Block Indicators */}
            <BlockIndicators blocks={currentBlocks} />
            
            {/* Interactive Quiz Demo */}
            <LandingQuizDemo 
              onBlockChange={setCurrentBlocks}
              autoPlay={true}
              autoPlayInterval={5000}
            />
          </div>
        </div>
      </div>
    </section>
  );
};