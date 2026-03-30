import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Type, HelpCircle } from "lucide-react";
import type { TextBlock as TextBlockType } from "@/types/blocks";
import { RichTextEditor } from "./RichTextEditor";

interface TextBlockProps {
  block: TextBlockType;
  onChange: (block: TextBlockType) => void;
}

export const TextBlock = ({ block, onChange }: TextBlockProps) => {
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
                <p>Adicione textos formatados. Use o painel de propriedades para ajustar alinhamento e tamanho da fonte.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`text-${block.id}`}>Conteúdo</Label>
            <RichTextEditor
              value={block.content}
              onChange={(value) => onChange({ ...block, content: value })}
              placeholder="Digite o texto aqui... Use a barra de ferramentas para formatar."
              minHeight="200px"
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
