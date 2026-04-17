import { Button } from '@/components/ui/button';
import { LineChart, Share2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ChartEmptyStateProps {
  /** Altura para casar com a do gráfico real (evita CLS) */
  height?: number;
}

/**
 * Empty state do gráfico de Analytics.
 * Mostra um CTA contextual: compartilhar quiz publicado, ou publicar primeiro quiz.
 */
export const ChartEmptyState = ({ height = 300 }: ChartEmptyStateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [hasPublishedQuiz, setHasPublishedQuiz] = useState<boolean | null>(null);
  const [latestQuizSlug, setLatestQuizSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkQuiz = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('quizzes')
        .select('slug, status, is_public')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (data?.slug) {
        setHasPublishedQuiz(true);
        setLatestQuizSlug(data.slug);
      } else {
        setHasPublishedQuiz(false);
      }
    };
    checkQuiz();
    return () => { cancelled = true; };
  }, [user]);

  const handleShare = () => {
    if (latestQuizSlug) {
      const url = `${window.location.origin}/q/${latestQuizSlug}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      navigate('/meus-quizzes');
    }
  };

  const handleCreate = () => {
    navigate('/create-quiz');
  };

  return (
    <div
      style={{ minHeight: height }}
      className="flex flex-col items-center justify-center gap-4 text-center px-6 py-8 rounded-md border border-dashed border-border bg-muted/20"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <LineChart className="h-7 w-7 text-primary" aria-hidden="true" />
      </div>
      <div className="space-y-1 max-w-md">
        <p className="font-medium text-foreground">
          {t('analytics.emptyChart.title', 'Nenhuma resposta ainda')}
        </p>
        <p className="text-sm text-muted-foreground">
          {hasPublishedQuiz === false
            ? t('analytics.emptyChart.descNoQuiz', 'Publique seu primeiro quiz para começar a ver dados aqui.')
            : t('analytics.emptyChart.descNoResponses', 'Compartilhe seu quiz para começar a coletar respostas.')}
        </p>
      </div>

      {hasPublishedQuiz === true && (
        <Button onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" />
          {t('analytics.emptyChart.shareCta', 'Compartilhar meu quiz')}
        </Button>
      )}
      {hasPublishedQuiz === false && (
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('analytics.emptyChart.createCta', 'Publicar meu primeiro quiz')}
        </Button>
      )}
    </div>
  );
};
