import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sanitizeRichContent } from '@/lib/sanitize';
import { useGlobalTracking } from '@/hooks/useGlobalTracking';

const PrivacyPolicy = () => {
  // Global tracking (GTM/Pixel do master admin)
  useGlobalTracking();
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrivacyPolicy = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'privacy_policy_content')
          .single();

        if (error) throw error;
        
        // Substituir [DATA] pela data atual formatada
        const contentWithDate = data?.setting_value?.replace(
          '[DATA]', 
          new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })
        ) || '';
        
        setContent(contentWithDate);
      } catch (error) {
        console.error('Erro ao carregar política de privacidade:', error);
        setContent('<p>Erro ao carregar a política de privacidade. Tente novamente mais tarde.</p>');
      } finally {
        setLoading(false);
      }
    };

    loadPrivacyPolicy();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">
              {t('privacy.title', 'Política de Privacidade')}
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article 
          className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:mb-6
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground
            prose-ul:my-4 prose-li:my-1"
          dangerouslySetInnerHTML={{ __html: sanitizeRichContent(content) }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {t('privacy.footer', 'Para dúvidas sobre privacidade, entre em contato conosco.')}
          </p>
          <Button 
            variant="link" 
            onClick={() => navigate('/')}
            className="mt-2"
          >
            {t('privacy.backToHome', 'Voltar para a página inicial')}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
