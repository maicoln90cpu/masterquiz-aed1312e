import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import QuizView from "./QuizView";
import { Loader2 } from "lucide-react";

export default function PreviewQuiz() {
  const { t } = useTranslation();
  const { quizId } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [formConfig, setFormConfig] = useState<any>(null);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuizForPreview = async () => {
      if (!quizId) {
        setError(t('components.preview.quizIdMissing'));
        setLoading(false);
        return;
      }

      try {
        logger.quiz('Carregando quiz para preview:', quizId);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError(t('components.preview.loginRequired'));
          setLoading(false);
          return;
        }

        // Buscar quiz sem validar is_public (permite preview de rascunhos)
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('user_id', user.id) // Apenas o dono pode ver preview
          .single();

        if (quizError || !quiz) {
          logger.error('Erro ao buscar quiz para preview:', quizError);
          setError(t('components.preview.notFoundOrNoPermission'));
          setLoading(false);
          return;
        }

        logger.quiz('Quiz encontrado:', quiz.title);

        // Buscar questions
        const { data: questionsData } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_number');

        // Buscar results
        const { data: resultsData } = await supabase
          .from('quiz_results')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_number');

        // Buscar form config
        const { data: configData } = await supabase
          .from('quiz_form_config')
          .select('*')
          .eq('quiz_id', quizId)
          .maybeSingle();

        // Buscar custom fields
        const { data: fieldsData } = await supabase
          .from('custom_form_fields')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_number');

        // Buscar owner profile para tracking
        const { data: profileData } = await supabase
          .from('profiles')
          .select('facebook_pixel_id, gtm_container_id')
          .eq('id', quiz.user_id)
          .single();

        setQuizData(quiz);
        setQuestions(questionsData || []);
        setResults(resultsData || []);
        setFormConfig(configData);
        setCustomFields(fieldsData || []);
        setOwnerProfile(profileData);
        setLoading(false);
        
        logger.quiz('Dados do preview carregados:', {
          questions: questionsData?.length || 0,
          results: resultsData?.length || 0
        });
      } catch (err) {
        logger.error('Erro ao carregar quiz para preview:', err);
        setError(t('components.preview.loadError'));
        setLoading(false);
      }
    };

    loadQuizForPreview();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('components.preview.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md p-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold">{t('components.preview.accessDenied')}</h1>
          <p className="text-muted-foreground">{error}</p>
          <a href="/dashboard" className="text-primary hover:underline">
            {t('components.preview.backToDashboard')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Banner de Preview */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white py-2 px-4 text-center text-sm font-semibold shadow-lg">
        {t('components.preview.previewBanner')}
      </div>
      
      {/* Quiz com margem para não ficar sob o banner */}
      <div className="pt-10">
        <QuizView 
          previewMode={true}
          previewData={{
            quiz: quizData,
            questions,
            results,
            formConfig,
            customFields,
            ownerProfile
          }}
        />
      </div>
    </div>
  );
}
