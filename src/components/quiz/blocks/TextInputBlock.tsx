import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TextInputBlock as TextInputBlockType } from "@/types/blocks";

interface TextInputBlockProps {
  block: TextInputBlockType;
  onChange: (block: TextInputBlockType) => void;
}

export const TextInputBlock = ({ block, onChange }: TextInputBlockProps) => {
  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>✏️ Bloco Input de Texto</span>
        </div>

        {/* Content: Label & Placeholder */}
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

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <p className="font-medium">{block.label} {block.required && <span className="text-destructive">*</span>}</p>
          {block.multiline ? (
            <Textarea placeholder={block.placeholder} maxLength={block.maxLength} className="resize-none" rows={4} />
          ) : (
            <Input
              placeholder={block.placeholder}
              maxLength={block.maxLength}
              type={block.validation === 'email' ? 'email' : block.validation === 'number' ? 'number' : 'text'}
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Configure validação, limite de caracteres e multilinha no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
