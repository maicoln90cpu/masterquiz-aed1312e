import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Trash2 } from "lucide-react";
import type { MetricsBlock as MetricsBlockType } from "@/types/blocks";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface MetricsBlockProps {
  block: MetricsBlockType;
  onChange: (block: MetricsBlockType) => void;
}

export const MetricsBlock = ({ block, onChange }: MetricsBlockProps) => {
  const safeData = Array.isArray(block.data) ? block.data : [];

  const updateBlock = (updates: Partial<MetricsBlockType>) => {
    onChange({ ...block, ...updates });
  };

  const addDataPoint = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const data = [
      ...safeData,
      {
        label: `Item ${safeData.length + 1}`,
        value: 0,
        color: colors[safeData.length % colors.length]
      }
    ];
    updateBlock({ data });
  };

  const updateDataPoint = (index: number, field: 'label' | 'value' | 'color', value: string | number) => {
    const data = [...safeData];
    data[index] = { ...data[index], [field]: value };
    updateBlock({ data });
  };

  const removeDataPoint = (index: number) => {
    const data = safeData.filter((_, i) => i !== index);
    updateBlock({ data });
  };

  const renderPreview = () => {
    const chartData = safeData.map(d => ({
      name: d.label,
      value: d.value,
      fill: d.color || '#3b82f6'
    }));

    switch (block.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              {block.showValues && <Tooltip />}
              {block.showLegend && <Legend />}
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              {block.showValues && <Tooltip />}
              {block.showLegend && <Legend />}
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={block.chartType === 'donut' ? 60 : 0}
                outerRadius={80}
                label={block.showValues}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {block.showValues && <Tooltip />}
              {block.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="border-2 border-purple-500/20">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
          <BarChart3 className="h-4 w-4" />
          <span>Métricas / Gráfico</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`metrics-title-${block.id}`}>Título do Gráfico *</Label>
          <Input
            id={`metrics-title-${block.id}`}
            placeholder="Estatísticas"
            value={block.title}
            onChange={(e) => updateBlock({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`metrics-chart-type-${block.id}`}>Tipo de Gráfico</Label>
          <Select 
            value={block.chartType} 
            onValueChange={(value: any) => updateBlock({ chartType: value })}
          >
            <SelectTrigger id={`metrics-chart-type-${block.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Barras</SelectItem>
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="pie">Pizza</SelectItem>
              <SelectItem value="donut">Rosca (Donut)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Dados do Gráfico</Label>
            <Button onClick={addDataPoint} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
          
          <div className="space-y-2">
            {safeData.map((dataPoint, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Rótulo"
                  value={dataPoint.label}
                  onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Valor"
                  value={dataPoint.value}
                  onChange={(e) => updateDataPoint(index, 'value', parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
                <Input
                  type="color"
                  value={dataPoint.color || '#3b82f6'}
                  onChange={(e) => updateDataPoint(index, 'color', e.target.value)}
                  className="w-16 h-10"
                />
                <Button
                  onClick={() => removeDataPoint(index)}
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  disabled={safeData.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`metrics-legend-${block.id}`}
              checked={block.showLegend !== false}
              onCheckedChange={(checked) => updateBlock({ showLegend: checked })}
            />
            <Label htmlFor={`metrics-legend-${block.id}`} className="cursor-pointer text-sm whitespace-nowrap">
              Mostrar legenda
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`metrics-values-${block.id}`}
              checked={block.showValues !== false}
              onCheckedChange={(checked) => updateBlock({ showValues: checked })}
            />
            <Label htmlFor={`metrics-values-${block.id}`} className="cursor-pointer text-sm whitespace-nowrap">
              Mostrar valores
            </Label>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-sm font-medium mb-3 text-center">{block.title}</p>
          {renderPreview()}
        </div>
      </CardContent>
    </Card>
  );
};
