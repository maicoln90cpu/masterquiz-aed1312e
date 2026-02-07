import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { LoadingBlock as LoadingBlockType } from "@/types/blocks";

interface LoadingBlockProps {
  block: LoadingBlockType;
  onChange: (block: LoadingBlockType) => void;
}

export const LoadingBlock = ({ block, onChange }: LoadingBlockProps) => {
  const updateBlock = (updates: Partial<LoadingBlockType>) => {
    onChange({ ...block, ...updates });
  };

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
    <Card className="border-2 border-orange-500/20">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
          <Loader2 className="h-4 w-4" />
          <span>Loading / Carregamento</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`loading-duration-${block.id}`}>Duração (segundos) *</Label>
          <Input
            id={`loading-duration-${block.id}`}
            type="number"
            min={1}
            max={60}
            step={0.5}
            placeholder="3"
            value={block.duration}
            onChange={(e) => updateBlock({ duration: parseFloat(e.target.value) || 3 })}
          />
          <p className="text-xs text-muted-foreground">
            Tempo que o loading será exibido antes de avançar automaticamente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`loading-message-${block.id}`}>Mensagem durante o carregamento (opcional)</Label>
          <Input
            id={`loading-message-${block.id}`}
            placeholder="Carregando..."
            value={block.message || ''}
            onChange={(e) => updateBlock({ message: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`loading-completion-${block.id}`}>Mensagem de conclusão (opcional)</Label>
          <Input
            id={`loading-completion-${block.id}`}
            placeholder="Pronto! Continue..."
            value={block.completionMessage || ''}
            onChange={(e) => updateBlock({ completionMessage: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Mensagem exibida quando o loading termina
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`loading-spinner-${block.id}`}>Tipo de Animação</Label>
          <Select 
            value={block.spinnerType || 'spinner'} 
            onValueChange={(value: any) => updateBlock({ spinnerType: value })}
          >
            <SelectTrigger id={`loading-spinner-${block.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spinner">Spinner Rotativo</SelectItem>
              <SelectItem value="dots">Pontos Saltitantes</SelectItem>
              <SelectItem value="pulse">Pulso</SelectItem>
              <SelectItem value="bars">Barras</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id={`loading-auto-advance-${block.id}`}
            checked={block.autoAdvance !== false}
            onCheckedChange={(checked) => updateBlock({ autoAdvance: checked })}
          />
          <Label htmlFor={`loading-auto-advance-${block.id}`} className="cursor-pointer text-sm whitespace-nowrap">
            Avançar automaticamente
          </Label>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-8 bg-muted/20 flex flex-col items-center justify-center gap-4">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          {renderSpinnerPreview()}
          {block.message && (
            <p className="text-sm text-muted-foreground">{block.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ⏱️ {block.duration}s
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
