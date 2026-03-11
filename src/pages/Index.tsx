import { useEffect, useRef, useMemo } from "react";

import { useTranslation } from "react-i18next";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { LogoCarousel } from "@/components/landing/LogoCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandingPlans } from "@/hooks/useLandingPlans";
import { useSiteMode } from "@/hooks/useSiteMode";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
// Lazy loaded components
import { 
  FeatureShowcaseWrapper, 
  PlatformGalleryWrapper, 
  FAQAccordionWrapper,
  FlowDiagramWrapper,
  FinalCTAWrapper,
} from "@/components/lazy/LandingComponents";
import { 
  Sparkles, 
  BarChart3, 
  Users, 
  Zap,
  Target,
  TrendingUp,
  LineChart,
  Layers,
  Globe,
  Briefcase,
  UserCircle,
  Activity,
  Video,
  Calculator,
  GitBranch,
  FlaskConical,
  Code2,
  Flame,
  Music,
  Timer,
  Quote,
  FileText,
  Star,
  Bell
} from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy load below-the-fold components
const PersonaCard = lazy(() => import("@/components/landing/PersonaCard").then(mod => ({ default: mod.PersonaCard })));
const UseCaseTab = lazy(() => import("@/components/landing/UseCaseTab").then(mod => ({ default: mod.UseCaseTab })));
const PricingCard = lazy(() => import("@/components/landing/PricingCard").then(mod => ({ default: mod.PricingCard })));

/** Wrapper: renders children only when near viewport */
const DeferredSection = ({ children, className, id, fallbackHeight = "400px" }: { 
  children: React.ReactNode; className?: string; id?: string; fallbackHeight?: string 
}) => {
  const { ref, isVisible } = useIntersectionObserver(0.01, "200px");
  return (
    <section id={id} className={className} ref={ref}>
      {isVisible ? children : <div style={{ minHeight: fallbackHeight }} />}
    </section>
  );
};

