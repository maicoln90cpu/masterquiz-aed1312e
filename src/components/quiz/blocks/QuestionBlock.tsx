import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, GripVertical, HelpCircle } from "lucide-react";
import type { QuestionBlock as QuestionBlockType } from "@/types/blocks";
import { normalizeOption } from "@/types/blocks";
import { RichTextEditor } from "./RichTextEditor";
import { EmojiPicker } from "./EmojiPicker";
import { OptionAutocomplete } from "./OptionAutocomplete";

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

  const formatLabel = (() => {
    switch (block.answerFormat) {
      case 'yes_no': return 'Sim ou Não';
      case 'single_choice': return 'Escolha Única';
      case 'multiple_choice': return 'Múltipla Escolha';
      case 'short_text': return 'Texto Curto';
      default: return block.answerFormat;
    }
  })();

  return (
    <TooltipProvider>
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <GripVertical className="h-4 w-4" />
            <span>Pergunta</span>
            <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">{formatLabel}</span>
          </div>

          {/* Texto da Pergunta - CONTEÚDO PRINCIPAL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Texto da Pergunta *</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use negrito, itálico e cores para destacar partes importantes</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RichTextEditor
              value={block.questionText}
              onChange={(value) => updateBlock({ questionText: value })}
              placeholder="Digite sua pergunta aqui..."
              minHeight="120px"
            />
          </div>

          {/* Opções de Resposta - só para choice/yes_no */}
          {(block.answerFormat === 'single_choice' || block.answerFormat === 'multiple_choice') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opções de Resposta</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Opção
                </Button>
              </div>

              <div className="space-y-2">
                {(block.options || []).map((option, index) => (
                  <div key={index} className="flex flex-row gap-1 items-center">
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
                😊 Emoji + 💡 Pontos para resultados condicionais
              </p>
            </div>
          )}

          {block.answerFormat === 'yes_no' && (
            <div className="space-y-2">
              <Label>Configuração Sim/Não</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <EmojiPicker value={block.emojis?.[0] || '✅'} onChange={(emoji) => updateEmoji(0, emoji)} />
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
                    <EmojiPicker value={block.emojis?.[1] || '❌'} onChange={(emoji) => updateEmoji(1, emoji)} />
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
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Configure formato, subtítulo, obrigatoriedade e auto-avanço no painel de propriedades →
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
