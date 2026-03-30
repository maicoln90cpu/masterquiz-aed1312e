import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageUploader } from "@/components/ImageUploader";
import { Image as ImageIcon, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageBlock as ImageBlockType } from "@/types/blocks";

interface ImageBlockProps {
  block: ImageBlockType;
  onChange: (block: ImageBlockType) => void;
}

export const ImageBlock = ({ block, onChange }: ImageBlockProps) => {
  const sizeClass =
    block.size === 'tiny' ? 'max-w-[120px]' :
    block.size === 'small' ? 'max-w-xs' :
    block.size === 'large' ? 'max-w-2xl' :
    block.size === 'full' ? 'w-full' :
    'max-w-md';

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

          {block.url ? (
            /* ✅ Preview único com propriedades aplicadas + botão X */
            <div className="space-y-2">
              <Label>Preview ({block.size || 'medium'})</Label>
              <div className="relative p-3 bg-muted/50 rounded-lg">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-4 right-4 z-10 h-7 w-7"
                  onClick={() => onChange({ ...block, url: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className={`mx-auto ${sizeClass}`}>
                  <img
                    src={block.url}
                    alt={block.alt || 'Quiz image'}
                    className={cn(
                      "w-full h-auto object-contain",
                      (block as any).borderRadius === 'none' ? 'rounded-none' :
                      (block as any).borderRadius === 'small' ? 'rounded-md' :
                      (block as any).borderRadius === 'large' ? 'rounded-2xl' :
                      (block as any).borderRadius === 'circular' ? 'rounded-full' :
                      'rounded-lg',
                      (block as any).shadow === 'light' ? 'shadow-md' :
                      (block as any).shadow === 'medium' ? 'shadow-lg' :
                      (block as any).shadow === 'strong' ? 'shadow-2xl' :
                      ''
                    )}
                  />
                </div>
                {block.caption && (
                  <p className="text-xs text-center text-muted-foreground mt-2">{block.caption}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                ✅ Imagem carregada • Configure alt, legenda e tamanho no painel →
              </p>
            </div>
          ) : (
            /* Upload zone quando não há imagem */
            <div className="space-y-2">
              <Label>Upload de Imagem</Label>
              <ImageUploader
                value={block.url}
                onChange={(url) => onChange({ ...block, url })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
