import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteMode } from '@/hooks/useSiteMode';
import { pushGTMEvent } from '@/lib/gtmLogger';

export const LandingHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isModeB } = useSiteMode();
  const isHome = location.pathname === '/' || location.pathname === '/b';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Itens com âncora (#) viram scroll na home OU navegação para "/#anchor" em rotas internas.
  // Itens com isRoute: true são sempre rotas dedicadas.
  const navItems = [
    { label: t('landing.header.home'), href: '#hero' },
    { label: t('landing.header.features'), href: '#features' },
    // "Preços" agora aponta para a rota dedicada /precos (melhor SEO + página rica).
    { label: t('landing.header.pricing'), href: '/precos', isRoute: true },
    // Item /compare — importante para SEO + Google Ads sitelink. Não remover sem aprovação de marketing.
    { label: t('landing.header.compare'), href: '/compare', isRoute: true },
    { label: t('landing.header.blog'), href: '/blog', isRoute: true },
    { label: t('landing.header.faq'), href: '/faq', isRoute: true },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  // Manipulador unificado: decide entre scroll local e navegação cross-page.
  const handleNavClick = (item: { href: string; isRoute?: boolean }) => {
    pushGTMEvent('header_nav_click', {
      section: item.href.replace(/^[#/]/, ''),
      location: 'header',
      from_route: location.pathname,
    });

    if (item.isRoute) {
      navigate(item.href);
      setIsMobileMenuOpen(false);
      return;
    }

    // Âncora: se já está na home, faz scroll; senão navega para "/#anchor".
    if (isHome) {
      scrollToSection(item.href);
    } else {
      navigate(`/${item.href}`); // ex.: "/#features"
      setIsMobileMenuOpen(false);
    }
  };

  const handleBackHome = () => {
    pushGTMEvent('header_back_home_click', { from_route: location.pathname });
    navigate('/');
  };

  const handleLoginClick = () => {
    pushGTMEvent('header_login_click', { location: 'header' });
    navigate(isModeB ? '/precos' : '/login');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md border-b shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => isHome ? scrollToSection('#hero') : navigate('/')}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
              <span className="text-2xl font-bold text-foreground">MasterQuiz</span>
            </div>

            {/* Botão "Voltar para Home" — visível apenas em rotas internas */}
            {!isHome && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackHome}
                className="hidden md:inline-flex gap-2 text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('landing.header.backHome', 'Voltar para Home')}
              </Button>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <LanguageSwitch />
            
            {user ? (
              <Button onClick={() => navigate('/dashboard')} variant="default" className="hidden md:inline-flex">
                {t('dashboard.welcome')}, {user.email?.split('@')[0]}
              </Button>
            ) : (
              <Button onClick={handleLoginClick} variant="default" className="hidden md:inline-flex">
                {t('landing.header.login')}
              </Button>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-6 mt-8">
                  {!isHome && (
                    <button
                      onClick={() => { handleBackHome(); setIsMobileMenuOpen(false); }}
                      className="flex items-center gap-2 text-left text-lg font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {t('landing.header.backHome', 'Voltar para Home')}
                    </button>
                  )}
                  {navItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleNavClick(item)}
                      className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                  {user ? (
                    <Button onClick={() => navigate('/dashboard')} variant="default" className="w-full mt-4">
                      {t('dashboard.welcome')}, {user.email?.split('@')[0]}
                    </Button>
                  ) : (
                    <Button onClick={handleLoginClick} variant="default" className="w-full mt-4">
                      {t('landing.header.login')}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
