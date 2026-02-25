import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuizTemplate } from '@/data/quizTemplates';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useQuizTemplates } from '@/hooks/useQuizTemplates';
import { useUserRole } from '@/hooks/useUserRole';
import { CheckCircle2, Sparkles, Lock, Crown } from 'lucide-react';
import { premiumQuizTemplates } from '@/data/premiumQuizTemplates';
import { toast } from 'sonner';

interface QuizTemplateSelectorProps {
  onSelectTemplate: (template: QuizTemplate) => void;
  onCreateFromScratch: () => void;
  onCreateWithAI?: () => void;
}

const categoryLabels: Record<string, string> = {
  lead_qualification: 'Qualificação de Leads',
  product_discovery: 'Descoberta de Produto',
  customer_satisfaction: 'Satisfação do Cliente',
  engagement: 'Engajamento',
  conversion: 'Conversão / VSL',
  paid_traffic: 'Tráfego Pago',
  offer_validation: 'Validação de Oferta',
  educational: 'Educacional',
  health_wellness: 'Saúde & Bem-estar',
  income_opportunity: 'Renda Extra',
  diagnostic: 'Diagnóstico',
  course_onboarding: 'Onboarding de Curso',
};

export const QuizTemplateSelector = ({ onSelectTemplate, onCreateFromScratch, onCreateWithAI }: QuizTemplateSelectorProps) => {
  const { allowedTemplates, allowAIGeneration, isLoading: planLoading } = usePlanFeatures();
  const { normalTemplates, premiumTemplates, isLoading: templatesLoading, usingFallback } = useQuizTemplates();
  const { isMasterAdmin, loading: roleLoading } = useUserRole();

  const isLoading = planLoading || templatesLoading || roleLoading;

  const allTemplates = [...normalTemplates, ...premiumTemplates];
  
  // Premium template IDs for visual badge
  const premiumIds = new Set(premiumQuizTemplates.map(t => t.id));
  
  // Master admin tem acesso a TODOS os templates mas ainda vê badge Premium
  const availableTemplates = isMasterAdmin 
    ? [...normalTemplates, ...premiumTemplates] 
    : normalTemplates;
  
  const lockedTemplates = isMasterAdmin ? [] : premiumTemplates;

  const handleSelectTemplate = (template: QuizTemplate, isLocked: boolean) => {
    if (isLocked) {
      toast.error('Este template está disponível apenas em planos premium. Faça upgrade para usar!');
      return;
    }
    onSelectTemplate(template);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando templates...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Escolha como começar</h2>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Selecione um template pronto ou crie do zero
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 w-full max-w-full">
        {allowAIGeneration && onCreateWithAI && (
          <Card 
            className="border-2 border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-600/20 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer" 
            onClick={onCreateWithAI}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-500/20">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">Criar com IA</h3>
                    <Badge className="bg-purple-500 text-white text-xs">Novo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Geração automática inteligente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card 
          className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer" 
          onClick={onCreateFromScratch}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg mb-1">Criar do Zero</h3>
                <p className="text-sm text-muted-foreground">
                  Controle total e personalização
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 w-full max-w-full">
        <h3 className="text-lg font-semibold">Templates Disponíveis</h3>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
          {availableTemplates.map((template) => {
            const isFeatured = template.id === 'funil-captacao-leads';
            const isPremiumTemplate = premiumIds.has(template.id);
            return (
              <Card 
                key={template.id} 
                className={`hover:border-primary transition-all cursor-pointer group relative ${
                  isFeatured ? 'border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10' : ''
                } ${isPremiumTemplate ? 'border-amber-500/30' : ''}`}
                onClick={() => handleSelectTemplate(template, false)}
              >
                {isPremiumTemplate && (
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-1 shadow-md">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
                {isFeatured && !isPremiumTemplate && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-1 shadow-md">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base group-hover:text-primary transition-colors mb-1 leading-tight">
                        {template.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {categoryLabels[template.category]}
                      </Badge>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📝 {template.preview?.questionCount ?? 5}</span>
                    <span>🎨 {template.preview?.template ?? 'moderno'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {lockedTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Templates Premium</h3>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-sm">
              <Lock className="h-3.5 w-3.5 mr-1" />
              Partner e Premium
            </Badge>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {lockedTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer relative border-dashed"
                onClick={() => handleSelectTemplate(template, true)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-base leading-tight">
                          {template.name}
                        </h4>
                        <Badge variant="secondary" className="bg-primary/20 text-xs px-2 py-1 flex-shrink-0">
                          <Lock className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {categoryLabels[template.category]}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>📝 {template.preview?.questionCount ?? 5}</span>
                      <span>🎨 {template.preview?.template ?? 'moderno'}</span>
                    </div>
                    <span className="text-primary font-medium text-sm">
                      Upgrade →
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
