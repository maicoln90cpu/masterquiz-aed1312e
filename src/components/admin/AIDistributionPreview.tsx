import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { calculatePreview, type FunnelMode } from '@/lib/ai/distributionPreview';

/**
 * Preview da distribuição de perguntas por fase do funil.
 * Mostra exatamente quantas perguntas a IA receberá ordem de gerar em cada fase
 * para um determinado total. Útil para validar mudanças de prompt antes de salvar.
 */
export const AIDistributionPreview = () => {
  const [total, setTotal] = useState(8);
  const [mode, setMode] = useState<FunnelMode>('commercial');

  const preview = calculatePreview(total, mode);
  const sum = preview.phases.reduce((a, p) => a + p.count, 0);
  const hasConclusion = preview.phases[preview.phases.length - 1]?.count > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Preview da Distribuição (Fase 1)</CardTitle>
        </div>
        <CardDescription>
          Veja como a IA é instruída a dividir as perguntas em cada fase do funil
          conforme a quantidade total solicitada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={mode} onValueChange={(v) => setMode(v as FunnelMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commercial">Comercial (form/PDF)</TabsTrigger>
            <TabsTrigger value="educational">Educacional</TabsTrigger>
            <TabsTrigger value="traffic">Tráfego pago</TabsTrigger>
          </TabsList>

          {(['commercial', 'educational', 'traffic'] as FunnelMode[]).map((m) => (
            <TabsContent key={m} value={m} className="space-y-4 pt-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-[200px]">
                  <Label htmlFor="total-questions">Total de perguntas</Label>
                  <Input
                    id="total-questions"
                    type="number"
                    min={3}
                    max={30}
                    value={total}
                    onChange={(e) => setTotal(Math.max(3, Math.min(30, Number(e.target.value) || 3)))}
                  />
                </div>
                <div className="flex gap-2">
                  {[5, 8, 10, 15, 20].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setTotal(q)}
                      className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                        total === q
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-border'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {preview.phases.map((phase, idx) => (
                  <div
                    key={phase.name}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      phase.count === 0 ? 'opacity-40 bg-muted/30' : 'bg-card'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center min-w-[44px] h-11 rounded-md bg-primary/10 text-primary font-semibold">
                      <span className="text-lg leading-none">{phase.count}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-sm">{phase.label}</span>
                        <Badge variant="outline" className="text-xs">
                          {phase.range}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">
                  Soma das fases: <strong className="text-foreground">{sum}</strong> ={' '}
                  {sum === total ? '✅ bate com o total' : '⚠️ não bate'}
                </span>
                {m === 'commercial' && !hasConclusion && (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    Sem fase de conclusão — quiz pode terminar sem CTA
                  </span>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};