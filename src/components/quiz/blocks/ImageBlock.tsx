import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageUploader } from "@/components/ImageUploader";
import { GripVertical, Image as ImageIcon, HelpCircle } from "lucide-react";
import type { ImageBlock as ImageBlockType } from "@/types/blocks";

interface ImageBlockProps {
  block: ImageBlockType;
  onChange: (block: ImageBlockType) => void;
}

export const ImageBlock = ({ block, onChange }: ImageBlockProps) => {
  const updateBlock = (updates: Partial<ImageBlockType>) => {
    onChange({ ...block, ...updates });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <ImageIcon className="h-4 w-4" />
            <span>Imagem</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicione imagens para ilustrar suas perguntas ou resultados</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Upload de Imagem</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Faça upload da imagem do seu dispositivo. Formatos: JPG, PNG, GIF</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <ImageUploader
              value={block.url}
              onChange={(url) => updateBlock({ url })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`alt-${block.id}`}>Texto Alternativo (Alt)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descrição para acessibilidade e SEO. Ajuda leitores de tela e mecanismos de busca</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={`alt-${block.id}`}
              placeholder="Descrição da imagem para acessibilidade..."
              value={block.alt || ''}
              onChange={(e) => updateBlock({ alt: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`caption-${block.id}`}>Legenda (opcional)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Texto que aparece abaixo da imagem como legenda explicativa</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={`caption-${block.id}`}
              placeholder="Texto abaixo da imagem..."
              value={block.caption || ''}
              onChange={(e) => updateBlock({ caption: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`size-${block.id}`}>Tamanho de Exibição</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Defina o tamanho da imagem no quiz (25%, 50%, 75% ou 100% da largura)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          <Select value={block.size} onValueChange={(value: any) => updateBlock({ size: value })}>
            <SelectTrigger id={`size-${block.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno (25%)</SelectItem>
              <SelectItem value="medium">Médio (50%)</SelectItem>
              <SelectItem value="large">Grande (75%)</SelectItem>
              <SelectItem value="full">Largura Total (100%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
