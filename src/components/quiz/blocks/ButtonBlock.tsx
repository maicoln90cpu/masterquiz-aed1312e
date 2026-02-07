import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MousePointer, HelpCircle, ExternalLink, ArrowRight, Navigation } from "lucide-react";
import type { ButtonBlock as ButtonBlockType } from "@/types/blocks";

interface ButtonBlockProps {
  block: ButtonBlockType;
  onChange: (block: ButtonBlockType) => void;
  totalQuestions?: number; // Número total de perguntas para o select de "ir para pergunta"
  currentQuestionIndex?: number; // Índice atual da pergunta (0-based)
}

export const ButtonBlock = ({ block, onChange, totalQuestions = 0, currentQuestionIndex = 0 }: ButtonBlockProps) => {
  const updateBlock = (updates: Partial<ButtonBlockType>) => {
    onChange({ ...block, ...updates });
  };

  // Gerar opções de perguntas para o select
  const questionOptions = Array.from({ length: totalQuestions }, (_, i) => ({
    value: i + 1, // 1-based para o usuário
    label: `Pergunta ${i + 1}`,
    disabled: i === currentQuestionIndex // Não permitir navegar para a própria pergunta
  }));

  return (
    <TooltipProvider>
      <Card className="border-2 border-blue-500/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <MousePointer className="h-4 w-4" />
            <span>Botão</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicione botões para direcionar usuários a links externos ou navegar entre perguntas</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`button-text-${block.id}`}>Texto do Botão *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Texto que aparece dentro do botão. Seja claro sobre a ação</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={`button-text-${block.id}`}
              placeholder="Clique aqui"
              value={block.text}
              onChange={(e) => updateBlock({ text: e.target.value })}
            />
          </div>

          {/* Seletor de Ação */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`button-action-${block.id}`}>Ação do Botão</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Escolha o que acontece ao clicar no botão</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select 
              value={block.action || 'link'} 
              onValueChange={(value: 'link' | 'next_question' | 'go_to_question') => {
                updateBlock({ 
                  action: value,
                  // Limpar campos irrelevantes ao trocar ação
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
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <span>Link externo</span>
                  </div>
                </SelectItem>
                <SelectItem value="next_question">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Próxima pergunta</span>
                  </div>
                </SelectItem>
                <SelectItem value="go_to_question">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    <span>Ir para pergunta específica</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo URL - Visível apenas para action = 'link' */}
          {(block.action === 'link' || !block.action) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`button-url-${block.id}`}>URL</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Link de destino ao clicar no botão</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id={`button-url-${block.id}`}
                placeholder="https://exemplo.com"
                value={block.url || ''}
                onChange={(e) => updateBlock({ url: e.target.value })}
                type="url"
              />
            </div>
          )}

          {/* Select de Pergunta - Visível apenas para action = 'go_to_question' */}
          {block.action === 'go_to_question' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`button-target-${block.id}`}>Ir para</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Selecione a pergunta de destino</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
                      <SelectItem 
                        key={option.value} 
                        value={option.value.toString()}
                        disabled={option.disabled}
                      >
                        {option.label} {option.disabled ? "(atual)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma outra pergunta disponível. Adicione mais perguntas ao quiz.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`button-variant-${block.id}`}>Estilo</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Visual do botão: Padrão (preenchido), Contorno, Secundário ou Fantasma</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={block.variant || 'default'} 
                onValueChange={(value: 'default' | 'outline' | 'secondary' | 'ghost') => updateBlock({ variant: value })}
              >
                <SelectTrigger id={`button-variant-${block.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="outline">Contorno</SelectItem>
                  <SelectItem value="secondary">Secundário</SelectItem>
                  <SelectItem value="ghost">Fantasma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`button-size-${block.id}`}>Tamanho</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tamanho do botão: Pequeno, Médio ou Grande</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={block.size || 'default'} 
                onValueChange={(value: 'sm' | 'default' | 'lg') => updateBlock({ size: value })}
              >
                <SelectTrigger id={`button-size-${block.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="default">Médio</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Abrir em nova aba - Apenas para links */}
          {(block.action === 'link' || !block.action) && (
            <div className="flex items-center gap-2">
              <Switch
                id={`button-new-tab-${block.id}`}
                checked={block.openInNewTab || false}
                onCheckedChange={(checked) => updateBlock({ openInNewTab: checked })}
              />
              <Label htmlFor={`button-new-tab-${block.id}`} className="cursor-pointer">
                Abrir em nova aba
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Se ativado, o link abre em uma nova aba do navegador mantendo o quiz aberto</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
