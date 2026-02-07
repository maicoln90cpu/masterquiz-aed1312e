import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Layers } from "lucide-react";

interface CalculatorRange {
  min: number;
  max: number;
  label: string;
  description: string;
}

interface RangesStepProps {
  ranges: CalculatorRange[];
  onRangesChange: (ranges: CalculatorRange[]) => void;
}

export const RangesStep = ({ ranges, onRangesChange }: RangesStepProps) => {
  const { t } = useTranslation();

  const addRange = () => {
    const lastMax = ranges.length > 0 ? ranges[ranges.length - 1].max : 0;
    onRangesChange([
      ...ranges,
      {
        min: lastMax,
        max: lastMax + 10,
        label: `Faixa ${ranges.length + 1}`,
        description: '',
      },
    ]);
  };

  const updateRange = (index: number, updates: Partial<CalculatorRange>) => {
    const newRanges = [...ranges];
    newRanges[index] = { ...newRanges[index], ...updates };
    onRangesChange(newRanges);
  };

  const removeRange = (index: number) => {
    onRangesChange(ranges.filter((_, i) => i !== index));
  };

  // Cores para as faixas
  const rangeColors = [
    'border-l-red-500',
    'border-l-orange-500',
    'border-l-yellow-500',
    'border-l-green-500',
    'border-l-blue-500',
    'border-l-purple-500',
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Layers className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">
          {t('createQuiz.calculator.defineRanges', 'Definir Faixas')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('createQuiz.calculator.defineRangesDesc', 'Configure mensagens diferentes para cada faixa de resultado')}
        </p>
      </div>

      {ranges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              {t('createQuiz.calculator.noRanges', 'Nenhuma faixa definida ainda')}
            </p>
            <Button onClick={addRange} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              {t('createQuiz.calculator.addFirstRange', 'Adicionar primeira faixa')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {ranges.map((range, index) => (
            <Card 
              key={index} 
              className={`border-l-4 ${rangeColors[index % rangeColors.length]}`}
            >
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">
                    {t('createQuiz.calculator.range', 'Faixa')} {index + 1}
                  </Label>
                  {ranges.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRange(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {/* Min/Max */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {t('createQuiz.calculator.min', 'Mínimo')}
                    </Label>
                    <Input
                      type="number"
                      value={range.min}
                      onChange={(e) => updateRange(index, { min: parseFloat(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {t('createQuiz.calculator.max', 'Máximo')}
                    </Label>
                    <Input
                      type="number"
                      value={range.max}
                      onChange={(e) => updateRange(index, { max: parseFloat(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('createQuiz.calculator.rangeLabel', 'Título da faixa')}
                  </Label>
                  <Input
                    value={range.label}
                    onChange={(e) => updateRange(index, { label: e.target.value })}
                    placeholder="Ex: Iniciante, Intermediário, Expert"
                    className="h-9"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('createQuiz.calculator.rangeDescription', 'Descrição (opcional)')}
                  </Label>
                  <Textarea
                    value={range.description}
                    onChange={(e) => updateRange(index, { description: e.target.value })}
                    placeholder="Mensagem exibida para este resultado..."
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button onClick={addRange} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        {t('createQuiz.calculator.addRange', 'Adicionar faixa')}
      </Button>

      {/* Preview visual das faixas */}
      {ranges.length > 0 && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-3">
            {t('createQuiz.calculator.rangesPreview', 'Visualização das faixas:')}
          </p>
          <div className="flex h-8 rounded-lg overflow-hidden">
            {ranges.map((range, index) => {
              const totalSpan = Math.max(...ranges.map(r => r.max)) - Math.min(...ranges.map(r => r.min));
              const width = totalSpan > 0 ? ((range.max - range.min) / totalSpan) * 100 : 100 / ranges.length;
              const bgColors = [
                'bg-red-500',
                'bg-orange-500',
                'bg-yellow-500',
                'bg-green-500',
                'bg-blue-500',
                'bg-purple-500',
              ];
              
              return (
                <div
                  key={index}
                  className={`${bgColors[index % bgColors.length]} flex items-center justify-center text-xs text-white font-medium`}
                  style={{ width: `${Math.max(width, 10)}%` }}
                  title={`${range.min} - ${range.max}: ${range.label}`}
                >
                  {range.label.length > 10 ? range.label.slice(0, 10) + '...' : range.label}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{ranges.length > 0 ? Math.min(...ranges.map(r => r.min)) : 0}</span>
            <span>{ranges.length > 0 ? Math.max(...ranges.map(r => r.max)) : 100}</span>
          </div>
        </div>
      )}
    </div>
  );
};
