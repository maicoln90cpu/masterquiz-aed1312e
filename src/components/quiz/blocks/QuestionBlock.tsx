import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, GripVertical, HelpCircle } from "lucide-react";
import type { QuestionBlock as QuestionBlockType } from "@/types/blocks";
import { normalizeOption } from "@/types/blocks";
import { RichTextEditor } from "./RichTextEditor";
import { EmojiPicker } from "./EmojiPicker";

interface QuestionBlockProps {
  block: QuestionBlockType;
  onChange: (block: QuestionBlockType) => void;
}

export const QuestionBlock = ({ block, onChange }: QuestionBlockProps) => {
  const { t } = useTranslation();

  const updateBlock = (updates: Partial<QuestionBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const addOption = () => {
    const options = [...(block.options || []), ''];
    const scores = [...(block.scores || []), 0];
    const emojis = [...(block.emojis || []), ''];
    updateBlock({ options, scores, emojis });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(block.options || [])];
    options[index] = value;
    updateBlock({ options });
  };

  const updateScore = (index: number, score: number) => {
    const scores = [...(block.scores || [])];
    scores[index] = score;
    updateBlock({ scores });
  };

  const updateEmoji = (index: number, emoji: string) => {
    const emojis = [...(block.emojis || [])];
    emojis[index] = emoji;
    updateBlock({ emojis });
  };

  const removeOption = (index: number) => {
    const options = (block.options || []).filter((_, i) => i !== index);
    const scores = (block.scores || []).filter((_, i) => i !== index);
    const emojis = (block.emojis || []).filter((_, i) => i !== index);
    updateBlock({ options, scores, emojis });
  };

  const handleAnswerFormatChange = (format: QuestionBlockType['answerFormat']) => {
    if (format === 'yes_no') {
      updateBlock({ answerFormat: format, options: ['Sim', 'Não'], scores: [0, 0], emojis: ['✅', '❌'] });
    } else if (format === 'short_text') {
      updateBlock({ answerFormat: format, options: [], scores: [], emojis: [] });
    } else {
      const currentOptions = block.options || ['', ''];
      const currentScores = block.scores || currentOptions.map(() => 0);
      const currentEmojis = block.emojis || currentOptions.map(() => '');
      updateBlock({ answerFormat: format, options: currentOptions, scores: currentScores, emojis: currentEmojis });
    }
  };

  return (
    <TooltipProvider>
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <GripVertical className="h-4 w-4" />
            <span>Pergunta</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Bloco de pergunta - Configure a pergunta e suas opções de resposta</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`question-${block.id}`}>Texto da Pergunta *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Digite a pergunta principal. Use negrito, itálico e cores para destacar partes importantes</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RichTextEditor
              value={block.questionText}
              onChange={(value) => updateBlock({ questionText: value })}
              placeholder="Digite sua pergunta aqui... Use a barra de ferramentas para formatar."
              minHeight="150px"
            />
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`subtitle-${block.id}`}>Subtítulo (opcional)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Texto complementar que aparece logo abaixo da pergunta principal</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={`subtitle-${block.id}`}
              placeholder="Texto complementar..."
              value={block.subtitle || ''}
              onChange={(e) => updateBlock({ subtitle: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor={`hint-${block.id}`}>Dica/Tooltip (opcional)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mensagem de ajuda que será exibida para orientar o usuário</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={`hint-${block.id}`}
              placeholder="Ajuda para o usuário..."
              value={block.hint || ''}
              onChange={(e) => updateBlock({ hint: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`format-${block.id}`}>Formato de Resposta</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Escolha como os usuários responderão: Sim/Não, Escolha Única, Múltipla Escolha ou Texto Curto</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={block.answerFormat} onValueChange={handleAnswerFormatChange}>
            <SelectTrigger id={`format-${block.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes_no">Sim ou Não</SelectItem>
              <SelectItem value="single_choice">Escolha Única</SelectItem>
              <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
              <SelectItem value="short_text">Texto Curto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(block.answerFormat === 'single_choice' || block.answerFormat === 'multiple_choice') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opções de Resposta</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Opção
              </Button>
            </div>

            <div className="space-y-2">
              {(block.options || []).map((option, index) => (
                <div key={index} className="flex flex-row gap-1 items-center option-row">
                  <EmojiPicker
                    value={block.emojis?.[index] || ''}
                    onChange={(emoji) => updateEmoji(index, emoji)}
                  />
                  <Input
                    placeholder={`Opção ${index + 1}`}
                    value={normalizeOption(option)}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <Input
                    type="number"
                    placeholder="Pts"
                    value={block.scores?.[index] ?? 0}
                    onChange={(e) => updateScore(index, parseInt(e.target.value) || 0)}
                    className="w-14 shrink-0"
                    title="Pontuação"
                  />
                  {(block.options?.length || 0) > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      className="shrink-0 h-8 w-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              😊 Clique no ícone de emoji para adicionar um emoji visual a cada opção. 💡 Defina pontos para resultados condicionais.
            </p>
          </div>
        )}

        {block.answerFormat === 'yes_no' && (
          <div className="space-y-2">
            <Label>Configuração Sim/Não</Label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <EmojiPicker
                    value={block.emojis?.[0] || '✅'}
                    onChange={(emoji) => updateEmoji(0, emoji)}
                  />
                  <Label className="text-sm font-medium">Sim</Label>
                </div>
                <Input
                  type="number"
                  placeholder="Pontos"
                  value={block.scores?.[0] ?? 0}
                  onChange={(e) => updateScore(0, parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <EmojiPicker
                    value={block.emojis?.[1] || '❌'}
                    onChange={(emoji) => updateEmoji(1, emoji)}
                  />
                  <Label className="text-sm font-medium">Não</Label>
                </div>
                <Input
                  type="number"
                  placeholder="Pontos"
                  value={block.scores?.[1] ?? 0}
                  onChange={(e) => updateScore(1, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              😊 Personalize emojis e pontos para cada resposta.
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Switch
              id={`required-${block.id}`}
              checked={block.required !== false}
              onCheckedChange={(checked) => updateBlock({ required: checked })}
            />
            <Label htmlFor={`required-${block.id}`} className="cursor-pointer">
              Resposta obrigatória
            </Label>
          </div>

          {(block.answerFormat === 'single_choice' || block.answerFormat === 'yes_no') && (
            <div className="flex items-center space-x-2">
              <Switch
                id={`auto-advance-${block.id}`}
                checked={block.autoAdvance || false}
                onCheckedChange={(checked) => updateBlock({ autoAdvance: checked })}
              />
              <Label htmlFor={`auto-advance-${block.id}`} className="cursor-pointer">
                Avançar automaticamente ao selecionar resposta
              </Label>
            </div>
          )}

          {/* Campo para texto personalizado do botão Próxima Pergunta */}
          {!block.autoAdvance && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`next-button-text-${block.id}`}>Texto do Botão "Próxima"</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Personalize o texto do botão de avançar para esta pergunta</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id={`next-button-text-${block.id}`}
                placeholder="Próxima Pergunta"
                value={block.nextButtonText || ''}
                onChange={(e) => updateBlock({ nextButtonText: e.target.value })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
