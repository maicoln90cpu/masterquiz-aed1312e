import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe, Plus, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

interface LanguageSelectorProps {
  quizId: string | null;
  title: string;
  description: string;
  questions: any[];
}

interface Translation {
  language: string;
  title: string;
  description: string;
  questions: Record<string, {
    text: string;
    options: any;
  }>;
}

export const LanguageSelector = ({ quizId, title, description, questions }: LanguageSelectorProps) => {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<string[]>(['pt']);
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [saving, setSaving] = useState(false);

  const languageNames: Record<string, string> = {
    pt: '🇧🇷 Português',
    en: '🇺🇸 English',
    es: '🇪🇸 Español'
  };

  useEffect(() => {
    if (quizId) {
      loadTranslations();
    }
  }, [quizId]);

  const loadTranslations = async () => {
    if (!quizId) return;

    const { data } = await supabase
      .from('quiz_translations')
      .select('*')
      .eq('quiz_id', quizId);

    if (data && data.length > 0) {
      const availableLangs = ['pt', ...data.map(t => t.language_code)];
      setLanguages(availableLangs);

      const loadedTranslations: Record<string, Translation> = {};
      data.forEach(t => {
        loadedTranslations[t.language_code] = {
          language: t.language_code,
          title: t.title,
          description: t.description || '',
          questions: {}
        };
      });
      setTranslations(loadedTranslations);
    }
  };

  const addLanguage = (langCode: string) => {
    if (!languages.includes(langCode)) {
      setLanguages([...languages, langCode]);
      setSelectedLanguage(langCode);
      setTranslations({
        ...translations,
        [langCode]: {
          language: langCode,
          title: '',
          description: '',
          questions: {}
        }
      });
    }
  };

  const saveTranslations = async () => {
    if (!quizId) {
      toast.error(t('languageSelector.saveFirst', 'Salve o quiz antes de adicionar traduções'));
      return;
    }

    setSaving(true);
    try {
      // Salvar traduções do quiz (exceto pt)
      for (const lang of languages.filter(l => l !== 'pt')) {
        const trans = translations[lang];
        if (trans) {
          await supabase
            .from('quiz_translations')
            .upsert({
              quiz_id: quizId,
              language_code: lang,
              title: trans.title || title,
              description: trans.description || description
            }, {
              onConflict: 'quiz_id,language_code'
            });
        }
      }

      toast.success(t('languageSelector.translationsSaved', 'Traduções salvas com sucesso!'));
    } catch (error: any) {
      toast.error(t('languageSelector.saveError', 'Erro ao salvar traduções:') + ' ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateTranslation = (field: string, value: string) => {
    setTranslations({
      ...translations,
      [selectedLanguage]: {
        ...translations[selectedLanguage],
        [field]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>{t('languageSelector.title', 'Multi-idiomas')}</CardTitle>
          </div>
          <Button onClick={saveTranslations} disabled={saving || !quizId}>
            <Save className="h-4 w-4 mr-2" />
            {t('languageSelector.saveTranslations', 'Salvar Traduções')}
          </Button>
        </div>
        <CardDescription>
          {t('languageSelector.description', 'Crie versões do seu quiz em diferentes idiomas (Inglês e Espanhol disponíveis)')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {languages.map(lang => (
            <Badge
              key={lang}
              variant={selectedLanguage === lang ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedLanguage(lang)}
            >
              {languageNames[lang] || lang.toUpperCase()}
            </Badge>
          ))}
          
          {!languages.includes('en') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => addLanguage('en')}
            >
              <Plus className="h-3 w-3 mr-1" />
              🇺🇸 English
            </Button>
          )}
          
          {!languages.includes('es') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => addLanguage('es')}
            >
              <Plus className="h-3 w-3 mr-1" />
              🇪🇸 Español
            </Button>
          )}
        </div>

        {selectedLanguage === 'pt' ? (
          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded">
            <p>✅ {t('languageSelector.portugueseDefault', 'Português é o idioma padrão')}</p>
            <p className="text-xs mt-1">{t('languageSelector.portugueseHint', 'Use os campos principais do quiz para o conteúdo em português')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('languageSelector.titleLabel', 'Título')} ({languageNames[selectedLanguage]})</Label>
              <Input
                value={translations[selectedLanguage]?.title || ''}
                onChange={(e) => updateTranslation('title', e.target.value)}
                placeholder={`${t('languageSelector.titlePlaceholder', 'Tradução do título para')} ${languageNames[selectedLanguage]}`}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('languageSelector.descriptionLabel', 'Descrição')} ({languageNames[selectedLanguage]})</Label>
              <Textarea
                value={translations[selectedLanguage]?.description || ''}
                onChange={(e) => updateTranslation('description', e.target.value)}
                placeholder={`${t('languageSelector.descriptionPlaceholder', 'Tradução da descrição para')} ${languageNames[selectedLanguage]}`}
                rows={3}
              />
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-primary/10 dark:bg-primary/20 rounded">
              <p className="font-medium">{t('languageSelector.tip', '💡 Dica:')}</p>
              <p className="mt-1">
                {t('languageSelector.tipText', 'As traduções das perguntas podem ser adicionadas futuramente. Por enquanto, foque no título e descrição do quiz.')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
