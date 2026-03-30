import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import type { PriceBlock as PriceBlockType, QuizBlock } from "@/types/blocks";
import { PriceBlockPreview } from "../preview/StaticBlockPreviews";

interface PriceBlockProps {
  block: PriceBlockType;
  onChange: (block: PriceBlockType) => void;
}

export const PriceBlock = ({ block, onChange }: PriceBlockProps) => {
  const features = block.features || ['Recurso 1'];
  const safeBlock = { ...block, features };

  const updateBlock = (updates: Partial<PriceBlockType>) => {
    onChange({ ...safeBlock, ...updates });
  };

  const addFeature = () => {
    updateBlock({ features: [...features, ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const feats = [...features];
    feats[index] = value;
    updateBlock({ features: feats });
  };

  const removeFeature = (index: number) => {
    updateBlock({ features: features.filter((_, i) => i !== index) });
  };

  return (
    <Card className="border-2 border-muted">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          <span>Preço</span>
        </div>

        {/* Content: Plan name & price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`price-plan-${block.id}`}>Nome do Plano *</Label>
            <Input
              id={`price-plan-${block.id}`}
              placeholder="Premium"
              value={block.planName}
              onChange={(e) => updateBlock({ planName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`price-value-${block.id}`}>Preço *</Label>
            <Input
              id={`price-value-${block.id}`}
              placeholder="99,90"
              value={block.price}
              onChange={(e) => updateBlock({ price: e.target.value })}
            />
          </div>
        </div>

        {/* Content: Features list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Recursos/Benefícios</Label>
            <Button onClick={addFeature} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Recurso ${index + 1}`}
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                />
                <Button
                  onClick={() => removeFeature(index)}
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  disabled={features.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview WYSIWYG real */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <PriceBlockPreview block={safeBlock as unknown as QuizBlock & { type: 'price' }} />
        </div>

        <p className="text-xs text-muted-foreground">
          Configure moeda, período, desconto, botão e destaque no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
