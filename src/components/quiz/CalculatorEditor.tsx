import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calculator, HelpCircle, Variable, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalculatorTemplateSelector } from "./CalculatorTemplateSelector";
import type { CalculatorTemplate } from "@/data/calculatorTemplates";

interface VariableMapping {
  [key: string]: string; // variableName -> questionId
}

interface CalculatorRange {
  min: number;
  max: number;
  label: string;
  description: string;
}

interface Question {
  id: string;
  question_text: string;
  order_number: number;
}

interface SuggestedQuestion {
  text: string;
  options: { label: string; value: number }[];
}

interface CalculatorEditorProps {
  formula: string;
  resultUnit: string;
  displayFormat: string;
  decimalPlaces: number;
  variableMapping: VariableMapping;
  calculatorRanges: CalculatorRange[];
  questions: Question[];
  onFormulaChange: (formula: string) => void;
  onResultUnitChange: (unit: string) => void;
  onDisplayFormatChange: (format: string) => void;
  onDecimalPlacesChange: (places: number) => void;
  onVariableMappingChange: (mapping: VariableMapping) => void;
  onCalculatorRangesChange: (ranges: CalculatorRange[]) => void;
  onCreateSuggestedQuestions?: (questions: SuggestedQuestion[]) => Promise<void>;
}

