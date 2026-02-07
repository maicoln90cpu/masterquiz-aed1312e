import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Trophy,
  Loader2,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { PlanFeatureGate } from '@/components/PlanFeatureGate';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

interface Variant {
  id: string;
  parent_quiz_id: string;
  variant_name: string;
  variant_letter: string;
  traffic_weight: number;
  is_control: boolean;
  is_active: boolean;
}

interface VariantStats {
  variant_id: string;
  sessions: number;
  conversions: number;
  conversion_rate: number;
  avg_time_seconds: number;
}

interface ABTestManagerProps {
  quizId: string;
  abTestActive: boolean;
  onToggleABTest: (active: boolean) => void;
}

export const ABTestManager = ({ quizId, abTestActive, onToggleABTest }: ABTestManagerProps) => {
  const { t } = useTranslation();
  const { allowABTesting, isLoading: planLoading } = usePlanFeatures();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<VariantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Verificar permissão do plano
  if (!allowABTesting && !planLoading) {
    return (
      <PlanFeatureGate
        featureName="Testes A/B"
        featureDescription="Compare diferentes versões do seu quiz para descobrir qual converte mais. Otimize suas conversões com dados reais."
        isAllowed={false}
        isLoading={planLoading}
      >
        <></>
      </PlanFeatureGate>
    );
  }

  useEffect(() => {
    loadVariants();
    if (abTestActive) {
      loadStats();
    }
  }, [quizId, abTestActive]);

  const loadVariants = async () => {
    const { data, error } = await supabase
      .from('quiz_variants')
      .select('*')
      .eq('parent_quiz_id', quizId)
      .order('variant_letter');

    if (error) {
      console.error('Erro ao carregar variantes:', error);
      return;
    }

    if (data && data.length > 0) {
      setVariants(data as Variant[]);
    } else {
      // Criar variantes padrão A e B
      await createDefaultVariants();
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('ab_test_sessions')
      .select('variant_id, converted, time_to_complete_seconds')
      .eq('quiz_id', quizId);

    if (error || !data) return;

    // Calcular estatísticas por variante
    const statsMap = new Map<string, VariantStats>();
    
    data.forEach((session: any) => {
      if (!session.variant_id) return;
      
      if (!statsMap.has(session.variant_id)) {
        statsMap.set(session.variant_id, {
          variant_id: session.variant_id,
          sessions: 0,
          conversions: 0,
          conversion_rate: 0,
          avg_time_seconds: 0,
        });
      }
      
      const stat = statsMap.get(session.variant_id)!;
      stat.sessions++;
      if (session.converted) {
        stat.conversions++;
        if (session.time_to_complete_seconds) {
          stat.avg_time_seconds += session.time_to_complete_seconds;
        }
      }
    });

    // Calcular médias
    statsMap.forEach((stat) => {
      stat.conversion_rate = stat.sessions > 0 
        ? (stat.conversions / stat.sessions) * 100 
        : 0;
      stat.avg_time_seconds = stat.conversions > 0 
        ? stat.avg_time_seconds / stat.conversions 
        : 0;
    });

    setStats(Array.from(statsMap.values()));
  };

  const createDefaultVariants = async () => {
    const defaultVariants = [
      { variant_name: 'Controle (Original)', variant_letter: 'A', traffic_weight: 50, is_control: true },
      { variant_name: 'Variante B', variant_letter: 'B', traffic_weight: 50, is_control: false },
    ];

    const { data, error } = await supabase
      .from('quiz_variants')
      .insert(defaultVariants.map(v => ({
        ...v,
        parent_quiz_id: quizId,
        is_active: true,
      })))
      .select();

    if (!error && data) {
      setVariants(data as Variant[]);
    }
  };

  const handleToggleABTest = async (active: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ ab_test_active: active } as any)
        .eq('id', quizId);

      if (error) throw error;
      
      onToggleABTest(active);
      toast.success(active ? 'Teste A/B ativado!' : 'Teste A/B desativado');
    } catch (error) {
      console.error('Erro ao atualizar A/B test:', error);
      toast.error('Erro ao atualizar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleWeightChange = async (variantId: string, weight: number) => {
    // Atualizar peso localmente
    const updatedVariants = variants.map(v => 
      v.id === variantId ? { ...v, traffic_weight: weight } : v
    );
    
    // Recalcular pesos para somar 100%
    const totalWeight = updatedVariants.reduce((sum, v) => sum + v.traffic_weight, 0);
    if (totalWeight !== 100 && updatedVariants.length > 1) {
      const others = updatedVariants.filter(v => v.id !== variantId);
      const remaining = 100 - weight;
      const perOther = Math.floor(remaining / others.length);
      
      updatedVariants.forEach(v => {
        if (v.id !== variantId) {
          v.traffic_weight = perOther;
        }
      });
    }

    setVariants(updatedVariants);

    // Salvar no banco
    for (const variant of updatedVariants) {
      await supabase
        .from('quiz_variants')
        .update({ traffic_weight: variant.traffic_weight })
        .eq('id', variant.id);
    }
  };

  const addVariant = async () => {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const usedLetters = variants.map(v => v.variant_letter);
    const nextLetter = letters.find(l => !usedLetters.includes(l));
    
    if (!nextLetter) {
      toast.error('Máximo de 5 variantes permitidas');
      return;
    }

    const newWeight = Math.floor(100 / (variants.length + 1));
    
    const { data, error } = await supabase
      .from('quiz_variants')
      .insert({
        parent_quiz_id: quizId,
        variant_name: `Variante ${nextLetter}`,
        variant_letter: nextLetter,
        traffic_weight: newWeight,
        is_control: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao criar variante');
      return;
    }

    // Redistribuir pesos
    const newVariants = [...variants, data as Variant];
    const equalWeight = Math.floor(100 / newVariants.length);
    
    for (const v of newVariants) {
      await supabase
        .from('quiz_variants')
        .update({ traffic_weight: equalWeight })
        .eq('id', v.id);
    }

    loadVariants();
    toast.success(`Variante ${nextLetter} criada!`);
  };

  const removeVariant = async (variantId: string) => {
    if (variants.length <= 2) {
      toast.error('Mínimo de 2 variantes necessárias');
      return;
    }

    await supabase
      .from('quiz_variants')
      .delete()
      .eq('id', variantId);

    loadVariants();
    toast.success('Variante removida');
  };

  const getWinningVariant = (): Variant | null => {
    if (stats.length === 0) return null;
    
    const best = stats.reduce((a, b) => 
      a.conversion_rate > b.conversion_rate ? a : b
    );
    
    // Só considerar vencedor se tiver diferença significativa (>5%)
    const secondBest = stats.filter(s => s.variant_id !== best.variant_id)[0];
    if (!secondBest || (best.conversion_rate - secondBest.conversion_rate) < 5) {
      return null;
    }
    
    return variants.find(v => v.id === best.variant_id) || null;
  };

  const getVariantStats = (variantId: string): VariantStats | null => {
    return stats.find(s => s.variant_id === variantId) || null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const winningVariant = getWinningVariant();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle>Teste A/B</CardTitle>
          </div>
          <Switch
            checked={abTestActive}
            onCheckedChange={handleToggleABTest}
            disabled={saving}
          />
        </div>
        <CardDescription>
          Compare diferentes versões do quiz para otimizar conversões
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {abTestActive ? (
          <>
            {/* Winner Badge */}
            {winningVariant && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <Trophy className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  Variante {winningVariant.variant_letter} está vencendo!
                </span>
              </div>
            )}

            {/* Variants */}
            <div className="space-y-4">
              {variants.map((variant) => {
                const variantStats = getVariantStats(variant.id);
                
                return (
                  <div 
                    key={variant.id} 
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={variant.is_control ? "default" : "secondary"}
                          className="font-mono"
                        >
                          {variant.variant_letter}
                        </Badge>
                        <Input
                          value={variant.variant_name}
                          onChange={async (e) => {
                            const updated = variants.map(v => 
                              v.id === variant.id 
                                ? { ...v, variant_name: e.target.value } 
                                : v
                            );
                            setVariants(updated);
                            await supabase
                              .from('quiz_variants')
                              .update({ variant_name: e.target.value })
                              .eq('id', variant.id);
                          }}
                          className="w-48 h-8"
                        />
                        {variant.is_control && (
                          <Badge variant="outline" className="text-xs">
                            Controle
                          </Badge>
                        )}
                      </div>
                      {!variant.is_control && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariant(variant.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Traffic Weight */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Label>Tráfego</Label>
                        <span className="font-medium">{variant.traffic_weight}%</span>
                      </div>
                      <Slider
                        value={[variant.traffic_weight]}
                        onValueChange={([value]) => handleWeightChange(variant.id, value)}
                        max={100}
                        min={10}
                        step={5}
                      />
                    </div>

                    {/* Stats */}
                    {variantStats && variantStats.sessions > 0 && (
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{variantStats.sessions}</div>
                          <div className="text-xs text-muted-foreground">Sessões</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {variantStats.conversion_rate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Conversão</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {Math.round(variantStats.avg_time_seconds)}s
                          </div>
                          <div className="text-xs text-muted-foreground">Tempo médio</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Variant */}
            {variants.length < 5 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={addVariant}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Variante
              </Button>
            )}

            {/* Stats Summary */}
            {stats.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium text-sm">Resumo do Teste</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total de {stats.reduce((sum, s) => sum + s.sessions, 0)} sessões
                  {' '}com {stats.reduce((sum, s) => sum + s.conversions, 0)} conversões
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Ative o teste A/B para comparar diferentes versões do seu quiz
            </p>
            <Button onClick={() => handleToggleABTest(true)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Iniciar Teste A/B
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
