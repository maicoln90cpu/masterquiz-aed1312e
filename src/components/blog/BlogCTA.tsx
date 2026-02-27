import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BlogCTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 md:p-8 text-center my-8">
      <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="text-xl font-bold text-foreground mb-2">
        {t('blog.cta.title', 'Crie seu quiz grátis agora')}
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        {t('blog.cta.description', 'Transforme visitantes em leads qualificados com quizzes interativos. Comece gratuitamente!')}
      </p>
      <Button onClick={() => navigate('/login')} size="lg" className="font-semibold">
        {t('blog.cta.button', 'Começar Grátis')}
      </Button>
    </div>
  );
};
