import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { AccordionBlock as AccordionBlockType } from "@/types/blocks";

interface AccordionBlockProps {
  block: AccordionBlockType;
  onChange: (block: AccordionBlockType) => void;
}

export const AccordionBlock = ({ block, onChange }: AccordionBlockProps) => {
  const addItem = () => {
    onChange({ ...block, items: [...block.items, { question: 'Nova pergunta', answer: 'Resposta...' }] });
  };

  const updateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...block, items: newItems });
  };

  const removeItem = (index: number) => {
    if (block.items.length <= 1) return;
    onChange({ ...block, items: block.items.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>📋 Bloco Acordeão FAQ</span>
        </div>

        {/* Content: Title */}
        <div className="space-y-2">
          <Label htmlFor="accordion-title">Título da Seção</Label>
          <Input
            id="accordion-title"
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Ex: Perguntas Frequentes"
          />
        </div>

        {/* Content: Items editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Itens do Acordeão</Label>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {block.items.map((item, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item {index + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={block.items.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input value={item.question} onChange={(e) => updateItem(index, 'question', e.target.value)} placeholder="Pergunta..." />
              <Textarea value={item.answer} onChange={(e) => updateItem(index, 'answer', e.target.value)} placeholder="Resposta..." rows={2} />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview:</p>
          <h3 className="font-semibold">{block.title}</h3>
          <Accordion type={block.allowMultiple ? "multiple" : "single"} collapsible className="w-full">
            {block.items.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className={block.style === 'bordered' ? 'border rounded-lg mb-2 px-3' : ''}>
                <AccordionTrigger className={block.style === 'minimal' ? 'text-sm py-2' : ''}>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="text-xs text-muted-foreground">
          Configure estilo e múltiplos abertos no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
