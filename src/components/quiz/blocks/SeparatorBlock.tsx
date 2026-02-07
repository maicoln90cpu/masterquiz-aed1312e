import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, Minus, HelpCircle } from "lucide-react";
import type { SeparatorBlock as SeparatorBlockType } from "@/types/blocks";

interface SeparatorBlockProps {
  block: SeparatorBlockType;
  onChange: (block: SeparatorBlockType) => void;
}

export const SeparatorBlock = ({ block, onChange }: SeparatorBlockProps) => {
  const updateBlock = (updates: Partial<SeparatorBlockType>) => {
    onChange({ ...block, ...updates });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <Minus className="h-4 w-4" />
            <span>Separador</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicione linhas ou espaços para separar visualmente seções do quiz</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`style-${block.id}`}>Estilo</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tipo do separador: Linha contínua, Pontilhado, Tracejado ou Espaço em branco</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={block.style} onValueChange={(value: any) => updateBlock({ style: value })}>
                <SelectTrigger id={`style-${block.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Linha Contínua</SelectItem>
                  <SelectItem value="dots">Pontilhado</SelectItem>
                  <SelectItem value="dashes">Tracejado</SelectItem>
                  <SelectItem value="space">Espaço em Branco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {block.style !== 'space' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`thickness-${block.id}`}>Espessura</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Espessura da linha: Fina, Média ou Grossa</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={block.thickness || 'medium'} onValueChange={(value: any) => updateBlock({ thickness: value })}>
                    <SelectTrigger id={`thickness-${block.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thin">Fina</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="thick">Grossa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`color-${block.id}`}>Cor</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cor da linha. Clique para escolher uma cor personalizada</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id={`color-${block.id}`}
                    type="color"
                    value={block.color || '#cccccc'}
                    onChange={(e) => updateBlock({ color: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

        {/* Preview */}
        <div className="pt-4">
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
