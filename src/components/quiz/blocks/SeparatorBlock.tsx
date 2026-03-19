import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Minus, HelpCircle } from "lucide-react";
import type { SeparatorBlock as SeparatorBlockType } from "@/types/blocks";

interface SeparatorBlockProps {
  block: SeparatorBlockType;
  onChange: (block: SeparatorBlockType) => void;
}

export const SeparatorBlock = ({ block, onChange }: SeparatorBlockProps) => {
  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Minus className="h-4 w-4" />
            <span>Separador</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure estilo, espessura e cor no painel de propriedades.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Preview */}
          <div className="pt-2">
            <div className="text-xs text-muted-foreground mb-2">Pré-visualização:</div>
            {block.style === 'space' ? (
              <div className="h-8 bg-muted/20 rounded flex items-center justify-center text-xs text-muted-foreground">
                Espaço em branco
              </div>
            ) : (
              <div
                className="w-full"
                style={{
                  borderTop: `${block.thickness === 'thin' ? '1px' : block.thickness === 'thick' ? '4px' : '2px'} ${block.style === 'line' ? 'solid' : block.style === 'dots' ? 'dotted' : 'dashed'} ${block.color || '#cccccc'}`
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