export function CalculatorEditor({
  formula,
  resultUnit,
  displayFormat,
  decimalPlaces,
  variableMapping,
  calculatorRanges,
  questions,
  onFormulaChange,
  onResultUnitChange,
  onDisplayFormatChange,
  onDecimalPlacesChange,
  onVariableMappingChange,
  onCalculatorRangesChange,
  onCreateSuggestedQuestions,
}: CalculatorEditorProps) {
  const { t } = useTranslation();
  const [testValues, setTestValues] = useState<Record<string, number>>({});
  const [testResult, setTestResult] = useState<number | null>(null);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CalculatorTemplate | null>(null);
  const [isCreatingQuestions, setIsCreatingQuestions] = useState(false);

  // Aplicar template selecionado
  const handleApplyTemplate = (template: CalculatorTemplate) => {
    // Aplicar fórmula
    onFormulaChange(template.formula);
    
    // Aplicar configurações de exibição
    onDisplayFormatChange(template.displayFormat);
    onResultUnitChange(template.resultUnit);
    onDecimalPlacesChange(template.decimalPlaces);
    
    // Criar mapeamento de variáveis (sem associar perguntas ainda)
    const newMapping: VariableMapping = {};
    template.variables.forEach(v => {
      newMapping[v.name] = '';
    });
    onVariableMappingChange(newMapping);
    
    // Aplicar faixas de resultado
    onCalculatorRangesChange(template.ranges);
    
    // Salvar template selecionado para poder criar perguntas sugeridas
    setSelectedTemplate(template);
    
    setShowTemplateSelector(false);
  };

  // Criar perguntas sugeridas do template
  const handleCreateSuggestedQuestions = async () => {
    if (!selectedTemplate || !onCreateSuggestedQuestions) return;
    
    if (selectedTemplate.suggestedQuestions.length === 0) {
      return;
    }
    
    setIsCreatingQuestions(true);
    try {
      await onCreateSuggestedQuestions(selectedTemplate.suggestedQuestions);
    } finally {
      setIsCreatingQuestions(false);
    }
  };

  // Extrair variáveis da fórmula
  const extractVariables = (formulaStr: string): string[] => {
    const matches = formulaStr.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(1, -1)))];
  };

  const variables = extractVariables(formula);

  // Testar a fórmula com valores de teste
  const testFormula = () => {
    try {
      setFormulaError(null);
      let evalFormula = formula;
      
      // Substituir variáveis pelos valores de teste
      variables.forEach(v => {
        const regex = new RegExp(`\\{${v}\\}`, 'g');
        evalFormula = evalFormula.replace(regex, String(testValues[v] || 0));
      });
      
      // Validar que a fórmula só contém operações seguras
      if (!/^[0-9+\-*/(). ]+$/.test(evalFormula)) {
        throw new Error('Fórmula contém caracteres inválidos');
      }
      
      // Avaliar a fórmula de forma segura
      const result = Function(`"use strict"; return (${evalFormula})`)();
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Resultado inválido');
      }
      
      setTestResult(result);
    } catch (error) {
      setFormulaError(error instanceof Error ? error.message : 'Erro na fórmula');
      setTestResult(null);
    }
  };

  // Formatar resultado para exibição
  const formatResult = (value: number): string => {
    const rounded = Number(value.toFixed(decimalPlaces));
    
    switch (displayFormat) {
      case 'currency':
        return `R$ ${rounded.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${rounded}%`;
      case 'custom':
        return `${rounded} ${resultUnit}`;
      default:
        return String(rounded);
    }
  };

  // Inserir variável na fórmula
  const insertVariable = (varName: string) => {
    onFormulaChange(formula + `{${varName}}`);
  };

  // Adicionar nova variável
  const addVariable = () => {
    const newVarName = `var${Object.keys(variableMapping).length + 1}`;
    onVariableMappingChange({
      ...variableMapping,
      [newVarName]: questions[0]?.id || ''
    });
  };

  // Remover variável
  const removeVariable = (varName: string) => {
    const newMapping = { ...variableMapping };
    delete newMapping[varName];
    onVariableMappingChange(newMapping);
  };

  // Atualizar mapeamento de variável
  const updateVariableMapping = (varName: string, questionId: string) => {
    onVariableMappingChange({
      ...variableMapping,
      [varName]: questionId
    });
  };

  // Adicionar faixa de resultado
  const addRange = () => {
    const lastRange = calculatorRanges[calculatorRanges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    
    onCalculatorRangesChange([
      ...calculatorRanges,
      { min: newMin, max: newMin + 50, label: 'Nova faixa', description: '' }
    ]);
  };

  // Remover faixa
  const removeRange = (index: number) => {
    onCalculatorRangesChange(calculatorRanges.filter((_, i) => i !== index));
  };

  // Atualizar faixa
  const updateRange = (index: number, updates: Partial<CalculatorRange>) => {
    const newRanges = [...calculatorRanges];
    newRanges[index] = { ...newRanges[index], ...updates };
    onCalculatorRangesChange(newRanges);
  };

  // Mostrar seletor de templates
  if (showTemplateSelector) {
    return (
      <CalculatorTemplateSelector
        onSelectTemplate={handleApplyTemplate}
        onClose={() => setShowTemplateSelector(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão para usar template */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Comece com um template pronto</p>
                <p className="text-sm text-muted-foreground">IMC, ROI, Economia e mais</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowTemplateSelector(true)} variant="default" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Ver Templates
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão para criar perguntas sugeridas */}
      {selectedTemplate && selectedTemplate.suggestedQuestions.length > 0 && onCreateSuggestedQuestions && (
        <Card className="border-dashed border-2 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-medium">Criar perguntas sugeridas</p>
                  <p className="text-sm text-muted-foreground">
                    O template "{selectedTemplate.name}" sugere {selectedTemplate.suggestedQuestions.length} pergunta(s) prontas
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleCreateSuggestedQuestions} 
                variant="outline" 
                size="sm"
                disabled={isCreatingQuestions}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
              >
                {isCreatingQuestions ? (
                  <>Criando...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Perguntas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapeamento de Variáveis */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Variable className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Variáveis</CardTitle>
          </div>
          <CardDescription>
            Defina variáveis que capturam valores das respostas do quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(variableMapping).map(([varName, questionId]) => (
            <div key={varName} className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[120px]">
                <Badge variant="secondary" className="font-mono">
                  {`{${varName}}`}
                </Badge>
              </div>
              <Select
                value={questionId}
                onValueChange={(value) => updateVariableMapping(varName, value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma pergunta" />
                </SelectTrigger>
                <SelectContent>
                  {questions.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      Q{q.order_number + 1}: {q.question_text.substring(0, 40)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVariable(varName)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addVariable}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar variável
          </Button>
          
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> As variáveis capturam o valor numérico (score/pontos) da resposta selecionada em cada pergunta. Configure pontos nas opções de resposta.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Fórmula */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fórmula de Cálculo</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Use operadores matemáticos: + - * / ( )</p>
                  <p>Exemplo: ({`{peso}`} / ({`{altura}`} * {`{altura}`})) para IMC</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            Escreva a fórmula usando as variáveis definidas acima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={formula}
              onChange={(e) => onFormulaChange(e.target.value)}
              placeholder="Ex: ({var1} * 10 + {var2} * 5) / 2"
              className="font-mono"
              rows={3}
            />
            {formulaError && (
              <p className="text-sm text-destructive">{formulaError}</p>
            )}
          </div>
          
          {/* Botões para inserir variáveis */}
          {Object.keys(variableMapping).length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Inserir:</span>
              {Object.keys(variableMapping).map((varName) => (
                <Button
                  key={varName}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(varName)}
                >
                  {`{${varName}}`}
                </Button>
              ))}
            </div>
          )}
          
          {/* Teste da fórmula */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <Label className="font-semibold">Testar Fórmula</Label>
            
            <div className="grid grid-cols-2 gap-3">
              {variables.map((v) => (
                <div key={v} className="space-y-1">
                  <Label className="text-sm">{v}</Label>
                  <Input
                    type="number"
                    value={testValues[v] || ''}
                    onChange={(e) => setTestValues({
                      ...testValues,
                      [v]: parseFloat(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <Button onClick={testFormula} variant="secondary">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular
              </Button>
              {testResult !== null && (
                <div className="text-lg font-bold text-primary">
                  Resultado: {formatResult(testResult)}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Exibição */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Exibição do Resultado</CardTitle>
          <CardDescription>
            Configure como o resultado será exibido para o usuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={displayFormat} onValueChange={onDisplayFormatChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Número simples</SelectItem>
                  <SelectItem value="currency">Moeda (R$)</SelectItem>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Casas decimais</Label>
              <Select
                value={String(decimalPlaces)}
                onValueChange={(v) => onDecimalPlacesChange(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {displayFormat === 'custom' && (
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                value={resultUnit}
                onChange={(e) => onResultUnitChange(e.target.value)}
                placeholder="Ex: kg, pontos, anos"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faixas de Resultado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Faixas de Resultado (Opcional)</CardTitle>
              <CardDescription>
                Classifique o resultado em categorias (ex: baixo, médio, alto)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addRange}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar faixa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculatorRanges.map((range, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Faixa {index + 1}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRange(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mínimo</Label>
                  <Input
                    type="number"
                    value={range.min}
                    onChange={(e) => updateRange(index, { min: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Máximo</Label>
                  <Input
                    type="number"
                    value={range.max}
                    onChange={(e) => updateRange(index, { max: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rótulo</Label>
                  <Input
                    value={range.label}
                    onChange={(e) => updateRange(index, { label: e.target.value })}
                    placeholder="Ex: Baixo"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea
                  value={range.description}
                  onChange={(e) => updateRange(index, { description: e.target.value })}
                  placeholder="Texto exibido quando o resultado cai nesta faixa"
                  rows={2}
                />
              </div>
            </div>
          ))}
          
          {calculatorRanges.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma faixa definida. O resultado será exibido apenas como número.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
