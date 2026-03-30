import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MousePointer, HelpCircle, ExternalLink, ArrowRight, Navigation } from "lucide-react";
import type { ButtonBlock as ButtonBlockType } from "@/types/blocks";

interface ButtonBlockProps {
  block: ButtonBlockType;
  onChange: (block: ButtonBlockType) => void;
  totalQuestions?: number;
  currentQuestionIndex?: number;
}

export const ButtonBlock = ({ block, onChange, totalQuestions = 0, currentQuestionIndex = 0 }: ButtonBlockProps) => {
  const updateBlock = (updates: Partial<ButtonBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const questionOptions = Array.from({ length: totalQuestions }, (_, i) => ({
    value: i + 1,
    label: `Pergunta ${i + 1}`,
    disabled: i === currentQuestionIndex
  }));

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
                <p>Configure estilo, tamanho e abertura em nova aba no painel de propriedades.</p>
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

          {/* Content: Action */}
          <div className="space-y-2">
            <Label htmlFor={`button-action-${block.id}`}>Ação do Botão</Label>
            <Select
              value={block.action || 'link'}
              onValueChange={(value: 'link' | 'next_question' | 'go_to_question') => {
                updateBlock({
                  action: value,
                  url: value === 'link' ? block.url : undefined,
                  targetQuestionIndex: value === 'go_to_question' ? block.targetQuestionIndex : undefined
                });
              }}
            >
              <SelectTrigger id={`button-action-${block.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">
                  <div className="flex items-center gap-2"><ExternalLink className="h-4 w-4" /> Link externo</div>
                </SelectItem>
                <SelectItem value="next_question">
                  <div className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Próxima pergunta</div>
                </SelectItem>
                <SelectItem value="go_to_question">
                  <div className="flex items-center gap-2"><Navigation className="h-4 w-4" /> Ir para pergunta</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content: URL (for link action) */}
          {(block.action === 'link' || !block.action) && (
            <div className="space-y-2">
              <Label htmlFor={`button-url-${block.id}`}>URL</Label>
              <Input
                id={`button-url-${block.id}`}
                placeholder="https://exemplo.com"
                value={block.url || ''}
                onChange={(e) => updateBlock({ url: e.target.value })}
                type="url"
              />
            </div>
          )}

          {/* Content: Target question (for go_to_question action) */}
          {block.action === 'go_to_question' && (
            <div className="space-y-2">
              <Label htmlFor={`button-target-${block.id}`}>Ir para</Label>
              {totalQuestions > 0 ? (
                <Select
                  value={block.targetQuestionIndex?.toString() || ''}
                  onValueChange={(value) => updateBlock({ targetQuestionIndex: parseInt(value, 10) })}
                >
                  <SelectTrigger id={`button-target-${block.id}`}>
                    <SelectValue placeholder="Selecione uma pergunta" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} disabled={option.disabled}>
                        {option.label} {option.disabled ? "(atual)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma pergunta disponível.</p>
              )}
            </div>
          )}

          {/* Preview WYSIWYG do botão */}
          {block.text && (
            <div className="pt-2 border-t">
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
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
