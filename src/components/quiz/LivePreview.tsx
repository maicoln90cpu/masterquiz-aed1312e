import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Eye, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { LivePreviewErrorBoundary } from './LivePreviewErrorBoundary';

interface LivePreviewProps {
  title: string;
  description: string;
  template: string;
  logoUrl?: string;
  questions: Array<{
    question_text: string;
    answer_format: 'single_choice' | 'multiple_choice';
    options: Array<{ text: string }>;
    media_url?: string;
  }>;
  formConfig: {
    collect_name: boolean;
    collect_email: boolean;
    collect_whatsapp: boolean;
  };
}

export const LivePreview = ({ 
  title, 
  description, 
  template, 
  logoUrl, 
  questions,
  formConfig 
}: LivePreviewProps) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Extract question data from blocks structure
  const extractQuestionData = (questions: any[]) => {
    return questions.map(q => {
      const questionBlock = q.blocks?.find((b: any) => b.type === 'question');
      const mediaBlock = q.blocks?.find((b: any) => b.type === 'image' || b.type === 'video');
      
      return {
        question_text: questionBlock?.content || q.question_text || '',
        answer_format: questionBlock?.answerFormat || q.answer_format || 'single_choice',
        options: questionBlock?.options || q.options || [],
        media_url: mediaBlock?.url || q.media_url || ''
      };
    });
  };
  
  const processedQuestions = extractQuestionData(questions);
  const firstQuestion = processedQuestions[0];

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };
  
  return (
    <LivePreviewErrorBoundary>
      <Card className={`sticky top-4 p-6 bg-muted/50 quiz-template-${template || 'moderno'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Preview em Tempo Real</span>
        </div>
        <div className="flex items-center gap-1 bg-background rounded-lg p-1 border">
          <Button
            size="sm"
            variant={deviceMode === 'desktop' ? 'default' : 'ghost'}
            onClick={() => setDeviceMode('desktop')}
            className="h-8 w-8 p-0"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={deviceMode === 'tablet' ? 'default' : 'ghost'}
            onClick={() => setDeviceMode('tablet')}
            className="h-8 w-8 p-0"
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={deviceMode === 'mobile' ? 'default' : 'ghost'}
            onClick={() => setDeviceMode('mobile')}
            className="h-8 w-8 p-0"
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* FASE 1.3: Remove overflow-x-auto, add overflow-hidden */}
      <div className="flex justify-center overflow-hidden">
        <div 
          key={deviceMode}
          className="bg-background rounded-lg p-4 md:p-6 shadow-sm border transition-all duration-300 mx-auto w-full"
          style={{ 
            maxWidth: deviceMode === 'desktop' ? '100%' : deviceWidths[deviceMode],
            width: '100%'
          }}
        >
        {/* Header */}
        <div className="text-center mb-6">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-12 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold mb-2">{title || 'Título do Quiz'}</h2>
          <p className="text-muted-foreground">
            {description || 'Descrição do seu quiz aparecerá aqui'}
          </p>
          {template && (
            <Badge variant="outline" className="mt-2">
              Template: {template}
            </Badge>
          )}
        </div>

        {/* Primeira pergunta (se existir) */}
        {firstQuestion && (
          <div className="space-y-4 mb-6">
            {/* Mídia da pergunta */}
            {firstQuestion.media_url && (
              <div className="mb-4">
                <img 
                  src={firstQuestion.media_url} 
                  alt="Mídia da pergunta" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div>
              <Label className="text-lg font-semibold">
                {firstQuestion.question_text || 'Digite o texto da sua pergunta'}
              </Label>
            </div>
            
            {firstQuestion.answer_format === 'single_choice' ? (
              <RadioGroup>
                {firstQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted transition-smooth">
                    <RadioGroupItem value={option.text} id={`preview-${idx}`} />
                    <Label htmlFor={`preview-${idx}`} className="cursor-pointer flex-1">
                      {option.text || `Opção ${idx + 1}`}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2">
                {firstQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted transition-smooth">
                    <Checkbox id={`preview-multi-${idx}`} />
                    <Label htmlFor={`preview-multi-${idx}`} className="cursor-pointer flex-1">
                      {option.text || `Opção ${idx + 1}`}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulário (se configurado) */}
        {(formConfig.collect_name || formConfig.collect_email || formConfig.collect_whatsapp) && (
          <div className="space-y-3 mb-6 pt-6 border-t">
            <h3 className="font-semibold">Seus dados</h3>
            {formConfig.collect_name && (
              <div>
                <Label htmlFor="preview-name">Nome</Label>
                <Input id="preview-name" placeholder="Seu nome completo" disabled />
              </div>
            )}
            {formConfig.collect_email && (
              <div>
                <Label htmlFor="preview-email">E-mail</Label>
                <Input id="preview-email" type="email" placeholder="seu@email.com" disabled />
              </div>
            )}
            {formConfig.collect_whatsapp && (
              <div>
                <Label htmlFor="preview-whatsapp">WhatsApp</Label>
                <Input id="preview-whatsapp" placeholder="(00) 00000-0000" disabled />
              </div>
            )}
          </div>
        )}

          <Button className="w-full" disabled>
            {firstQuestion ? 'Próxima' : 'Começar Quiz'}
          </Button>
        </div>
      </div>
    </Card>
    </LivePreviewErrorBoundary>
  );
};
