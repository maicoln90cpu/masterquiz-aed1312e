import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import type { PriceBlock as PriceBlockType } from "@/types/blocks";

interface PriceBlockProps {
  block: PriceBlockType;
  onChange: (block: PriceBlockType) => void;
}

export const PriceBlock = ({ block, onChange }: PriceBlockProps) => {
  const updateBlock = (updates: Partial<PriceBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const addFeature = () => {
    const features = [...block.features, ''];
    updateBlock({ features });
  };

  const updateFeature = (index: number, value: string) => {
    const features = [...block.features];
    features[index] = value;
    updateBlock({ features });
  };

  const removeFeature = (index: number) => {
    const features = block.features.filter((_, i) => i !== index);
    updateBlock({ features });
  };

  return (
    <Card className="border-2 border-green-500/20">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
          <DollarSign className="h-4 w-4" />
          <span>Preço</span>
        </div>

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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`price-currency-${block.id}`}>Moeda</Label>
            <Input
              id={`price-currency-${block.id}`}
              placeholder="R$"
              value={block.currency || 'R$'}
              onChange={(e) => updateBlock({ currency: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`price-period-${block.id}`}>Período</Label>
            <Input
              id={`price-period-${block.id}`}
              placeholder="/mês"
              value={block.period || ''}
              onChange={(e) => updateBlock({ period: e.target.value })}
            />
          </div>

          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label htmlFor={`price-discount-${block.id}`}>Desconto</Label>
            <Input
              id={`price-discount-${block.id}`}
              placeholder="20% OFF"
              value={block.discount || ''}
              onChange={(e) => updateBlock({ discount: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`price-original-${block.id}`}>Preço Original (riscado)</Label>
          <Input
            id={`price-original-${block.id}`}
            placeholder="149,90"
            value={block.originalPrice || ''}
            onChange={(e) => updateBlock({ originalPrice: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Recursos/Benefícios</Label>
            <Button onClick={addFeature} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
          
          <div className="space-y-2">
            {block.features.map((feature, index) => (
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
                  disabled={block.features.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`price-button-text-${block.id}`}>Texto do Botão</Label>
            <Input
              id={`price-button-text-${block.id}`}
              placeholder="Assinar agora"
              value={block.buttonText || ''}
              onChange={(e) => updateBlock({ buttonText: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`price-button-url-${block.id}`}>URL do Botão</Label>
            <Input
              id={`price-button-url-${block.id}`}
              placeholder="https://checkout.com"
              value={block.buttonUrl || ''}
              onChange={(e) => updateBlock({ buttonUrl: e.target.value })}
              type="url"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id={`price-highlighted-${block.id}`}
            checked={block.highlighted || false}
            onCheckedChange={(checked) => updateBlock({ highlighted: checked })}
          />
          <Label htmlFor={`price-highlighted-${block.id}`} className="cursor-pointer text-sm whitespace-nowrap">
            Destacar este plano
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};
