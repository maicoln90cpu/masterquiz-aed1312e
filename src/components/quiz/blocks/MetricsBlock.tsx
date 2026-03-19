import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    updateBlock({
      data: [...safeData, { label: `Item ${safeData.length + 1}`, value: 0, color: colors[safeData.length % colors.length] }]
    });
  };

  const updateDataPoint = (index: number, field: 'label' | 'value' | 'color', value: string | number) => {
    const data = [...safeData];
    data[index] = { ...data[index], [field]: value };
    updateBlock({ data });
  };

  const removeDataPoint = (index: number) => {
    updateBlock({ data: safeData.filter((_, i) => i !== index) });
  };

  const renderPreview = () => {
    const chartData = safeData.map(d => ({ name: d.label, value: d.value, fill: d.color || '#3b82f6' }));
    switch (block.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              {block.showValues && <Tooltip />}
              {block.showLegend && <Legend />}
              <Bar dataKey="value">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" /><YAxis />
              {block.showValues && <Tooltip />}
              {block.showLegend && <Legend />}
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie': case 'donut':
        return (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={block.chartType === 'donut' ? 50 : 0} outerRadius={70} label={block.showValues}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Pie>
              {block.showValues && <Tooltip />}
              {block.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="border-2 border-muted">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span>Métricas / Gráfico</span>
        </div>

        {/* Content: Title */}
        <div className="space-y-2">
          <Label htmlFor={`metrics-title-${block.id}`}>Título *</Label>
          <Input
            id={`metrics-title-${block.id}`}
            placeholder="Estatísticas"
            value={block.title}
            onChange={(e) => updateBlock({ title: e.target.value })}
          />
        </div>

        {/* Content: Data points */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Dados</Label>
            <Button onClick={addDataPoint} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {safeData.map((dp, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input placeholder="Rótulo" value={dp.label} onChange={(e) => updateDataPoint(index, 'label', e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Valor" value={dp.value} onChange={(e) => updateDataPoint(index, 'value', parseFloat(e.target.value) || 0)} className="w-24" />
                <Input type="color" value={dp.color || '#3b82f6'} onChange={(e) => updateDataPoint(index, 'color', e.target.value)} className="w-14 h-10" />
                <Button onClick={() => removeDataPoint(index)} size="icon" variant="ghost" disabled={safeData.length <= 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 bg-muted/20">
          <p className="text-sm font-medium mb-2 text-center">{block.title}</p>
          {safeData.length > 0 ? renderPreview() : (
            <p className="text-sm text-muted-foreground text-center py-8">Adicione dados para visualizar o gráfico</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Configure tipo de gráfico, legenda e valores no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
