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

// Fallback content for instant render (no loading state) - PARADIGMA AUTO-CONVENCIMENTO
const FALLBACK_CONTENT = {
  hero_badge: "Funis de Auto-Convencimento",
  hero_headline_main: "Transforme Visitantes em Compradores Antes do Checkout",
  hero_headline_sub: "Com Perguntas que Convencem",
  hero_subheadline: "Crie funis onde perguntas estratégicas revelam dores ocultas, criam consciência e conduzem seu lead a decidir sozinho que precisa da sua solução.",
  hero_bullet_1: "Faça seu lead reconhecer que precisa de você",
  hero_bullet_2: "Perguntas que revelam dores e criam urgência",
  hero_bullet_3: "Leads que chegam ao CTA já convencidos",
  hero_bullet_4: "Analytics de consciência em tempo real",
  hero_bullet_5: "IA que gera funis de auto-convencimento",
  hero_cta_primary: "Começar Grátis",
  hero_cta_secondary: "Ver Demonstração",
  hero_trust_1: "Dados protegidos",
  hero_trust_2: "Sem cartão de crédito",
  hero_trust_3: "Cancele quando quiser",
};

export const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentBlocks, setCurrentBlocks] = useState<string[]>(["Texto", "Título", "Botão"]);
  const [isVisible, setIsVisible] = useState(false);
  
  // CMS content with instant fallback
  const { getContent, isLoading: isLoadingContent } = useLandingContent();
  
  // A/B Testing for CTA
  const { 
    getContentForElement, 
    getVariantForElement, 
    getTestByElement, 
    trackConversion,
  } = useLandingABTest('hero_cta');

  // Trigger animations after mount
  useEffect(() => {
    // Small delay to ensure CSS is ready
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Get A/B test content for CTA
  const abTestContent = getContentForElement('hero_cta');
  const abVariant = getVariantForElement('hero_cta');
  const abTest = getTestByElement('hero_cta');

  // Helper to get content with instant fallback
  const c = (key: keyof typeof FALLBACK_CONTENT, i18nKey: string) => {
    const dbValue = getContent(key);
    if (dbValue && dbValue.trim() !== '') return dbValue;
    // Use fallback first, then i18n (avoids loading state)
    return FALLBACK_CONTENT[key] || t(i18nKey);
  };

  // Get CTA text - prioritize A/B test, then CMS, then fallback
  const getCtaText = () => {
    if (abTestContent?.text) return abTestContent.text;
    return c('hero_cta_primary', 'landing.hero.ctaPrimary');
  };

  const handleGetStarted = () => {
    // Track A/B conversion if test is active
    if (abTest) {
      trackConversion({ testId: abTest.id, conversionType: 'cta_click' });
    }
    
    // GTM Event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        cta_location: 'hero',
        cta_text: 'start_free',
        ab_variant: abVariant || 'none'
      });
    }
    navigate('/login');
  };

  const handleDemo = () => {
    // GTM Event
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'cta_click',
        cta_location: 'hero',
        cta_text: 'view_demo'
      });
    }
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get CTA style from A/B test
  const getCtaStyle = () => {
    if (abTestContent?.style === 'gradient') {
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
                  {c('hero_headline_main', 'landing.hero.headlineMain')}
                </span>
              </h1>
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                  {c('hero_headline_sub', 'landing.hero.headlineSub')}
                </span>
              </p>
            </div>

            {/* Subheadline */}
            <p
              className={`text-body-lg text-muted-foreground transition-all duration-500 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
            >
              {c('hero_subheadline', 'landing.hero.subheadline')}
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
                {getCtaText()}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-smooth" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDemo}
                className="text-lg group hover-scale-sm"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-smooth" />
                {c('hero_cta_secondary', 'landing.hero.ctaSecondary')}
              </Button>
            </div>

            {/* Trust Badges */}
            <div
              className={`flex flex-wrap items-center gap-4 pt-4 text-caption text-muted-foreground transition-all duration-500 delay-600 ${
                isVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="flex items-center gap-2">
                🔒 {c('hero_trust_1', 'landing.hero.trust1')}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{c('hero_trust_2', 'landing.hero.trust2')}</span>
              <span className="hidden sm:inline">•</span>
              <span>{c('hero_trust_3', 'landing.hero.trust3')}</span>
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