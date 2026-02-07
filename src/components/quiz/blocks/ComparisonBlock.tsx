import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X, Check } from "lucide-react";
import type { ComparisonBlock as ComparisonBlockType } from "@/types/blocks";

interface ComparisonBlockProps {
  block: ComparisonBlockType;
  onChange: (block: ComparisonBlockType) => void;
}

export const ComparisonBlock = ({ block, onChange }: ComparisonBlockProps) => {
  const updateLeftItem = (index: number, value: string) => {
    const newItems = [...block.leftItems];
    newItems[index] = value;
    onChange({ ...block, leftItems: newItems });
  };

  const updateRightItem = (index: number, value: string) => {
    const newItems = [...block.rightItems];
    newItems[index] = value;
    onChange({ ...block, rightItems: newItems });
  };

  const addRow = () => {
    onChange({
      ...block,
      leftItems: [...block.leftItems, 'Novo item'],
      rightItems: [...block.rightItems, 'Novo item']
    });
  };

  const removeRow = (index: number) => {
    if (block.leftItems.length <= 1) return;
    onChange({
      ...block,
      leftItems: block.leftItems.filter((_, i) => i !== index),
      rightItems: block.rightItems.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span>⚖️ Bloco Comparação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título Esquerda</Label>
            <Input
              value={block.leftTitle}
              onChange={(e) => onChange({ ...block, leftTitle: e.target.value })}
              placeholder="Antes / Plano A / Sem..."
            />
          </div>
          <div className="space-y-2">
            <Label>Título Direita</Label>
            <Input
              value={block.rightTitle}
              onChange={(e) => onChange({ ...block, rightTitle: e.target.value })}
              placeholder="Depois / Plano B / Com..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estilo Esquerda</Label>
            <Select
              value={block.leftStyle || 'negative'}
              onValueChange={(v) => onChange({ ...block, leftStyle: v as ComparisonBlockType['leftStyle'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negative">Negativo (vermelho)</SelectItem>
                <SelectItem value="neutral">Neutro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estilo Direita</Label>
            <Select
              value={block.rightStyle || 'positive'}
              onValueChange={(v) => onChange({ ...block, rightStyle: v as ComparisonBlockType['rightStyle'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positivo (verde)</SelectItem>
                <SelectItem value="neutral">Neutro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={block.showIcons ?? true}
            onCheckedChange={(checked) => onChange({ ...block, showIcons: checked })}
          />
          <Label className="text-sm whitespace-nowrap">Mostrar ícones (X / ✓)</Label>
        </div>

        {/* Items Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Itens de Comparação</Label>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Linha
            </Button>
          </div>

          {block.leftItems.map((_, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                value={block.leftItems[index]}
                onChange={(e) => updateLeftItem(index, e.target.value)}
                className="flex-1"
                placeholder="Item esquerda"
              />
              <Input
                value={block.rightItems[index]}
                onChange={(e) => updateRightItem(index, e.target.value)}
                className="flex-1"
                placeholder="Item direita"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow(index)}
                disabled={block.leftItems.length <= 1}
                className="self-end sm:self-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className={`p-4 rounded-lg ${block.leftStyle === 'negative' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-muted'}`}>
              <h4 className={`font-semibold mb-3 ${block.leftStyle === 'negative' ? 'text-red-600' : ''}`}>
                {block.leftTitle}
              </h4>
              <ul className="space-y-2">
                {block.leftItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    {block.showIcons && (
                      <X className={`h-4 w-4 ${block.leftStyle === 'negative' ? 'text-red-500' : 'text-muted-foreground'}`} />
                    )}
                    <span className={block.leftStyle === 'negative' ? 'text-red-700 dark:text-red-400' : ''}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Right Column */}
            <div className={`p-4 rounded-lg ${block.rightStyle === 'positive' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted'}`}>
              <h4 className={`font-semibold mb-3 ${block.rightStyle === 'positive' ? 'text-green-600' : ''}`}>
                {block.rightTitle}
              </h4>
              <ul className="space-y-2">
                {block.rightItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    {block.showIcons && (
                      <Check className={`h-4 w-4 ${block.rightStyle === 'positive' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    )}
                    <span className={block.rightStyle === 'positive' ? 'text-green-700 dark:text-green-400' : ''}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};