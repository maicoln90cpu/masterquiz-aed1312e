import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span>📊 Bloco Slider/Range</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slider-label">Pergunta/Label</Label>
          <Input
            id="slider-label"
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Ex: Qual sua renda mensal?"
          />
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slider-min">Mínimo</Label>
            <Input
              id="slider-min"
              type="number"
              value={block.min}
              onChange={(e) => onChange({ ...block, min: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slider-max">Máximo</Label>
            <Input
              id="slider-max"
              type="number"
              value={block.max}
              onChange={(e) => onChange({ ...block, max: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slider-step">Incremento</Label>
            <Input
              id="slider-step"
              type="number"
              value={block.step}
              onChange={(e) => onChange({ ...block, step: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="slider-default">Valor Inicial</Label>
            <Input
              id="slider-default"
              type="number"
              value={block.defaultValue ?? block.min}
              onChange={(e) => onChange({ ...block, defaultValue: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slider-unit">Unidade (opcional)</Label>
            <Input
              id="slider-unit"
              value={block.unit || ''}
              onChange={(e) => onChange({ ...block, unit: e.target.value })}
              placeholder="Ex: R$, kg, %"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={block.showValue ?? true}
              onCheckedChange={(checked) => onChange({ ...block, showValue: checked })}
            />
            <Label className="text-sm whitespace-nowrap">Mostrar valor</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={block.required ?? true}
              onCheckedChange={(checked) => onChange({ ...block, required: checked })}
            />
            <Label className="text-sm whitespace-nowrap">Obrigatório</Label>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <p className="font-medium">{block.label}</p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{block.min}{block.unit}</span>
            <Slider
              value={[block.defaultValue ?? block.min]}
              min={block.min}
              max={block.max}
              step={block.step}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">{block.max}{block.unit}</span>
          </div>
          {block.showValue && (
            <p className="text-center text-lg font-bold text-primary">
              {block.defaultValue ?? block.min}{block.unit}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};