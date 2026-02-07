import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Image as ImageIcon, Lock } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import '@/styles/quiz-templates.css';

interface AppearanceConfigStepProps {
  title: string;
  description: string;
  template: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  questionCount: number;
  logoUrl?: string;
  onLogoChange?: (url: string) => void;
  showLogo?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showQuestionNumber?: boolean;
  onShowLogoChange?: (value: boolean) => void;
  onShowTitleChange?: (value: boolean) => void;
  onShowDescriptionChange?: (value: boolean) => void;
  onShowQuestionNumberChange?: (value: boolean) => void;
}

const getTemplates = (t: any) => [
  {
    id: 'moderno',
    name: t('createQuiz.appearance.modern'),
    description: t('createQuiz.appearance.modernDesc'),
    bgColor: 'bg-blue-100'
  },
  {
    id: 'colorido',
    name: t('createQuiz.appearance.colorful'),
    description: t('createQuiz.appearance.colorfulDesc'),
    bgColor: 'bg-pink-100'
  },
  {
    id: 'profissional',
    name: t('createQuiz.appearance.professional'),
    description: t('createQuiz.appearance.professionalDesc'),
    bgColor: 'bg-gray-100'
  },
  {
    id: 'criativo',
    name: t('createQuiz.appearance.creative'),
    description: t('createQuiz.appearance.creativeDesc'),
    bgColor: 'bg-yellow-100'
  },
  {
    id: 'elegante',
    name: 'Elegante',
    description: 'Sofisticado com tons dourados',
    bgColor: 'bg-amber-100'
  },
  {
    id: 'vibrante',
    name: 'Vibrante',
    description: 'Energético com cores saturadas',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'minimalista',
    name: 'Minimalista',
    description: 'Ultra clean, preto e branco',
    bgColor: 'bg-slate-100'
  },
  {
    id: 'escuro',
    name: 'Escuro',
    description: 'Dark mode com neon',
    bgColor: 'bg-indigo-900'
  }
];

