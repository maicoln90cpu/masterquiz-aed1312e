import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Search, 
  HelpCircle,
  LayoutDashboard,
  PenTool,
  Users,
  FileText,
  BarChart3,
  Image,
  Link2,
  Settings,
  Sparkles,
  Video,
  Webhook
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useGlobalTracking } from '@/hooks/useGlobalTracking';
import logo from '@/assets/logo.png';

// Imagens reais do sistema
import dashboardReal from '@/assets/dashboard-real.jpeg';
import quizCreatorReal from '@/assets/quiz-creator-real.jpeg';
import crmReal from '@/assets/crm-real.jpeg';
import analyticsReal from '@/assets/analytics-real.jpeg';
import visualEditorReal from '@/assets/visual-editor-real.jpeg';
import integrationsReal from '@/assets/integrations-real.jpeg';
import configuracoesReal from '@/assets/configuracoes-real.jpeg';
import multilingualReal from '@/assets/multilingual-real.jpeg';

const FAQ = () => {
  const { t } = useTranslation();
  // Global tracking (GTM/Pixel do master admin)
  useGlobalTracking();
  
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Funcionalidades do Dashboard com imagens reais
  const dashboardFeatures = [
    {
      title: t('faqPage.dashboardFeatures.dashboard.title'),
      description: t('faqPage.dashboardFeatures.dashboard.description'),
      icon: LayoutDashboard,
      image: dashboardReal
    },
    {
      title: t('faqPage.dashboardFeatures.quizCreator.title'),
      description: t('faqPage.dashboardFeatures.quizCreator.description'),
      icon: PenTool,
      image: quizCreatorReal
    },
    {
      title: t('faqPage.dashboardFeatures.crm.title'),
      description: t('faqPage.dashboardFeatures.crm.description'),
      icon: Users,
      image: crmReal
    },
    {
      title: t('faqPage.dashboardFeatures.analytics.title'),
      description: t('faqPage.dashboardFeatures.analytics.description'),
      icon: BarChart3,
      image: analyticsReal
    },
    {
      title: t('faqPage.dashboardFeatures.visualEditor.title'),
      description: t('faqPage.dashboardFeatures.visualEditor.description'),
      icon: Sparkles,
      image: visualEditorReal
    },
    {
      title: t('faqPage.dashboardFeatures.mediaGallery.title'),
      description: t('faqPage.dashboardFeatures.mediaGallery.description'),
      icon: Image,
      image: multilingualReal
    },
    {
      title: t('faqPage.dashboardFeatures.integrations.title'),
      description: t('faqPage.dashboardFeatures.integrations.description'),
      icon: Link2,
      image: integrationsReal
    },
    {
      title: t('faqPage.dashboardFeatures.settings.title'),
      description: t('faqPage.dashboardFeatures.settings.description'),
      icon: Settings,
      image: configuracoesReal
    }
  ];

  // Perguntas organizadas por categoria
  const faqCategories = [
    {
      id: 'geral',
      title: t('faqPage.categories.general.title'),
      icon: HelpCircle,
      questions: Array.from({ length: 10 }, (_, i) => ({
        q: t(`faqPage.categories.general.q${i + 1}.q`),
        a: t(`faqPage.categories.general.q${i + 1}.a`)
      }))
    },
    {
      id: 'criacao',
      title: t('faqPage.categories.creation.title'),
      icon: PenTool,
      questions: Array.from({ length: 10 }, (_, i) => ({
        q: t(`faqPage.categories.creation.q${i + 1}.q`),
        a: t(`faqPage.categories.creation.q${i + 1}.a`)
      }))
    },
    {
      id: 'crm',
      title: t('faqPage.categories.crm.title'),
      icon: Users,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.crm.q${i + 1}.q`),
        a: t(`faqPage.categories.crm.q${i + 1}.a`)
      }))
    },
    {
      id: 'respostas',
      title: t('faqPage.categories.responses.title'),
      icon: FileText,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.responses.q${i + 1}.q`),
        a: t(`faqPage.categories.responses.q${i + 1}.a`)
      }))
    },
    {
      id: 'analytics',
      title: t('faqPage.categories.analytics.title'),
      icon: BarChart3,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.analytics.q${i + 1}.q`),
        a: t(`faqPage.categories.analytics.q${i + 1}.a`)
      }))
    },
    {
      id: 'galeria',
      title: t('faqPage.categories.gallery.title'),
      icon: Image,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.gallery.q${i + 1}.q`),
        a: t(`faqPage.categories.gallery.q${i + 1}.a`)
      }))
    },
    {
      id: 'video',
      title: t('faqPage.categories.video.title'),
      icon: Video,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.video.q${i + 1}.q`),
        a: t(`faqPage.categories.video.q${i + 1}.a`)
      }))
    },
    {
      id: 'integracoes',
      title: t('faqPage.categories.integrations.title'),
      icon: Link2,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.integrations.q${i + 1}.q`),
        a: t(`faqPage.categories.integrations.q${i + 1}.a`)
      }))
    },
    {
      id: 'webhooks',
      title: t('faqPage.categories.webhooks.title'),
      icon: Webhook,
      questions: Array.from({ length: 5 }, (_, i) => ({
        q: t(`faqPage.categories.webhooks.q${i + 1}.q`),
        a: t(`faqPage.categories.webhooks.q${i + 1}.a`)
      }))
    }
  ];

  // Filtrar perguntas baseado na busca
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img src={logo} alt="MasterQuiz" className="h-8 w-8" />
              <span className="text-xl font-bold">MasterQuiz</span>
            </div>
          </div>
          <Button onClick={() => navigate('/login')}>
            {t('faqPage.header.accessPlatform')}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-6">
            <HelpCircle className="h-5 w-5" />
            <span className="font-medium">{t('faqPage.header.helpCenter')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('faqPage.header.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('faqPage.header.subtitle')}
          </p>
          
          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('faqPage.header.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Funcionalidades do Dashboard */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2 text-center">
            {t('faqPage.dashboardFeatures.title')}
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            {t('faqPage.dashboardFeatures.subtitle')}
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardFeatures.map((feature, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                {feature.image && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ por Categoria */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            {t('faqPage.faqTitle')}
          </h2>

          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                {t('faqPage.noResults')} "{searchTerm}"
              </p>
              <Button 
                variant="link" 
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                {t('faqPage.clearSearch')}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <category.icon className="h-5 w-5 text-primary" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, idx) => (
                        <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                          <AccordionTrigger className="text-left">
                            {item.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {t('faqPage.cta.title')}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t('faqPage.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/dashboard')} size="lg">
              {t('faqPage.cta.accessDashboard')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
              {t('faqPage.cta.createAccount')}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>{t('faqPage.footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;
