import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  blockType: string;
  onDelete?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class BlockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[BlockErrorBoundary] Bloco "${this.props.blockType}" crashou:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-2 border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium text-sm">
              Bloco "{this.props.blockType}" falhou ao renderizar
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {this.state.error?.message || "Erro desconhecido"}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={this.handleRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar novamente
            </Button>
            {this.props.onDelete && (
              <Button size="sm" variant="destructive" onClick={this.props.onDelete}>
                <Trash2 className="h-3 w-3 mr-1" />
                Remover bloco
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
