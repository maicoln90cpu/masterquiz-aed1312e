import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { SliderBlock as SliderBlockType } from "@/types/blocks";

interface SliderBlockProps {
  block: SliderBlockType;
  onChange: (block: SliderBlockType) => void;
}

export const SliderBlock = ({ block, onChange }: SliderBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>📊 Bloco Slider/Range</span>
        </div>

        {/* Content: Label */}
        <div className="space-y-2">
          <Label htmlFor="slider-label">Pergunta/Label</Label>
          <Input
            id="slider-label"
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Ex: Qual sua renda mensal?"
          />
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <p className="font-medium">{block.label}</p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{block.min}{block.unit}</span>
            <Slider value={[block.defaultValue ?? block.min]} min={block.min} max={block.max} step={block.step} className="flex-1" />
            <span className="text-sm text-muted-foreground">{block.max}{block.unit}</span>
          </div>
          {block.showValue && (
            <p className="text-center text-lg font-bold text-primary">
              {block.defaultValue ?? block.min}{block.unit}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Configure min/max, incremento, unidade e opções no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
