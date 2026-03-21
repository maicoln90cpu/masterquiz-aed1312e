import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageUploader } from "@/components/ImageUploader";
import { Type, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TextBlock as TextBlockType } from "@/types/blocks";
import { RichTextEditor } from "./RichTextEditor";

interface TextBlockProps {
  block: TextBlockType;
  onChange: (block: TextBlockType) => void;
}

export const TextBlock = ({ block, onChange }: TextBlockProps) => {
  const imageSizeClass = {
    small: 'max-w-[200px]',
    medium: 'max-w-[400px]',
    large: 'max-w-[600px]',
    full: 'w-full',
  }[block.imageSize || 'medium'];

  const imageElement = block.imageUrl ? (
    <div className="relative group">
      <img
        src={block.imageUrl}
        alt="Imagem do bloco de texto"
        className={`rounded-lg object-cover ${imageSizeClass}`}
      />
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onChange({ ...block, imageUrl: undefined })}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  ) : null;

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Type className="h-4 w-4" />
            <span>Bloco de Texto</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicione textos formatados e imagens. Use o painel de propriedades para ajustar alinhamento, tamanho e posição da imagem.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Image above text */}
          {block.imagePosition !== 'below' && imageElement}

          <div className="space-y-2">
            <Label htmlFor={`text-${block.id}`}>Conteúdo</Label>
            <RichTextEditor
              value={block.content}
              onChange={(value) => onChange({ ...block, content: value })}
              placeholder="Digite o texto aqui... Use a barra de ferramentas para formatar."
              minHeight="200px"
            />
          </div>

          {/* Image below text */}
          {block.imagePosition === 'below' && imageElement}

          {/* Image uploader (when no image yet) */}
          {!block.imageUrl && (
            <div className="space-y-2">
              <Label>Imagem (opcional)</Label>
              <ImageUploader
                value=""
                onChange={(url) => onChange({ ...block, imageUrl: url, imagePosition: block.imagePosition || 'above' })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
