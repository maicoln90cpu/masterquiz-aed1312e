import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlignLeft, AlignCenter, AlignRight, GripVertical, Type, HelpCircle } from "lucide-react";
import type { TextBlock as TextBlockType } from "@/types/blocks";
import { RichTextEditor } from "./RichTextEditor";

interface TextBlockProps {
  block: TextBlockType;
  onChange: (block: TextBlockType) => void;
}

export const TextBlock = ({ block, onChange }: TextBlockProps) => {
  const updateBlock = (updates: Partial<TextBlockType>) => {
    onChange({ ...block, ...updates });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <Type className="h-4 w-4" />
            <span>Bloco de Texto</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicione textos formatados, descrições ou instruções ao quiz</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`text-${block.id}`}>Conteúdo</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use o editor rico para formatar o texto com negrito, itálico, listas e muito mais</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RichTextEditor
              value={block.content}
              onChange={(value) => updateBlock({ content: value })}
              placeholder="Digite o texto aqui... Use a barra de ferramentas para formatar."
              minHeight="200px"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`alignment-${block.id}`}>Alinhamento</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Defina o alinhamento do texto (esquerda, centro ou direita)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            <Select value={block.alignment} onValueChange={(value: any) => updateBlock({ alignment: value })}>
              <SelectTrigger id={`alignment-${block.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-4 w-4" />
                    Esquerda
                  </div>
                </SelectItem>
                <SelectItem value="center">
                  <div className="flex items-center gap-2">
                    <AlignCenter className="h-4 w-4" />
                    Centro
                  </div>
                </SelectItem>
                <SelectItem value="right">
                  <div className="flex items-center gap-2">
                    <AlignRight className="h-4 w-4" />
                    Direita
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`size-${block.id}`}>Tamanho</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Escolha o tamanho da fonte (pequeno, médio ou grande)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={block.fontSize} onValueChange={(value: any) => updateBlock({ fontSize: value })}>
              <SelectTrigger id={`size-${block.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
