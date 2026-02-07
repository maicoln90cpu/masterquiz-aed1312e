import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CountdownBlock as CountdownBlockType } from "@/types/blocks";
import { useEffect, useState } from "react";

interface CountdownBlockProps {
  block: CountdownBlockType;
  onChange: (block: CountdownBlockType) => void;
}

export default function CountdownBlock({ block, onChange }: CountdownBlockProps) {
  const [previewTime, setPreviewTime] = useState({ days: 0, hours: 1, minutes: 30, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewTime(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Modo</Label>
        <RadioGroup
          value={block.mode || 'duration'}
          onValueChange={(value: any) => onChange({ ...block, mode: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="duration" id="duration" />
            <Label htmlFor="duration">Duração em Segundos</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="date" id="date" />
            <Label htmlFor="date">Data Específica</Label>
          </div>
        </RadioGroup>
      </div>

      {block.mode === 'duration' ? (
        <div className="space-y-2">
          <Label>Duração (segundos)</Label>
          <Input
            type="number"
            value={block.duration || 300}
            onChange={(e) => onChange({ ...block, duration: parseInt(e.target.value) || 300 })}
            min={1}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Data Alvo</Label>
          <Input
            type="datetime-local"
            value={block.targetDate?.slice(0, 16) || ''}
            onChange={(e) => onChange({ ...block, targetDate: new Date(e.target.value).toISOString() })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Unidades Visíveis</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="showDays"
              checked={block.showDays}
              onCheckedChange={(checked) => onChange({ ...block, showDays: checked })}
            />
            <Label htmlFor="showDays" className="text-sm whitespace-nowrap">Dias</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="showHours"
              checked={block.showHours}
              onCheckedChange={(checked) => onChange({ ...block, showHours: checked })}
            />
            <Label htmlFor="showHours" className="text-sm whitespace-nowrap">Horas</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="showMinutes"
              checked={block.showMinutes}
              onCheckedChange={(checked) => onChange({ ...block, showMinutes: checked })}
            />
            <Label htmlFor="showMinutes" className="text-sm whitespace-nowrap">Minutos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="showSeconds"
              checked={block.showSeconds}
              onCheckedChange={(checked) => onChange({ ...block, showSeconds: checked })}
            />
            <Label htmlFor="showSeconds" className="text-sm whitespace-nowrap">Segundos</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Estilo Visual</Label>
        <Select
          value={block.style || 'default'}
          onValueChange={(value: any) => onChange({ ...block, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="minimal">Minimalista</SelectItem>
            <SelectItem value="bold">Negrito</SelectItem>
            <SelectItem value="card">Card</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mensagem ao Expirar</Label>
        <Textarea
          value={block.expiryMessage || ''}
          onChange={(e) => onChange({ ...block, expiryMessage: e.target.value })}
          placeholder="Oferta expirada!"
        />
      </div>

      <div className="space-y-2">
        <Label>Ação ao Expirar</Label>
        <Select
          value={block.expiryAction || 'none'}
          onValueChange={(value: any) => onChange({ ...block, expiryAction: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="hide">Ocultar Bloco</SelectItem>
            <SelectItem value="redirect">Redirecionar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {block.expiryAction === 'redirect' && (
        <div className="space-y-2">
          <Label>URL de Redirecionamento</Label>
          <Input
            type="url"
            value={block.redirectUrl || ''}
            onChange={(e) => onChange({ ...block, redirectUrl: e.target.value })}
            placeholder="https://exemplo.com"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Cor Primária</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={block.primaryColor || '#ef4444'}
            onChange={(e) => onChange({ ...block, primaryColor: e.target.value })}
            className="w-14 sm:w-20 h-10 shrink-0"
          />
          <Input
            type="text"
            value={block.primaryColor || '#ef4444'}
            onChange={(e) => onChange({ ...block, primaryColor: e.target.value })}
            placeholder="#ef4444"
            className="flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground mb-3">Preview</p>
        <div className={`flex gap-2 justify-center ${block.style === 'card' ? 'flex-wrap' : ''}`}>
          {block.showDays && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.days.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">dias</div>
            </div>
          )}
          {block.showHours && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">horas</div>
            </div>
          )}
          {block.showMinutes && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">min</div>
            </div>
          )}
          {block.showSeconds && (
            <div className={`text-center ${block.style === 'card' ? 'p-3 bg-background rounded-lg shadow-sm' : ''}`}>
              <div className={`${block.style === 'bold' ? 'text-3xl font-bold' : 'text-2xl font-semibold'}`} style={{ color: block.primaryColor }}>
                {previewTime.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">seg</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
