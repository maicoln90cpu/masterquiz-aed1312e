import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import type { ComparisonBlock as ComparisonBlockType } from "@/types/blocks";
import { ComparisonBlockPreview } from "../preview/InteractiveBlockPreviews";

interface ComparisonBlockProps {
  block: ComparisonBlockType;
  onChange: (block: ComparisonBlockType) => void;
}

export const ComparisonBlock = ({ block, onChange }: ComparisonBlockProps) => {
  const leftItems = block.leftItems || ['Item esquerda'];
  const rightItems = block.rightItems || ['Item direita'];
  const safeBlock = { ...block, leftItems, rightItems };

  const updateLeftItem = (index: number, value: string) => {
    const newItems = [...leftItems];
    newItems[index] = value;
    onChange({ ...safeBlock, leftItems: newItems });
  };

  const updateRightItem = (index: number, value: string) => {
    const newItems = [...rightItems];
    newItems[index] = value;
    onChange({ ...safeBlock, rightItems: newItems });
  };

  const addRow = () => {
    onChange({ ...safeBlock, leftItems: [...leftItems, 'Novo item'], rightItems: [...rightItems, 'Novo item'] });
  };

  const removeRow = (index: number) => {
    if (leftItems.length <= 1) return;
    onChange({
      ...safeBlock,
      leftItems: leftItems.filter((_, i) => i !== index),
      rightItems: rightItems.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>⚖️ Bloco Comparação</span>
        </div>

        {/* Content: Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Título Esquerda</Label>
            <Input value={block.leftTitle} onChange={(e) => onChange({ ...block, leftTitle: e.target.value })} placeholder="Antes / Sem..." />
          </div>
          <div className="space-y-2">
            <Label>Título Direita</Label>
            <Input value={block.rightTitle} onChange={(e) => onChange({ ...block, rightTitle: e.target.value })} placeholder="Depois / Com..." />
          </div>
        </div>

        {/* Content: Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Itens de Comparação</Label>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {leftItems.map((_, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input value={leftItems[index]} onChange={(e) => updateLeftItem(index, e.target.value)} className="flex-1" placeholder="Item esquerda" />
              <Input value={rightItems[index] || ''} onChange={(e) => updateRightItem(index, e.target.value)} className="flex-1" placeholder="Item direita" />
              <Button variant="ghost" size="sm" onClick={() => removeRow(index)} disabled={leftItems.length <= 1} className="self-end sm:self-auto">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* ✅ Etapa 3: Preview real — WYSIWYG com ícones, highlightWinner, cores */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview (ao vivo)</p>
          <ComparisonBlockPreview block={block as any} />
        </div>

        <p className="text-xs text-muted-foreground">
          Configure estilos e ícones no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
