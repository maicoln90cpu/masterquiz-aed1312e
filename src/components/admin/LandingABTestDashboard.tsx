import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useLandingABTestAdmin } from "@/hooks/useLandingABTest";
import { toast } from "sonner";
import { Plus, Trash2, FlaskConical, Loader2, TrendingUp, TrendingDown, Minus, Pencil, X, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface VariantContent {
  text?: string;
  style?: string;
  [key: string]: any;
}

export const LandingABTestDashboard = () => {
  const { tests, stats, isLoading, createTest, updateTest, deleteTest } = useLandingABTestAdmin();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    variant_a_text: string;
    variant_a_style: string;
    variant_b_text: string;
    variant_b_style: string;
    traffic_split: number;
  } | null>(null);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    target_element: '',
    variant_a_content: '{}',
    variant_b_content: '{}',
    traffic_split: 50,
    is_active: true,
  });

  const handleCreate = async () => {
    try {
      await createTest.mutateAsync({
        name: newTest.name,
        description: newTest.description || null,
        target_element: newTest.target_element || null,
        variant_a_content: JSON.parse(newTest.variant_a_content),
        variant_b_content: JSON.parse(newTest.variant_b_content),
        traffic_split: newTest.traffic_split,
        is_active: newTest.is_active,
      });
      
      setIsCreating(false);
      setNewTest({
        name: '',
        description: '',
        target_element: '',
        variant_a_content: '{}',
        variant_b_content: '{}',
        traffic_split: 50,
        is_active: true,
      });
      toast.success('Teste A/B criado!');
    } catch (error) {
      toast.error('Erro ao criar teste');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateTest.mutateAsync({ id, is_active: isActive });
      toast.success(isActive ? 'Teste ativado' : 'Teste pausado');
    } catch (error) {
      toast.error('Erro ao atualizar teste');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTest.mutateAsync(id);
      toast.success('Teste excluído');
    } catch (error) {
      toast.error('Erro ao excluir teste');
    }
  };

  const startEditing = (test: any) => {
    const variantA = test.variant_a_content as VariantContent || {};
    const variantB = test.variant_b_content as VariantContent || {};
    
    setEditingTestId(test.id);
    setEditForm({
      name: test.name || '',
      description: test.description || '',
      variant_a_text: variantA.text || '',
      variant_a_style: variantA.style || '',
      variant_b_text: variantB.text || '',
      variant_b_style: variantB.style || '',
      traffic_split: test.traffic_split || 50,
    });
  };

  const cancelEditing = () => {
    setEditingTestId(null);
    setEditForm(null);
  };

  const saveEditing = async () => {
    if (!editingTestId || !editForm) return;

    try {
      await updateTest.mutateAsync({
        id: editingTestId,
        name: editForm.name,
        description: editForm.description || null,
        variant_a_content: {
          text: editForm.variant_a_text,
          style: editForm.variant_a_style,
        },
        variant_b_content: {
          text: editForm.variant_b_text,
          style: editForm.variant_b_style,
        },
        traffic_split: editForm.traffic_split,
      });
      
      toast.success('Teste atualizado com sucesso!');
      cancelEditing();
    } catch (error) {
      toast.error('Erro ao atualizar teste');
    }
  };

  const calculateConversionRate = (conversions: number, sessions: number): number => {
    if (sessions === 0) return 0;
    return Math.round((conversions / sessions) * 10000) / 100;
  };

  const getWinner = (testId: string): 'A' | 'B' | 'tie' | null => {
    const testStats = stats?.[testId];
    if (!testStats) return null;

    const rateA = calculateConversionRate(testStats.variantA.conversions, testStats.variantA.sessions);
    const rateB = calculateConversionRate(testStats.variantB.conversions, testStats.variantB.sessions);

    if (testStats.variantA.sessions < 10 || testStats.variantB.sessions < 10) {
      return null;
    }

    if (Math.abs(rateA - rateB) < 1) return 'tie';
    return rateA > rateB ? 'A' : 'B';
  };

  const renderVariantContent = (content: VariantContent | null) => {
    if (!content || Object.keys(content).length === 0) {
      return <span className="text-muted-foreground text-xs italic">Não configurado</span>;
    }

    return (
      <div className="space-y-1 text-xs">
        {content.text && (
          <div>
            <span className="text-muted-foreground">Texto:</span>{" "}
            <span className="font-medium">{content.text}</span>
          </div>
        )}
        {content.style && (
          <div>
            <span className="text-muted-foreground">Estilo:</span>{" "}
            <code className="bg-muted px-1 rounded">{content.style}</code>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              A/B Testing - Landing Page
            </CardTitle>
            <CardDescription>
              Compare variantes e otimize conversões
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Teste
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create new test form */}
        {isCreating && (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Criar Novo Teste A/B</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Teste *</Label>
                  <Input
                    placeholder="Ex: Hero CTA Test"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Elemento Alvo</Label>
                  <Input
                    placeholder="Ex: hero_cta, hero_headline"
                    value={newTest.target_element}
                    onChange={(e) => setNewTest({ ...newTest, target_element: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Descrição do teste..."
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variante A (Controle) - JSON</Label>
                  <Textarea
                    placeholder='{"text": "Texto original", "style": "default"}'
                    value={newTest.variant_a_content}
                    onChange={(e) => setNewTest({ ...newTest, variant_a_content: e.target.value })}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Variante B (Teste) - JSON</Label>
                  <Textarea
                    placeholder='{"text": "Texto novo", "style": "gradient"}'
                    value={newTest.variant_b_content}
                    onChange={(e) => setNewTest({ ...newTest, variant_b_content: e.target.value })}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Divisão de Tráfego: {newTest.traffic_split}% Variante A / {100 - newTest.traffic_split}% Variante B</Label>
                <Slider
                  value={[newTest.traffic_split]}
                  onValueChange={([value]) => setNewTest({ ...newTest, traffic_split: value })}
                  max={100}
                  step={5}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newTest.is_active}
                  onCheckedChange={(checked) => setNewTest({ ...newTest, is_active: checked })}
                />
                <Label>Ativar imediatamente</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={!newTest.name || createTest.isPending}>
                  {createTest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tests list with stats */}
        {tests?.length === 0 && !isCreating && (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum teste A/B criado ainda.</p>
            <Button variant="link" onClick={() => setIsCreating(true)}>
              Criar primeiro teste
            </Button>
          </div>
        )}

        {tests?.map((test) => {
          const testStats = stats?.[test.id];
          const winner = getWinner(test.id);
          const rateA = testStats ? calculateConversionRate(testStats.variantA.conversions, testStats.variantA.sessions) : 0;
          const rateB = testStats ? calculateConversionRate(testStats.variantB.conversions, testStats.variantB.sessions) : 0;
          const isEditing = editingTestId === test.id;

          return (
            <Card key={test.id} className={!test.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing && editForm ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Nome do Teste</Label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-base flex items-center gap-2">
                          {test.name}
                          {test.is_active ? (
                            <Badge variant="default" className="bg-green-500">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Pausado</Badge>
                          )}
                          {winner === 'A' && <Badge className="bg-blue-500">Vencedor: A</Badge>}
                          {winner === 'B' && <Badge className="bg-purple-500">Vencedor: B</Badge>}
                          {winner === 'tie' && <Badge variant="outline">Empate</Badge>}
                        </CardTitle>
                        {test.description && (
                          <CardDescription>{test.description}</CardDescription>
                        )}
                        {test.target_element && (
                          <code className="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                            {test.target_element}
                          </code>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={saveEditing} disabled={updateTest.isPending}>
                          {updateTest.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => startEditing(test)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={test.is_active}
                          onCheckedChange={(checked) => handleToggleActive(test.id, checked)}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Teste A/B?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação excluirá o teste "{test.name}" e todos os dados de sessão associados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(test.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Variant A */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-600">Variante A (Controle)</span>
                      <span className="text-sm text-muted-foreground">{test.traffic_split}%</span>
                    </div>
                    
                    {isEditing && editForm ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Texto</Label>
                          <Input
                            value={editForm.variant_a_text}
                            onChange={(e) => setEditForm({ ...editForm, variant_a_text: e.target.value })}
                            placeholder="Texto do botão/elemento"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Estilo</Label>
                          <Input
                            value={editForm.variant_a_style}
                            onChange={(e) => setEditForm({ ...editForm, variant_a_style: e.target.value })}
                            placeholder="Ex: default, gradient"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded p-2">
                        {renderVariantContent(test.variant_a_content as VariantContent)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sessões:</span>
                        <span className="ml-2 font-medium">{testStats?.variantA.sessions || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversões:</span>
                        <span className="ml-2 font-medium">{testStats?.variantA.conversions || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Conversão</span>
                        <span className="font-bold">{rateA}%</span>
                      </div>
                      <Progress value={rateA} className="h-2" />
                    </div>
                  </div>

                  {/* Variant B */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-purple-600">Variante B (Teste)</span>
                      <span className="text-sm text-muted-foreground">{100 - test.traffic_split}%</span>
                    </div>
                    
                    {isEditing && editForm ? (
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Texto</Label>
                          <Input
                            value={editForm.variant_b_text}
                            onChange={(e) => setEditForm({ ...editForm, variant_b_text: e.target.value })}
                            placeholder="Texto do botão/elemento"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Estilo</Label>
                          <Input
                            value={editForm.variant_b_style}
                            onChange={(e) => setEditForm({ ...editForm, variant_b_style: e.target.value })}
                            placeholder="Ex: default, gradient"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded p-2">
                        {renderVariantContent(test.variant_b_content as VariantContent)}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sessões:</span>
                        <span className="ml-2 font-medium">{testStats?.variantB.sessions || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversões:</span>
                        <span className="ml-2 font-medium">{testStats?.variantB.conversions || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Conversão</span>
                        <span className="font-bold flex items-center gap-1">
                          {rateB}%
                          {rateB > rateA && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {rateB < rateA && <TrendingDown className="h-3 w-3 text-red-500" />}
                          {rateB === rateA && rateA > 0 && <Minus className="h-3 w-3 text-muted-foreground" />}
                        </span>
                      </div>
                      <Progress value={rateB} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Traffic split editor when editing */}
                {isEditing && editForm && (
                  <div className="mt-4 space-y-2">
                    <Label>Divisão de Tráfego: {editForm.traffic_split}% A / {100 - editForm.traffic_split}% B</Label>
                    <Slider
                      value={[editForm.traffic_split]}
                      onValueChange={([value]) => setEditForm({ ...editForm, traffic_split: value })}
                      max={100}
                      step={5}
                    />
                  </div>
                )}

                {/* Difference indicator */}
                {testStats && (testStats.variantA.sessions > 0 || testStats.variantB.sessions > 0) && !isEditing && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center text-sm">
                    {rateB > rateA ? (
                      <span className="text-green-600 font-medium">
                        Variante B está {((rateB - rateA) / (rateA || 1) * 100).toFixed(1)}% melhor
                      </span>
                    ) : rateA > rateB ? (
                      <span className="text-blue-600 font-medium">
                        Variante A está {((rateA - rateB) / (rateB || 1) * 100).toFixed(1)}% melhor
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Ambas variantes têm performance igual
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};
