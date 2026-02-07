import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, AlertCircle, CheckCircle2 } from "lucide-react";

interface VariableMapping {
  [variableName: string]: string;
}

interface FormulaStepProps {
  formula: string;
  onFormulaChange: (formula: string) => void;
  variableMapping: VariableMapping;
  displayFormat: string;
  onDisplayFormatChange: (format: string) => void;
  decimalPlaces: number;
  onDecimalPlacesChange: (places: number) => void;
  resultUnit: string;
  onResultUnitChange: (unit: string) => void;
}

export const FormulaStep = ({
  formula,
  onFormulaChange,
  variableMapping,
  displayFormat,
  onDisplayFormatChange,
  decimalPlaces,
  onDecimalPlacesChange,
  resultUnit,
  onResultUnitChange,
}: FormulaStepProps) => {
  const { t } = useTranslation();
  const [testResult, setTestResult] = useState<{ value: number | null; error: string | null }>({ value: null, error: null });

  const variables = Object.keys(variableMapping);

  // Inserir variável na fórmula
  const insertVariable = (varName: string) => {
    onFormulaChange(formula + varName);
  };

  // Inserir operador
  const insertOperator = (op: string) => {
    onFormulaChange(formula + ` ${op} `);
  };

  // Testar fórmula com valores de exemplo
  useEffect(() => {
    if (!formula.trim()) {
      setTestResult({ value: null, error: null });
      return;
    }

    try {
      // Substituir variáveis por valores de teste (5 para cada)
      let testFormula = formula;
      variables.forEach(v => {
        testFormula = testFormula.replace(new RegExp(v, 'gi'), '5');
      });

      // Validar que só contém caracteres permitidos
      if (!/^[\d\s+\-*/().]+$/.test(testFormula)) {
        throw new Error('Caracteres inválidos na fórmula');
      }

      // Avaliar de forma segura
      const result = Function(`"use strict"; return (${testFormula})`)();
      
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('Resultado inválido');
      }

      setTestResult({ value: result, error: null });
    } catch (err) {
      setTestResult({ value: null, error: 'Fórmula inválida' });
    }
  }, [formula, variables]);

  const formatPreview = (value: number) => {
    const formatted = value.toFixed(decimalPlaces);
    switch (displayFormat) {
      case 'currency':
        return `R$ ${formatted}`;
      case 'percentage':
        return `${formatted}%`;
      default:
        return resultUnit ? `${formatted} ${resultUnit}` : formatted;
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">
          {t('createQuiz.calculator.writeFormula', 'Escrever Fórmula')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('createQuiz.calculator.writeFormulaDesc', 'Use as variáveis para criar sua fórmula matemática')}
        </p>
      </div>

      {/* Botões de variáveis */}
      {variables.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t('createQuiz.calculator.clickToInsert', 'Clique para inserir:')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {variables.map(v => (
              <Button
                key={v}
                variant="outline"
                size="sm"
                onClick={() => insertVariable(v)}
                className="font-mono"
              >
                {v}
              </Button>
            ))}
            <div className="w-px h-6 bg-border self-center mx-1" />
            {['+', '-', '*', '/', '(', ')'].map(op => (
              <Button
                key={op}
                variant="ghost"
                size="sm"
                onClick={() => insertOperator(op)}
                className="font-mono w-8"
              >
                {op}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Campo da fórmula */}
      <div className="space-y-2">
        <Label>{t('createQuiz.calculator.formula', 'Fórmula')}</Label>
        <Input
          value={formula}
          onChange={(e) => onFormulaChange(e.target.value.toUpperCase())}
          placeholder="Ex: (X1 + X2) * 10 / X3"
          className="font-mono text-lg"
        />
        
        {/* Feedback de validação */}
        {formula && (
          <div className={`flex items-center gap-2 text-sm ${testResult.error ? 'text-destructive' : 'text-green-600'}`}>
            {testResult.error ? (
              <>
                <AlertCircle className="h-4 w-4" />
                {testResult.error}
              </>
            ) : testResult.value !== null ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t('createQuiz.calculator.testResult', 'Teste (todas variáveis = 5):')} {formatPreview(testResult.value)}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Formatação do resultado */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <Label className="text-base font-medium">
            {t('createQuiz.calculator.formatting', 'Formatação do Resultado')}
          </Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('createQuiz.calculator.format', 'Formato')}</Label>
              <Select value={displayFormat} onValueChange={onDisplayFormatChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">{t('createQuiz.calculator.formatNumber', 'Número')}</SelectItem>
                  <SelectItem value="currency">{t('createQuiz.calculator.formatCurrency', 'Moeda (R$)')}</SelectItem>
                  <SelectItem value="percentage">{t('createQuiz.calculator.formatPercentage', 'Porcentagem (%)')}</SelectItem>
                  <SelectItem value="custom">{t('createQuiz.calculator.formatCustom', 'Personalizado')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">{t('createQuiz.calculator.decimals', 'Casas decimais')}</Label>
              <Select value={String(decimalPlaces)} onValueChange={(v) => onDecimalPlacesChange(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {displayFormat === 'custom' && (
            <div className="space-y-2">
              <Label className="text-sm">{t('createQuiz.calculator.unit', 'Unidade')}</Label>
              <Input
                value={resultUnit}
                onChange={(e) => onResultUnitChange(e.target.value)}
                placeholder="Ex: kg, km, pontos"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {testResult.value !== null && (
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-1">
            {t('createQuiz.calculator.resultPreview', 'Preview do resultado:')}
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatPreview(testResult.value)}
          </p>
        </div>
      )}
    </div>
  );
};
