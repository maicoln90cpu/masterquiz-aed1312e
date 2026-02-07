import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image, Video, Minus, Type, ExternalLink, TrendingUp, DollarSign, Plus } from "lucide-react";
import { createBlock } from "@/types/blocks";
import type { QuizBlock } from "@/types/blocks";
import { toast } from "sonner";

interface AISuggestion {
  mediaType?: 'image' | 'video' | null;
  mediaReason?: string;
  additionalBlocks?: Array<{
    type: 'separator' | 'button' | 'text' | 'price' | 'metrics';
    reason: string;
    position: 'before' | 'after';
  }>;
}

interface AISuggestionsSidebarProps {
  suggestions: AISuggestion | null;
  currentBlocks: QuizBlock[];
  onAddBlock: (block: QuizBlock, position: 'before' | 'after') => void;
}

export const AISuggestionsSidebar = ({ 
  suggestions, 
  currentBlocks,
  onAddBlock 
}: AISuggestionsSidebarProps) => {
  if (!suggestions) {
    return null;
  }

  const hasAnySuggestions = 
    suggestions.mediaType || 
    (suggestions.additionalBlocks && suggestions.additionalBlocks.length > 0);

  if (!hasAnySuggestions) {
    return null;
  }

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'separator':
        return <Minus className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'button':
        return <ExternalLink className="h-4 w-4" />;
      case 'price':
        return <DollarSign className="h-4 w-4" />;
      case 'metrics':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Plus className="h-4 w-4" />;
    }
  };

  const getBlockLabel = (type: string) => {
    switch (type) {
      case 'image':
        return 'Imagem';
      case 'video':
        return 'Vídeo';
      case 'separator':
        return 'Separador';
      case 'text':
        return 'Texto';
      case 'button':
        return 'Botão';
      case 'price':
        return 'Preço';
      case 'metrics':
        return 'Métricas';
      default:
        return 'Bloco';
    }
  };

  const handleAddBlock = (type: string, position: 'before' | 'after') => {
    const nextOrder = Math.max(...currentBlocks.map(b => b.order), -1) + 1;
    const newBlock = createBlock(type as any, nextOrder);
    onAddBlock(newBlock, position);
    toast.success(`${getBlockLabel(type)} adicionado ${position === 'before' ? 'antes' : 'depois'} da pergunta`);
  };

  return (
    <div className="w-80 space-y-4 sticky top-4">
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Sugestões da IA</CardTitle>
          </div>
          <CardDescription>
            Sugestões estratégicas para melhorar esta pergunta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Media Suggestion */}
          {suggestions.mediaType && (
            <Card className="border border-muted">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center gap-2">
                  {getBlockIcon(suggestions.mediaType)}
                  <CardTitle className="text-sm font-semibold">
                    Adicionar {getBlockLabel(suggestions.mediaType)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {suggestions.mediaReason || 'Adicione mídia para aumentar o engajamento'}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleAddBlock(suggestions.mediaType!, 'before')}
                  >
                    Antes
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 text-xs h-7"
                    onClick={() => handleAddBlock(suggestions.mediaType!, 'after')}
                  >
                    Depois
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Blocks Suggestions */}
          {suggestions.additionalBlocks && suggestions.additionalBlocks.map((suggestion, index) => (
            <Card key={index} className="border border-muted">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getBlockIcon(suggestion.type)}
                    <CardTitle className="text-sm font-semibold">
                      {getBlockLabel(suggestion.type)}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {suggestion.position === 'before' ? 'Antes' : 'Depois'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {suggestion.reason}
                </p>
                <Button 
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() => handleAddBlock(suggestion.type, suggestion.position)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar {suggestion.position === 'before' ? 'Antes' : 'Depois'}
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Info Card */}
          <Card className="bg-muted/30 border-muted">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                💡 As sugestões da IA são baseadas em melhores práticas de qualificação de leads. Você pode personalizar cada bloco após adicioná-lo.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
