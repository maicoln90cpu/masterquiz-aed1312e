import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageUploader } from "@/components/ImageUploader";
import { Image as ImageIcon, HelpCircle } from "lucide-react";
import type { ImageBlock as ImageBlockType } from "@/types/blocks";

interface ImageBlockProps {
  block: ImageBlockType;
  onChange: (block: ImageBlockType) => void;
}

export const ImageBlock = ({ block, onChange }: ImageBlockProps) => {
  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span>Imagem</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Faça upload da imagem. Configure alt, legenda e tamanho no painel de propriedades.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            <ImageUploader
              value={block.url}
              onChange={(url) => onChange({ ...block, url })}
            />
          </div>

          {/* ✅ Etapa 3: Preview real com tamanho respeitado */}
          {block.url && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Preview ({block.size || 'medium'})</p>
              <div className={`mx-auto ${
                block.size === 'small' ? 'max-w-xs' :
                block.size === 'large' ? 'max-w-2xl' :
                block.size === 'full' ? 'w-full' :
                'max-w-md'
              }`}>
                <img
                  src={block.url}
                  alt={block.alt || 'Quiz image'}
                  className="rounded-lg w-full h-auto object-contain"
                />
              </div>
              {block.caption && <p className="text-xs text-center text-muted-foreground mt-1">{block.caption}</p>}
            </div>
          )}

          {block.url && (
            <p className="text-xs text-muted-foreground">
              ✅ Imagem carregada • Configure alt, legenda e tamanho no painel →
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
