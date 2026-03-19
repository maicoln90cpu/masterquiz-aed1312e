// ✅ FASE 12: Extracted to isolate recharts dependency (lazy-loaded)
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import type { QuizBlock } from "@/types/blocks";

interface MetricsDataPoint {
  label: string;
  value: number;
  color?: string;
}

export const MetricsBlockPreview = ({ block }: { block: QuizBlock & { type: 'metrics' } }) => {
  const rawData = (block as Record<string, unknown>).data ?? (block as Record<string, unknown>).dataPoints ?? [];
  const metricsData: MetricsDataPoint[] = Array.isArray(rawData) ? rawData : [];
  if (metricsData.length === 0) return null;

  const chartData = metricsData.map((d) => ({
    name: d.label,
    value: d.value,
    fill: d.color || '#3b82f6'
  }));

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-center">{block.title}</h3>
      <div className="bg-card rounded-lg p-4 border">
        <ResponsiveContainer width="100%" height={300}>
          {(() => {
            switch (block.chartType) {
              case 'bar':
                return (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis />
                    {block.showValues && <Tooltip />}
                    {block.showLegend && <Legend />}
                    <Bar dataKey="value">
                      {chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                );
              case 'line':
                return (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" /><YAxis />
                    {block.showValues && <Tooltip />}
                    {block.showLegend && <Legend />}
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                );
              case 'pie':
              case 'donut':
                return (
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={block.chartType === 'donut' ? 60 : 0} outerRadius={100} label={block.showValues}>
                      {chartData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.fill} />)}
                    </Pie>
                    {block.showValues && <Tooltip />}
                    {block.showLegend && <Legend />}
                  </PieChart>
                );
              default:
                return <BarChart data={chartData}><Bar dataKey="value" /></BarChart>;
            }
          })()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
