import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnimatedCounterBlock as AnimatedCounterBlockType } from "@/types/blocks";

interface AnimatedCounterBlockProps {
  block: AnimatedCounterBlockType;
  onChange: (block: AnimatedCounterBlockType) => void;
}

export const AnimatedCounterBlock = ({ block, onChange }: AnimatedCounterBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span>🔢 Contador Animado</span>
        </div>

        <div className="space-y-2">
          <Label>Label / Descrição</Label>
          <Input
            value={block.label || ''}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Ex: Clientes satisfeitos"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valor Inicial</Label>
            <Input
              type="number"
              value={block.startValue}
              onChange={(e) => onChange({ ...block, startValue: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor Final</Label>
            <Input
              type="number"
              value={block.endValue}
              onChange={(e) => onChange({ ...block, endValue: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prefixo</Label>
            <Input
              value={block.prefix || ''}
              onChange={(e) => onChange({ ...block, prefix: e.target.value })}
              placeholder="Ex: R$"
            />
          </div>
          <div className="space-y-2">
            <Label>Sufixo</Label>
            <Input
              value={block.suffix || ''}
              onChange={(e) => onChange({ ...block, suffix: e.target.value })}
              placeholder="Ex: +, %, unid."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duração (seg)</Label>
            <Input
              type="number"
              value={block.duration}
              min={0.5}
              max={10}
              step={0.5}
              onChange={(e) => onChange({ ...block, duration: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Easing</Label>
            <Select
              value={block.easing || 'easeOut'}
              onValueChange={(v) => onChange({ ...block, easing: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="easeOut">Ease Out</SelectItem>
                <SelectItem value="easeInOut">Ease In-Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tamanho</Label>
            <Select
              value={block.fontSize || 'large'}
              onValueChange={(v) => onChange({ ...block, fontSize: v as any })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeno</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
                <SelectItem value="xlarge">Extra Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <Input
              type="color"
              value={block.color || '#10b981'}
              onChange={(e) => onChange({ ...block, color: e.target.value })}
              className="h-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={block.separator ?? true}
            onCheckedChange={(checked) => onChange({ ...block, separator: checked })}
          />
          <Label className="text-sm">Separador de milhar</Label>
        </div>

        {/* Preview */}
        <div className="p-6 bg-muted/50 rounded-lg text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <p className={`font-bold ${
            block.fontSize === 'xlarge' ? 'text-6xl' :
            block.fontSize === 'large' ? 'text-4xl' :
            block.fontSize === 'medium' ? 'text-2xl' : 'text-xl'
          }`} style={{ color: block.color || '#10b981' }}>
            {block.prefix}{block.separator ? block.endValue.toLocaleString('pt-BR') : block.endValue}{block.suffix}
          </p>
          {block.label && <p className="text-muted-foreground text-sm">{block.label}</p>}
        </div>
      </CardContent>
    </Card>
  );
};
