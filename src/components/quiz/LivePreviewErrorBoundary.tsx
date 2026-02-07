import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LivePreviewErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LivePreview Error]:', error);
    console.error('[Error Info]:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="sticky top-4 p-6 bg-muted/50">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao renderizar preview</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p className="text-sm">
                Não foi possível exibir o preview em tempo real. Possíveis causas:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                <li>Perguntas com blocos malformados ou vazios</li>
                <li>Opções de resposta ausentes</li>
                <li>Dados incompletos nas perguntas</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                💡 Dica: Use o "Preview Interativo" na aba de edição de perguntas para visualizar seu quiz.
              </p>
            </AlertDescription>
          </Alert>
        </Card>
      );
    }

    return this.props.children;
  }
}
