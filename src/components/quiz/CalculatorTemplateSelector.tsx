import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Sparkles } from "lucide-react";
import { calculatorTemplates, getTemplatesByCategory, type CalculatorTemplate } from "@/data/calculatorTemplates";

interface CalculatorTemplateSelectorProps {
  onSelectTemplate: (template: CalculatorTemplate) => void;
  onClose: () => void;
}

export function CalculatorTemplateSelector({ onSelectTemplate, onClose }: CalculatorTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const categories = getTemplatesByCategory();

  const handleSelect = () => {
    if (selectedId) {
      const template = calculatorTemplates.find(t => t.id === selectedId);
      if (template) {
        onSelectTemplate(template);
      }
    }
  };

  const categoryLabels = {
    health: { label: 'Saúde', icon: '❤️' },
    finance: { label: 'Finanças', icon: '💰' },
    business: { label: 'Negócios', icon: '💼' },
    other: { label: 'Outros', icon: '📊' },
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Templates de Calculadoras</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <CardDescription>
          Selecione um template pronto para começar rapidamente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {Object.entries(categoryLabels).map(([key, { label, icon }]) => (
              <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
                <span className="mr-1">{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(categories).map(([categoryKey, { templates }]) => (
            <TabsContent key={categoryKey} value={categoryKey}>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid gap-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedId(template.id)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedId === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                        </div>
                        {selectedId === template.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.variables.length} variáveis
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.ranges.length} faixas
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {template.displayFormat === 'currency' ? 'R$' : 
                           template.displayFormat === 'percentage' ? '%' : 
                           template.resultUnit || '#'}
                        </Badge>
                      </div>

                      {selectedId === template.id && (
                        <div className="mt-3 p-2 bg-muted/50 rounded text-xs font-mono">
                          <span className="text-muted-foreground">Fórmula:</span>{' '}
                          {template.formula}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedId}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Usar Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