export const AppearanceConfigStep = ({
  title,
  description,
  template,
  onTitleChange,
  onDescriptionChange,
  onTemplateChange,
  questionCount,
  logoUrl,
  onLogoChange,
  showLogo = true,
  showTitle = true,
  showDescription = true,
  showQuestionNumber = true,
  onShowLogoChange,
  onShowTitleChange,
  onShowDescriptionChange,
  onShowQuestionNumberChange
}: AppearanceConfigStepProps) => {
  const { t } = useTranslation();
  const { allowedTemplates, isLoading } = usePlanFeatures();
  const templates = getTemplates(t);
  
  // Garantir que title e description sejam sempre strings para evitar erro .length em undefined
  const safeTitle = title || "";
  const safeDescription = description || "";
  
  const handleLogoChange = (url: string) => {
    if (onLogoChange) {
      onLogoChange(url);
    }
  };
  
  const isTemplateAllowed = (templateId: string) => {
    return allowedTemplates.includes(templateId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel - Configuration */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('createQuiz.appearance.title')}</CardTitle>
            <CardDescription>{t('createQuiz.appearance.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>{t('createQuiz.appearance.quizLogo')}</Label>
              <p className="text-sm text-muted-foreground mb-2">
                {t('createQuiz.appearance.logoDesc')}
              </p>
              <ImageUploader 
                value={logoUrl || ''}
                onChange={handleLogoChange}
              />
            </div>

            <Separator className="my-6" />

            {/* Display Options Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Opções de Exibição</Label>
                <p className="text-sm text-muted-foreground">
                  Escolha quais elementos exibir no quiz para os participantes
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-logo">Exibir logo no quiz</Label>
                    <p className="text-xs text-muted-foreground">Mostrar o logo na página do quiz</p>
                  </div>
                  <Switch
                    id="show-logo"
                    checked={showLogo}
                    onCheckedChange={onShowLogoChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-title">Exibir título no quiz</Label>
                    <p className="text-xs text-muted-foreground">Mostrar o título na página do quiz</p>
                  </div>
                  <Switch
                    id="show-title"
                    checked={showTitle}
                    onCheckedChange={onShowTitleChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-description">Exibir descrição no quiz</Label>
                    <p className="text-xs text-muted-foreground">Mostrar a descrição na página do quiz</p>
                  </div>
                  <Switch
                    id="show-description"
                    checked={showDescription}
                    onCheckedChange={onShowDescriptionChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-question-number">Exibir número da pergunta</Label>
                    <p className="text-xs text-muted-foreground">Mostrar "Pergunta X de Y" durante o quiz</p>
                  </div>
                  <Switch
                    id="show-question-number"
                    checked={showQuestionNumber}
                    onCheckedChange={onShowQuestionNumberChange}
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Quiz Information */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Informações do Quiz</Label>
                <p className="text-sm text-muted-foreground">
                  Título e descrição que aparecerão na página do quiz
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-title">Título do Quiz *</Label>
                <Input
                  id="quiz-title"
                  placeholder="Ex: Qual é o seu perfil profissional?"
                  value={safeTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {safeTitle.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-description">Descrição (opcional)</Label>
                <Textarea
                  id="quiz-description"
                  placeholder="Descreva brevemente seu quiz..."
                  value={safeDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  rows={3}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {safeDescription.length}/300 caracteres
                </p>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">{t('createQuiz.appearance.chooseTemplate')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('createQuiz.appearance.templateDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {templates.map((tmpl) => {
                  const allowed = isTemplateAllowed(tmpl.id);
                  const isEscuro = tmpl.id === 'escuro';
                  return (
                    <Card
                      key={tmpl.id}
                      className={`transition-all min-w-0 ${
                        template === tmpl.id
                          ? 'border-primary border-2 shadow-md'
                          : allowed ? 'cursor-pointer hover:border-primary/50' : 'opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => allowed && onTemplateChange(tmpl.id)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className={`w-full h-10 ${tmpl.bgColor} rounded-lg flex items-center justify-center relative`}>
                          {template === tmpl.id && allowed && (
                            <Check className={`h-5 w-5 ${isEscuro ? 'text-white' : 'text-primary'}`} />
                          )}
                          {!allowed && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                              <Lock className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate" title={tmpl.name}>{tmpl.name}</h4>
                            {!allowed && <Badge variant="secondary" className="text-xs shrink-0">Pro</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate" title={tmpl.description}>{tmpl.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Preview */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>{t('createQuiz.appearance.preview')}</CardTitle>
            <CardDescription>{t('createQuiz.appearance.previewDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`quiz-template-${template || 'moderno'} p-4 rounded-lg space-y-4 transition-all duration-300`}>
              {/* Header com Logo */}
              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  {showLogo && (
                    <div className="w-full h-24 bg-muted/50 rounded-lg flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="space-y-2 text-center">
                    {showTitle && (
                      <h1 className="font-bold text-xl">
                        {safeTitle || t('createQuiz.appearance.yourQuizTitle')}
                      </h1>
                    )}
                    {showDescription && (
                      <p className="text-sm opacity-80">
                        {safeDescription || t('createQuiz.appearance.yourQuizDesc')}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-2">
                      {questionCount} {t('createQuiz.appearance.questions')}
                    </Badge>
                  </div>
                  <Button className="w-full btn-primary">
                    ▶ {t('createQuiz.appearance.startQuiz')}
                  </Button>
                </CardContent>
              </Card>

              {/* Exemplo de Pergunta */}
              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    {showQuestionNumber && (
                      <Badge variant="outline" className="text-xs">Pergunta 1 de {questionCount}</Badge>
                    )}
                    <h2 className="font-semibold text-lg">
                      Qual é o seu objetivo principal?
                    </h2>
                    <p className="text-sm opacity-70">
                      Escolha a opção que melhor representa sua necessidade
                    </p>
                  </div>

                  {/* Opções de Resposta */}
                  <div className="space-y-2">
                    {['Aumentar vendas', 'Gerar mais leads', 'Melhorar engajamento'].map((option, idx) => (
                      <div 
                        key={idx}
                        className="p-3 border-2 rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium">{option}</p>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full btn-primary mt-4">
                    Próxima Pergunta →
                  </Button>
                </CardContent>
              </Card>

              {/* Elementos de Design */}
              <Card className="border-2">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-base">Elementos do Template</h3>
                  <div className="space-y-2">
                    <p className="text-sm">Texto padrão com a fonte selecionada</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge>Badge 1</Badge>
                      <Badge variant="secondary">Badge 2</Badge>
                      <Badge variant="outline">Badge 3</Badge>
                    </div>
                    <div className="h-px bg-border my-2"></div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">Primário</Button>
                      <Button size="sm" variant="outline">Secundário</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
