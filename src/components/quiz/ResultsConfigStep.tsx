import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Calculator, FileText, Save, Loader2, CheckCircle2 } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalculatorEditor } from "./CalculatorEditor";
import { CalculatorWizard } from "./CalculatorWizard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VariableMapping {
  [key: string]: string;
}

interface CalculatorRange {
  min: number;
  max: number;
  label: string;
  description: string;
}

interface Result {
  id: string;
  conditionType: string;
  resultText: string;
  imageUrl?: string;
  videoUrl?: string;
  redirectUrl?: string;
  buttonText?: string;
  minScore?: number;
  maxScore?: number;
  // Calculator fields
  resultType: 'standard' | 'calculator';
  formula?: string;
  resultUnit?: string;
  displayFormat?: string;
  decimalPlaces?: number;
  variableMapping?: VariableMapping;
  calculatorRanges?: CalculatorRange[];
}

interface Question {
  id: string;
  question_text: string;
  order_number: number;
}

interface ResultsConfigStepProps {
  deliveryTiming: string;
  onDeliveryTimingChange: (value: string) => void;
  quizId?: string | null;
}

export const ResultsConfigStep = ({ deliveryTiming, onDeliveryTimingChange, quizId }: ResultsConfigStepProps) => {
  const { t } = useTranslation();
  const [results, setResults] = useState<Result[]>([
    {
      id: `temp-${Date.now()}`,
      conditionType: 'always',
      resultText: '',
      imageUrl: '',
      videoUrl: '',
      redirectUrl: '',
      buttonText: '',
      resultType: 'standard'
    }
  ]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resultToDeleteIndex, setResultToDeleteIndex] = useState<number | null>(null);
  const [showCalculatorWizard, setShowCalculatorWizard] = useState(false);
  const debouncedSaveRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RESULTS = 20;

  const currentResult = results[currentResultIndex];
  
  const handleDeleteClick = (index: number) => {
    setResultToDeleteIndex(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteResult = async () => {
    if (resultToDeleteIndex !== null) {
      await removeResult(resultToDeleteIndex);
    }
    setDeleteConfirmOpen(false);
    setResultToDeleteIndex(null);
  };

  // Load existing results and questions
  useEffect(() => {
    if (quizId) {
      loadResults();
      loadQuestions();
    }
  }, [quizId]);

  const loadQuestions = async () => {
    if (!quizId) return;
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('id, question_text, order_number')
      .eq('quiz_id', quizId)
      .order('order_number');

    if (error) {
      console.error('Error loading questions:', error);
      return;
    }

    if (data) {
      setQuestions(data);
    }
  };

  const loadResults = async () => {
    if (!quizId) return;
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_number');

    if (error) {
      console.error('Error loading results:', error);
      return;
    }

    if (data && data.length > 0) {
      const loadedResults = data.map(r => ({
        id: r.id,
        conditionType: r.condition_type as Result['conditionType'],
        resultText: r.result_text,
        imageUrl: r.image_url || '',
        videoUrl: r.video_url || '',
        redirectUrl: r.redirect_url || '',
        buttonText: r.button_text || '',
        minScore: r.min_score ?? undefined,
        maxScore: r.max_score ?? undefined,
        resultType: (r.result_type as 'standard' | 'calculator') || 'standard',
        formula: r.formula || '',
        resultUnit: r.result_unit || '',
        displayFormat: r.display_format || 'number',
        decimalPlaces: r.decimal_places ?? 2,
        variableMapping: (r.variable_mapping as unknown as VariableMapping) || {},
        calculatorRanges: (r.calculator_ranges as unknown as CalculatorRange[]) || []
      }));
      setResults(loadedResults);
    }
  };

  const saveAllResults = async (overrideResults?: Result[], skipSync = false) => {
    if (!quizId) return;
    
    const resultsToSave = overrideResults || results;
    const upserts = resultsToSave.map((result, idx) => {
      // ✅ Detecta ID temporário: prefixo 'temp-' ou número simples (1,2,3...)
      const isTemporaryId = result.id.startsWith('temp-') || /^[0-9]+$/.test(result.id);
      
      return {
        ...(isTemporaryId ? {} : { id: result.id }), // Spread condicional: só inclui ID se não for temporário
        quiz_id: quizId,
        condition_type: result.conditionType as 'always' | 'score_range' | 'specific_answers',
        result_text: result.resultText,
        image_url: result.imageUrl || null,
        video_url: result.videoUrl || null,
        redirect_url: result.redirectUrl || null,
        button_text: result.buttonText || null,
        min_score: result.minScore ?? null,
        max_score: result.maxScore ?? null,
        order_number: idx,
        // Calculator fields
        result_type: result.resultType || 'standard',
        formula: result.formula || null,
        result_unit: result.resultUnit || null,
        display_format: result.displayFormat || 'number',
        decimal_places: result.decimalPlaces ?? 2,
        variable_mapping: result.variableMapping ? JSON.parse(JSON.stringify(result.variableMapping)) : null,
        calculator_ranges: result.calculatorRanges ? JSON.parse(JSON.stringify(result.calculatorRanges)) : null
      };
    });

    console.log('[ResultsConfigStep] 💾 Salvando resultados:', {
      timestamp: new Date().toISOString(),
      quizId,
      resultsCount: upserts.length,
      resultTypes: resultsToSave.map(r => r.resultType),
      payload: upserts
    });
    
    const { data, error } = await supabase
      .from('quiz_results')
      .upsert(upserts)
      .select(); // ✅ Retorna dados salvos para sincronizar IDs
    
    if (error) {
      console.error('[ResultsConfigStep] ❌ Erro ao salvar resultados:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        details: error
      });
      toast.error(`${t('createQuiz.results.errorSaving')}: ${error.message}`);
      return;
    }

    console.log('[ResultsConfigStep] ✅ Resultados salvos com sucesso:', {
      timestamp: new Date().toISOString(),
      savedResults: data
    });

    // ✅ Só sincroniza IDs se não for skipSync (evita reset durante edição)
    if (!skipSync && data && data.length > 0) {
      // Apenas atualiza os IDs, mantendo o estado local
      setResults(prev => prev.map((result, idx) => {
        const savedResult = data[idx];
        // Sincroniza se for ID temporário (temp-xxx ou número simples)
        const isTemporaryId = result.id.startsWith('temp-') || /^[0-9]+$/.test(result.id);
        if (savedResult && isTemporaryId) {
          return { ...result, id: savedResult.id };
        }
        return result;
      }));
      console.log('[ResultsConfigStep] 🔄 IDs sincronizados (estado local mantido)');
    }
  };

  const updateResult = useCallback((updates: Partial<Result>) => {
    setResults(prevResults => {
      const newResults = [...prevResults];
      newResults[currentResultIndex] = { ...newResults[currentResultIndex], ...updates };
      
      // Cancel previous save
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
      
      // Schedule new save with longer debounce
      debouncedSaveRef.current = setTimeout(() => {
        saveAllResults(newResults, true);
      }, 1500);
      
      return newResults;
    });
  }, [currentResultIndex, quizId]);

  const addResult = async () => {
    // Prevent adding while saving
    if (isSaving) return;
    
    // Limit max results
    if (results.length >= MAX_RESULTS) {
      toast.error(t('createQuiz.results.maxResults', `Máximo de ${MAX_RESULTS} resultados permitidos`));
      return;
    }
    
    setIsSaving(true);
    
    try {
      // First insert into database to get real ID
      const { data, error } = await supabase
        .from('quiz_results')
        .insert({
          quiz_id: quizId,
          condition_type: 'always',
          result_text: '',
          result_type: 'standard',
          order_number: results.length
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update UI with real ID from database
      const newResult: Result = {
        id: data.id,
        conditionType: 'always',
        resultText: '',
        resultType: 'standard'
      };
      
      setResults(prev => [...prev, newResult]);
      setCurrentResultIndex(results.length);
      toast.success(t('createQuiz.results.resultAdded', 'Resultado adicionado'));
    } catch (error) {
      console.error('[ResultsConfigStep] Failed to add result:', error);
      toast.error(t('createQuiz.results.errorAdding', 'Erro ao adicionar resultado'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // ✅ Função para salvar manualmente com feedback visual
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await saveAllResults(results, true);
      setLastSaved(new Date());
      toast.success(t('createQuiz.results.saved', 'Resultados salvos com sucesso!'));
    } catch (error) {
      console.error('[ResultsConfigStep] Erro ao salvar manualmente:', error);
      toast.error(t('createQuiz.results.errorSaving', 'Erro ao salvar resultados'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeResult = async (index: number) => {
    if (results.length === 1) {
      toast.error(t('createQuiz.results.minOneResult'));
      return;
    }
    
    const resultToDelete = results[index];
    
    // Se o resultado tem ID real (não temporário), deletar do banco
    if (quizId && resultToDelete.id && !resultToDelete.id.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('quiz_results')
          .delete()
          .eq('id', resultToDelete.id);
        
        if (error) {
          console.error('[ResultsConfigStep] ❌ Erro ao deletar resultado:', error);
          toast.error(t('createQuiz.results.errorDeleting', 'Erro ao deletar resultado'));
          return;
        }
      } catch (err) {
        console.error('[ResultsConfigStep] ❌ Exceção ao deletar:', err);
        toast.error(t('createQuiz.results.errorDeleting', 'Erro ao deletar resultado'));
        return;
      }
    }
    
    const newResults = results.filter((_, i) => i !== index);
    setResults(newResults);
    setCurrentResultIndex(Math.max(0, index - 1));
    toast.success(t('createQuiz.results.resultRemoved'));
  };

  const validateVideoUrl = (url: string) => {
    if (!url) return true;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('createQuiz.results.title')}</CardTitle>
          <CardDescription>{t('createQuiz.results.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Timing */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">{t('createQuiz.results.howDeliver')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('createQuiz.results.howDeliverDesc')}
              </p>
            </div>

            <RadioGroup value={deliveryTiming} onValueChange={onDeliveryTimingChange}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="delivery-immediate" />
                  <Label htmlFor="delivery-immediate" className="font-normal cursor-pointer">
                    {t('createQuiz.results.immediate')}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conditional" id="delivery-conditional" />
                  <Label htmlFor="delivery-conditional" className="font-normal cursor-pointer">
                    {t('createQuiz.results.conditional')}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">{t('createQuiz.results.possibleResults')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('createQuiz.results.possibleResultsDesc')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addResult}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createQuiz.results.addResult')}
              </Button>
            </div>

            {/* Result Selector */}
            {results.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {results.map((result, index) => (
                  <div key={result.id} className="flex gap-1">
                    <Button
                      variant={currentResultIndex === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentResultIndex(index)}
                    >
                      {t('createQuiz.results.result')} {index + 1}
                    </Button>
                    {results.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(index)}
                        className="px-2 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Result Type Selector */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Tipo de Resultado</Label>
                <Tabs 
                  value={currentResult.resultType || 'standard'} 
                  onValueChange={(v) => updateResult({ resultType: v as 'standard' | 'calculator' })}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standard" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Quiz Padrão
                    </TabsTrigger>
                    <TabsTrigger value="calculator" className="gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculadora
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Calculator Mode - New Wizard */}
              {currentResult.resultType === 'calculator' && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Configuração da Calculadora</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowCalculatorWizard(true)}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {currentResult.formula ? 'Editar Calculadora' : 'Configurar Calculadora'}
                      </Button>
                    </div>
                    
                    {currentResult.formula ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Fórmula:</span>
                          <code className="bg-muted px-2 py-1 rounded font-mono">{currentResult.formula}</code>
                        </div>
                        {currentResult.variableMapping && Object.keys(currentResult.variableMapping).length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Variáveis:</span>
                            <span>{Object.keys(currentResult.variableMapping).join(', ')}</span>
                          </div>
                        )}
                        {currentResult.calculatorRanges && currentResult.calculatorRanges.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Faixas:</span>
                            <span>{currentResult.calculatorRanges.length} definida(s)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Clique em "Configurar Calculadora" para definir a fórmula e as faixas de resultado.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Standard Mode - Conditional Settings */}
              {currentResult.resultType !== 'calculator' && deliveryTiming === 'conditional' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Configuração Condicional</Label>
                    <p className="text-sm text-muted-foreground">
                      Este resultado será exibido com base na pontuação do participante
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-score">Pontuação Mínima</Label>
                      <Input
                        id="min-score"
                        type="number"
                        placeholder="0"
                        value={currentResult.minScore || ''}
                        onChange={(e) => updateResult({ minScore: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-muted-foreground">Pontos mínimos necessários</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-score">Pontuação Máxima</Label>
                      <Input
                        id="max-score"
                        type="number"
                        placeholder="100"
                        value={currentResult.maxScore || ''}
                        onChange={(e) => updateResult({ maxScore: parseInt(e.target.value) || 100 })}
                      />
                      <p className="text-xs text-muted-foreground">Pontos máximos aceitos</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 <strong>Dica:</strong> Defina pontos para cada opção de resposta na etapa de perguntas para usar resultados condicionais baseados em pontuação.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="result-text">{t('createQuiz.results.resultText')}</Label>
                <Textarea
                  id="result-text"
                  placeholder={t('createQuiz.results.placeholderResult')}
                  value={currentResult.resultText}
                  onChange={(e) => updateResult({ resultText: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('createQuiz.results.image')}</Label>
                <ImageUploader
                  value={currentResult.imageUrl}
                  onChange={async (url) => {
                    console.log('[ResultsConfigStep] 🖼️ ImageUploader onChange:', {
                      timestamp: new Date().toISOString(),
                      currentResultIndex,
                      currentResultId: currentResult.id,
                      oldImageUrl: currentResult.imageUrl,
                      newImageUrl: url
                    });
                    // ✅ Criar novo array com a imagem atualizada
                    const newResults = [...results];
                    newResults[currentResultIndex] = { ...currentResult, imageUrl: url };
                    setResults(newResults);
                    // ✅ Salvar imediatamente passando o novo array diretamente
                    await saveAllResults(newResults);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-url">{t('createQuiz.results.video')}</Label>
                <Input
                  id="video-url"
                  placeholder={t('createQuiz.results.placeholderVideo')}
                  value={currentResult.videoUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    if (url && !validateVideoUrl(url)) {
                      toast.error('Por favor, insira uma URL válida do YouTube');
                      return;
                    }
                    updateResult({ videoUrl: url });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirect-url">{t('createQuiz.results.redirectUrl')}</Label>
                <Input
                  id="redirect-url"
                  placeholder={t('createQuiz.results.placeholderRedirect')}
                  value={currentResult.redirectUrl}
                  onChange={(e) => updateResult({ redirectUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-text">{t('createQuiz.results.buttonText')}</Label>
                <Input
                  id="button-text"
                  placeholder={t('createQuiz.results.placeholderButton')}
                  value={currentResult.buttonText}
                  onChange={(e) => updateResult({ buttonText: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <Card className="border-2 bg-secondary/20">
            <CardHeader>
              <CardTitle className="text-base">Pré-visualização do Resultado</CardTitle>
              <CardDescription>Como o resultado aparecerá para os participantes</CardDescription>
            </CardHeader>
            <CardContent>
              <Card>
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-4xl">🎉</div>
                  <h3 className="text-2xl font-bold">Quiz Finalizado!</h3>
                  <p className="text-muted-foreground">
                    {currentResult.resultText || 'Seu texto de resultado aparecerá aqui'}
                  </p>
                  {currentResult.buttonText && currentResult.redirectUrl && (
                    <Button className="mt-4">
                      {currentResult.buttonText}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lastSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Última alteração salva: {lastSaved.toLocaleTimeString('pt-BR')}</span>
                </>
              ) : (
                <span>As alterações são salvas automaticamente</span>
              )}
            </div>
            <Button 
              onClick={handleManualSave} 
              disabled={isSaving || !quizId}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Resultados
                </>
              )}
            </Button>
          </div>

          {/* Success Banner */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="font-semibold text-primary">Quiz Configurado!</p>
                  <p className="text-sm text-muted-foreground">
                    Seu quiz está pronto para ser publicado. Clique em "Publicar Quiz" abaixo para disponibilizar para seus visitantes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Delete Result Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('createQuiz.results.deleteConfirmTitle', 'Excluir resultado?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('createQuiz.results.deleteConfirmDesc', 'Esta ação não pode ser desfeita. O resultado será removido permanentemente do quiz.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancelar')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteResult}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Excluir')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calculator Wizard Modal */}
      <CalculatorWizard
        open={showCalculatorWizard}
        onOpenChange={setShowCalculatorWizard}
        questions={questions}
        initialConfig={{
          formula: currentResult.formula,
          resultUnit: currentResult.resultUnit,
          displayFormat: currentResult.displayFormat,
          decimalPlaces: currentResult.decimalPlaces,
          variableMapping: currentResult.variableMapping,
          calculatorRanges: currentResult.calculatorRanges,
        }}
        onSave={(config) => {
          updateResult({
            formula: config.formula,
            resultUnit: config.resultUnit,
            displayFormat: config.displayFormat,
            decimalPlaces: config.decimalPlaces,
            variableMapping: config.variableMapping,
            calculatorRanges: config.calculatorRanges,
          });
        }}
      />
    </div>
  );
};
