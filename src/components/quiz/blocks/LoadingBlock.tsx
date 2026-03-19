import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { LoadingBlock as LoadingBlockType } from "@/types/blocks";

interface LoadingBlockProps {
  block: LoadingBlockType;
  onChange: (block: LoadingBlockType) => void;
}

export const LoadingBlock = ({ block, onChange }: LoadingBlockProps) => {
  const renderSpinnerPreview = () => {
    switch (block.spinnerType) {
      case 'spinner':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'dots':
        return (
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        );
      case 'pulse':
        return (
          <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary animate-pulse" />
          </div>
        );
      case 'bars':
        return (
          <div className="flex gap-1 items-end h-8">
            <div className="w-2 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0ms' }} />
            <div className="w-2 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '100ms' }} />
            <div className="w-2 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '80%', animationDelay: '200ms' }} />
            <div className="w-2 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '300ms' }} />
            <div className="w-2 bg-primary rounded-full animate-[bounce_1s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '400ms' }} />
          </div>
        );
    }
  };

  return (
    <Card className="border-2 border-muted">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4" />
          <span>Loading / Carregamento</span>
        </div>

        {/* Preview only — all config in properties panel */}
        <div className="border rounded-lg p-8 bg-muted/20 flex flex-col items-center justify-center gap-4">
          {renderSpinnerPreview()}
          {block.message && (
            <p className="text-sm text-muted-foreground">{block.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ⏱️ {block.duration}s • {block.spinnerType || 'spinner'} • {block.autoAdvance !== false ? 'Auto-avança' : 'Manual'}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Configure duração, mensagem, tipo de animação e comportamento no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
