import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, ArrowLeft, Info, Link2 } from 'lucide-react';

interface FunnelStepInfoProps {
  variant: 'collection' | 'results';
  onBackToQuestions?: () => void;
}

/**
 * Card informativo exibido nas etapas 4 (coleta) e 5 (resultados)
 * quando o quiz está no modo Funil (showResults = false).
 *
 * - 'collection': explica que dados devem ser coletados via blocos no quiz
 * - 'results': explica que o redirecionamento deve ser feito via CTA na última pergunta
 */
export const FunnelStepInfo = ({ variant, onBackToQuestions }: FunnelStepInfoProps) => {
  if (variant === 'collection') {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                📋 Coleta de dados no modo Funil
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No formato funil, os dados são coletados <strong className="text-foreground">dentro do próprio quiz</strong> usando blocos como{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Texto Curto</code>,{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Email</code> ou{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Telefone</code> em uma das perguntas.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Configure pelo menos um desses blocos na <strong className="text-foreground">Etapa 3 (Perguntas)</strong> para capturar os leads.
              </p>
            </div>
          </div>

          {onBackToQuestions && (
            <Button variant="outline" onClick={onBackToQuestions} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Perguntas
            </Button>
          )}

          <Alert>
            <AlertDescription className="text-xs">
              💡 Os campos abaixo estão desativados porque a tela de resultados foi desligada na Etapa 2. Reative "Exibir tela de resultados" para usar a coleta tradicional.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // variant === 'results'
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              🎯 Modo Funil sem tela de resultado
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Como você desativou a tela de resultados na <strong className="text-foreground">Etapa 2 (Aparência)</strong>, esta etapa não é necessária.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-background/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Link2 className="h-4 w-4 text-primary" />
            Dica importante
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Na <strong className="text-foreground">última pergunta</strong> do seu quiz (Etapa 3), adicione um bloco de{' '}
            <strong className="text-foreground">Botão / CTA</strong> com o link de redirecionamento para o seu produto, página de vendas ou WhatsApp.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            É para lá que o respondente irá ao terminar o quiz.
          </p>
        </div>

        {onBackToQuestions && (
          <Button onClick={onBackToQuestions} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Perguntas
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
