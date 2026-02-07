import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TextInputBlock as TextInputBlockType } from "@/types/blocks";

interface TextInputBlockProps {
  block: TextInputBlockType;
  onChange: (block: TextInputBlockType) => void;
}

export const TextInputBlock = ({ block, onChange }: TextInputBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span>✏️ Bloco Input de Texto</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="textinput-label">Pergunta/Label</Label>
          <Input
            id="textinput-label"
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Ex: Qual seu maior objetivo?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="textinput-placeholder">Placeholder</Label>
          <Input
            id="textinput-placeholder"
            value={block.placeholder || ''}
            onChange={(e) => onChange({ ...block, placeholder: e.target.value })}
            placeholder="Texto de ajuda..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="textinput-maxlength">Limite de caracteres</Label>
            <Input
              id="textinput-maxlength"
              type="number"
              value={block.maxLength ?? 500}
              onChange={(e) => onChange({ ...block, maxLength: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="textinput-validation">Validação</Label>
            <Select
              value={block.validation || 'none'}
              onValueChange={(v) => onChange({ ...block, validation: v as TextInputBlockType['validation'] })}
            >
              <SelectTrigger id="textinput-validation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="number">Número</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={block.multiline ?? false}
              onCheckedChange={(checked) => onChange({ ...block, multiline: checked })}
            />
            <Label className="text-sm whitespace-nowrap">Múltiplas linhas</Label>
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
          <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
          {block.multiline ? (
            <Textarea
              placeholder={block.placeholder}
              maxLength={block.maxLength}
              className="resize-none"
              rows={4}
            />
          ) : (
            <Input
              placeholder={block.placeholder}
              maxLength={block.maxLength}
              type={block.validation === 'email' ? 'email' : block.validation === 'number' ? 'number' : 'text'}
            />
          )}
          {block.maxLength && (
            <p className="text-xs text-muted-foreground text-right">
              Máximo: {block.maxLength} caracteres
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};