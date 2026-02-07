import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ProgressBlock as ProgressBlockType } from "@/types/blocks";

interface ProgressBlockProps {
  block: ProgressBlockType;
  onChange: (block: ProgressBlockType) => void;
}

export default function ProgressBlock({ block, onChange }: ProgressBlockProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select
          value={block.style || 'bar'}
          onValueChange={(value: any) => onChange({ ...block, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Barra</SelectItem>
            <SelectItem value="steps">Etapas</SelectItem>
            <SelectItem value="circle">Círculo</SelectItem>
            <SelectItem value="percentage">Percentual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={block.showPercentage}
            onCheckedChange={(checked) => onChange({ ...block, showPercentage: checked })}
          />
          <Label className="text-sm whitespace-nowrap">Mostrar Percentual</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={block.showCounter}
            onCheckedChange={(checked) => onChange({ ...block, showCounter: checked })}
          />
          <Label className="text-sm whitespace-nowrap">Mostrar Contador (X de Y)</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={block.animated}
            onCheckedChange={(checked) => onChange({ ...block, animated: checked })}
          />
          <Label className="text-sm whitespace-nowrap">Animação</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor Primária</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={block.color || '#3b82f6'}
              onChange={(e) => onChange({ ...block, color: e.target.value })}
              className="w-14 sm:w-20 h-10 shrink-0"
            />
            <Input
              type="text"
              value={block.color || '#3b82f6'}
              onChange={(e) => onChange({ ...block, color: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1 min-w-0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Altura</Label>
          <Select
            value={block.height || 'medium'}
            onValueChange={(value: any) => onChange({ ...block, height: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thin">Fina</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="thick">Grossa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-2">Preview (50% de progresso)</p>
        <div className="space-y-2">
          {block.style === 'bar' && (
            <div className="w-full bg-secondary rounded-full" style={{ height: block.height === 'thin' ? '4px' : block.height === 'thick' ? '12px' : '8px' }}>
              <div
                className={`h-full rounded-full ${block.animated ? 'transition-all duration-500' : ''}`}
                style={{ width: '50%', backgroundColor: block.color }}
              />
            </div>
          )}
          {block.style === 'percentage' && (
            <div className="text-center text-3xl font-bold" style={{ color: block.color }}>
              50%
            </div>
          )}
          {block.showPercentage && block.style !== 'percentage' && (
            <p className="text-sm text-center" style={{ color: block.color }}>50%</p>
          )}
          {block.showCounter && (
            <p className="text-sm text-center text-muted-foreground">Pergunta 5 de 10</p>
          )}
        </div>
      </div>
    </div>
  );
}