const Index = () => {
  const { t } = useTranslation();
  const { plans: dynamicPlans, isLoading: plansLoading } = useLandingPlans();
  const { isModeB } = useSiteMode();

  useEffect(() => {
    document.title = "MasterQuizz - Quizzes que qualificam leads antes do checkout";
  }, []);

  const personas = [
    {
      icon: Target,
      title: t('landing.personas.agency.title'),
      problem: t('landing.personas.agency.problem'),
      solution: t('landing.personas.agency.solution'),
    },
    {
      icon: TrendingUp,
      title: t('landing.personas.infoproducer.title'),
      problem: t('landing.personas.infoproducer.problem'),
      solution: t('landing.personas.infoproducer.solution'),
    },
    {
      icon: LineChart,
      title: t('landing.personas.traffic_manager.title'),
      problem: t('landing.personas.traffic_manager.problem'),
      solution: t('landing.personas.traffic_manager.solution'),
    },
    {
      icon: Briefcase,
      title: t('landing.personas.small_business.title'),
      problem: t('landing.personas.small_business.problem'),
      solution: t('landing.personas.small_business.solution'),
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: t('landing.features.visual_creator.title'),
      description: t('landing.features.visual_creator.description'),
      highlights: [
        t('landing.features.visual_creator.highlight1'),
        t('landing.features.visual_creator.highlight2'),
        t('landing.features.visual_creator.highlight3'),
      ],
      badge: t('landing.features.visual_creator.badge'),
      imagePosition: 'right' as const,
    },
    {
      icon: Users,
      title: t('landing.features.crm.title'),
      description: t('landing.features.crm.description'),
      highlights: [
        t('landing.features.crm.highlight1'),
        t('landing.features.crm.highlight2'),
        t('landing.features.crm.highlight3'),
      ],
      imagePosition: 'left' as const,
    },
    {
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      highlights: [
        t('landing.features.analytics.highlight1'),
        t('landing.features.analytics.highlight2'),
        t('landing.features.analytics.highlight3'),
      ],
      imagePosition: 'right' as const,
    },
    {
      icon: Zap,
      title: t('landing.features.integrations.title'),
      description: t('landing.features.integrations.description'),
      highlights: [
        t('landing.features.integrations.highlight1'),
        t('landing.features.integrations.highlight2'),
        t('landing.features.integrations.highlight3'),
      ],
      badge: t('landing.features.integrations.badge'),
      imagePosition: 'left' as const,
    },
    {
      icon: Globe,
      title: t('landing.features.multilingual.title'),
      description: t('landing.features.multilingual.description'),
      highlights: [
        t('landing.features.multilingual.highlight1'),
        t('landing.features.multilingual.highlight2'),
        t('landing.features.multilingual.highlight3'),
      ],
      imagePosition: 'right' as const,
    },
  ];

  const fallbackPlans = [
    {
      id: 'free',
      name: t('landing.plans.free.name'),
      price: t('landing.plans.free.price'),
      description: t('landing.plans.free.description'),
      features: [
        t('landing.plans.free.feature1'),
        t('landing.plans.free.feature2'),
        t('landing.plans.free.feature3'),
        t('landing.plans.free.feature4'),
        t('landing.plans.free.feature5'),
      ],
      highlighted: true,
      ctaText: t('landing.plans.free.cta'),
    },
    {
      id: 'basic',
      name: t('landing.plans.basic.name'),
      price: t('landing.plans.basic.price'),
      description: t('landing.plans.basic.description'),
      features: [
        t('landing.plans.basic.feature1'),
        t('landing.plans.basic.feature2'),
        t('landing.plans.basic.feature3'),
        t('landing.plans.basic.feature4'),
        t('landing.plans.basic.feature5'),
      ],
      ctaText: t('landing.plans.basic.cta'),
    },
    {
      id: 'premium',
      name: t('landing.plans.premium.name'),
      price: t('landing.plans.premium.price'),
      description: t('landing.plans.premium.description'),
      features: [
        t('landing.plans.premium.feature1'),
        t('landing.plans.premium.feature2'),
        t('landing.plans.premium.feature3'),
        t('landing.plans.premium.feature4'),
        t('landing.plans.premium.feature5'),
        t('landing.plans.premium.feature6'),
      ],
      popular: true,
      ctaText: t('landing.plans.premium.cta'),
    },
    {
      id: 'partner',
      name: t('landing.plans.partner.name'),
      price: t('landing.plans.partner.price'),
      description: t('landing.plans.partner.description'),
      features: [
        t('landing.plans.partner.feature1'),
        t('landing.plans.partner.feature2'),
        t('landing.plans.partner.feature3'),
        t('landing.plans.partner.feature4'),
        t('landing.plans.partner.feature5'),
      ],
      ctaText: t('landing.plans.partner.cta'),
      ctaVariant: 'outline' as const,
    },
  ];

  const allPlans = dynamicPlans.length > 0 ? dynamicPlans : fallbackPlans;
  // Filter out free plan in Mode B
  const plans = isModeB ? allPlans.filter(p => p.planType !== 'free') : allPlans;

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main className="pt-16">
        {/* Hero Section - always rendered immediately */}
        <section id="hero">
          <HeroSection />
        </section>

        {/* Logo Carousel - parceiros */}
        <LogoCarousel />

        {/* Personas Section - deferred */}
        <DeferredSection id="personas" className="py-20 bg-gradient-to-b from-background to-secondary/30" fallbackHeight="600px">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 landing-animate">
              <h2 className="text-4xl font-bold mb-4">{t('landing.personas.title')}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.personas.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
                {personas.map((persona, index) => (
                  <PersonaCard key={index} {...persona} index={index} />
                ))}
              </Suspense>
            </div>
          </div>
        </DeferredSection>

        {/* Problem Section - deferred */}
        <DeferredSection id="problem" className="py-20 bg-destructive/5 border-y border-destructive/20" fallbackHeight="600px">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto landing-animate">
              <h2 className="text-4xl font-bold mb-6 text-center">
                {t('landing.problem.title')}
              </h2>
              
              <div className="space-y-4 text-lg text-muted-foreground mb-8">
                <p>{t('landing.problem.intro')}</p>
                <p className="font-semibold text-foreground">{t('landing.problem.current_flow')}</p>
                <ul className="space-y-2 ml-6">
                  <li>• {t('landing.problem.step1')}</li>
                  <li>• {t('landing.problem.step2')}</li>
                  <li>• {t('landing.problem.step3')}</li>
                  <li>• {t('landing.problem.step4')}</li>
                  <li>• {t('landing.problem.step5')}</li>
                </ul>
                <p className="font-bold text-foreground pt-4">{t('landing.problem.conclusion')}</p>
                <p className="text-primary font-semibold pt-2">{t('landing.problem.action')}</p>
              </div>

              <FlowDiagramWrapper />
            </div>
          </div>
        </DeferredSection>

        {/* Solution Section - deferred */}
        <DeferredSection id="solution" className="py-20 bg-primary/5" fallbackHeight="700px">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto landing-animate">
              <h2 className="text-4xl font-bold mb-4 text-center">
                {t('landing.solution.title')}
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                {t('landing.solution.subtitle')}
              </p>

              <div className="bg-card rounded-xl p-8 shadow-lg mb-8">
                <h3 className="text-2xl font-semibold mb-6 text-center">
                  {t('landing.solution.how_it_works')}
                </h3>
                
                <div className="space-y-5 text-lg">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {i}
                      </span>
                      <p className="pt-0.5">{t(`landing.solution.step${i}`)}</p>
                    </div>
                  ))}

                  <p className="font-bold text-primary pt-4">{t('landing.solution.result')}</p>
                </div>
              </div>
            </div>
          </div>
        </DeferredSection>

        {/* Pillars Section - deferred */}
        <DeferredSection id="pillars" className="py-20" fallbackHeight="500px">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 landing-animate">
              <h2 className="text-4xl font-bold mb-4">{t('landing.pillars.title')}</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow landing-animate landing-stagger-1">
                <Activity className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">{t('landing.pillars.conversion.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('landing.pillars.conversion.description')}</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.conversion.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.conversion.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.conversion.item3')}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow landing-animate landing-stagger-2">
                <Layers className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">{t('landing.pillars.allinone.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('landing.pillars.allinone.description')}</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.allinone.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.allinone.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.allinone.item3')}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow landing-animate landing-stagger-3">
                <UserCircle className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">{t('landing.pillars.simple.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('landing.pillars.simple.description')}</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.simple.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.simple.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    <span>{t('landing.pillars.simple.item3')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </DeferredSection>

        {/* Use Cases Section - deferred */}
        <DeferredSection id="use-cases" className="py-20 bg-secondary/20" fallbackHeight="500px">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 landing-animate">
              <h2 className="text-4xl font-bold mb-4">{t('landing.useCases.title')}</h2>
              <p className="text-xl text-muted-foreground">{t('landing.useCases.subtitle')}</p>
            </div>

            <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
              <UseCaseTab />
            </Suspense>
          </div>
        </DeferredSection>

        {/* Features Showcase - deferred */}
        <DeferredSection id="features" className="py-20" fallbackHeight="800px">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 landing-animate">
              <h2 className="text-4xl font-bold mb-4">{t('landing.features.title')}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.features.subtitle')}
              </p>
            </div>

            <FeatureShowcaseWrapper features={features} />

            {/* Extra Features Grid */}
            <div className="mt-24 landing-animate">
              <h3 className="text-2xl font-bold text-center mb-8">
                {t('landing.extraFeatures.title')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Video CDN */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.videoCdn.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.videoCdn.description')}</p>
                </div>

                {/* Calculator */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Calculator className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.calculator.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.calculator.description')}</p>
                </div>

                {/* Heatmap */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Flame className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.heatmap.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.heatmap.description')}</p>
                </div>

                {/* A/B Testing */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.abTest.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.abTest.description')}</p>
                </div>

                {/* Branching Logic */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <GitBranch className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.conditionalLogic.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.conditionalLogic.description')}</p>
                </div>

                {/* Embed Widget */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Code2 className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.embed.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.embed.description')}</p>
                </div>

                {/* Audio Upload */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.audio.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.audio.description')}</p>
                </div>

                {/* NPS Survey */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.nps.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.nps.description')}</p>
                </div>

                {/* Countdown Timer */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Timer className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.countdown.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.countdown.description')}</p>
                </div>

                {/* Social Proof */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.socialProof.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.socialProof.description')}</p>
                </div>

                {/* Quiz via PDF */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.pdfQuiz.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.pdfQuiz.description')}</p>
                </div>

                {/* Testimonials */}
                <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Quote className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold">{t('landing.extraFeatures.testimonials.title')}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('landing.extraFeatures.testimonials.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </DeferredSection>

        {/* Platform Gallery - deferred */}
        <DeferredSection fallbackHeight="500px">
          <PlatformGalleryWrapper />
        </DeferredSection>

        {/* Pricing Section - deferred */}
        <DeferredSection id="pricing" className="py-20 bg-gradient-to-b from-secondary/30 to-background" fallbackHeight="600px">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 landing-animate">
              <h2 className="text-4xl font-bold mb-4">{t('landing.pricing.title')}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('landing.pricing.subtitle')}
              </p>
              <p className="text-lg text-primary font-medium mt-2">
                💡 {t('landing.pricing.valueAnchor')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plansLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[550px] w-full" />
                  ))}
                </>
              ) : (
                <Suspense fallback={<Skeleton className="h-[550px] w-full col-span-4" />}>
                  {plans.map((plan, index) => (
                    <PricingCard key={plan.id} plan={plan} index={index} />
                  ))}
                </Suspense>
              )}
            </div>
          </div>
        </DeferredSection>

        {/* FAQ Section - deferred */}
        <DeferredSection id="faq" className="py-20" fallbackHeight="400px">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 landing-animate">
              <h2 className="text-4xl font-bold mb-4">{t('landing.faq.title')}</h2>
            </div>

            <FAQAccordionWrapper />
          </div>
        </DeferredSection>

        {/* Final CTA - deferred */}
        <DeferredSection id="cta" fallbackHeight="300px">
          <FinalCTAWrapper />
        </DeferredSection>
      </main>
    </div>
  );
};

export default Index;
