import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteMode } from '@/hooks/useSiteMode';

export const LandingHeader = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isModeB } = useSiteMode();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: t('landing.header.home'), href: '#hero' },
    { label: t('landing.header.features'), href: '#features' },
    { label: t('landing.header.pricing'), href: '#pricing' },
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

      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: 'header_nav_click',
          section: href.replace('#', ''),
          location: 'header'
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'header_login_click',
        location: 'header'
      });
    }
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('#hero')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold text-foreground">MasterQuiz</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => item.isRoute ? navigate(item.href) : scrollToSection(item.href)}
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
                  {navItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        if (item.isRoute) { navigate(item.href); } else { scrollToSection(item.href); }
                        setIsMobileMenuOpen(false);
                      }}
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
