import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MousePointer, HelpCircle } from "lucide-react";
import type { ButtonBlock as ButtonBlockType } from "@/types/blocks";

interface ButtonBlockProps {
  block: ButtonBlockType;
  onChange: (block: ButtonBlockType) => void;
  totalQuestions?: number;
  currentQuestionIndex?: number;
}

export const ButtonBlock = ({ block, onChange }: ButtonBlockProps) => {
  const updateBlock = (updates: Partial<ButtonBlockType>) => {
    onChange({ ...block, ...updates });
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-muted">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MousePointer className="h-4 w-4" />
            <span>Botão</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure ação, URL, estilo e tamanho no painel de propriedades →</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Content: Text */}
          <div className="space-y-2">
            <Label htmlFor={`button-text-${block.id}`}>Texto do Botão *</Label>
            <Input
              id={`button-text-${block.id}`}
              placeholder="Clique aqui"
              value={block.text}
              onChange={(e) => updateBlock({ text: e.target.value })}
            />
          </div>

          {/* Preview WYSIWYG do botão */}
          {block.text && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <div className="flex justify-center">
                <Button
                  variant={block.variant || 'default'}
                  size={block.size || 'default'}
                  className="pointer-events-none"
                  style={block.backgroundColor ? { backgroundColor: block.backgroundColor, borderColor: block.backgroundColor, color: '#fff' } : undefined}
                >
                  {block.text}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Configure ação, URL e estilo no painel →
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
