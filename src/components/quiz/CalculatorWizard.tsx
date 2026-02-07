import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, Variable, Calculator, Layers } from "lucide-react";
import { VariableStep } from "./wizard/VariableStep";
import { FormulaStep } from "./wizard/FormulaStep";
import { RangesStep } from "./wizard/RangesStep";

interface Question {
  id: string;
  question_text: string;
  order_number: number;
}

interface VariableMapping {
  [variableName: string]: string;
}

interface CalculatorRange {
  min: number;
  max: number;
  label: string;
  description: string;
}

interface CalculatorConfig {
  formula: string;
  resultUnit: string;
  displayFormat: string;
  decimalPlaces: number;
  variableMapping: VariableMapping;
  calculatorRanges: CalculatorRange[];
}

interface CalculatorWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: Question[];
  initialConfig?: Partial<CalculatorConfig>;
  onSave: (config: CalculatorConfig) => void;
}

const STEPS = [
  { id: 'variables', icon: Variable, label: 'Variáveis' },
  { id: 'formula', icon: Calculator, label: 'Fórmula' },
  { id: 'ranges', icon: Layers, label: 'Faixas' },
];

export const CalculatorWizard = ({
  open,
  onOpenChange,
  questions,
  initialConfig,
  onSave,
}: CalculatorWizardProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Estado local do wizard
  const [formula, setFormula] = useState(initialConfig?.formula || '');
  const [resultUnit, setResultUnit] = useState(initialConfig?.resultUnit || '');
  const [displayFormat, setDisplayFormat] = useState(initialConfig?.displayFormat || 'number');
  const [decimalPlaces, setDecimalPlaces] = useState(initialConfig?.decimalPlaces ?? 2);
  const [variableMapping, setVariableMapping] = useState<VariableMapping>(initialConfig?.variableMapping || {});
  const [calculatorRanges, setCalculatorRanges] = useState<CalculatorRange[]>(initialConfig?.calculatorRanges || []);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Variables
        return Object.keys(variableMapping).length > 0;
      case 1: // Formula
        return formula.trim().length > 0;
      case 2: // Ranges
        return true; // Ranges são opcionais
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Salvar e fechar
      onSave({
        formula,
        resultUnit,
        displayFormat,
        decimalPlaces,
        variableMapping,
        calculatorRanges,
      });
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state on close
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {t('createQuiz.calculator.wizardTitle', 'Configurar Calculadora')}
          </DialogTitle>
          <DialogDescription>
            {t('createQuiz.calculator.wizardDesc', 'Crie uma calculadora personalizada para seu quiz')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          
          {/* Steps indicator */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    isActive 
                      ? 'text-primary font-medium' 
                      : isCompleted 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isActive 
                      ? 'border-primary bg-primary/10' 
                      : isCompleted 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-muted'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
          {currentStep === 0 && (
            <VariableStep
              questions={questions}
              variableMapping={variableMapping}
              onVariableMappingChange={setVariableMapping}
            />
          )}
          
          {currentStep === 1 && (
            <FormulaStep
              formula={formula}
              onFormulaChange={setFormula}
              variableMapping={variableMapping}
              displayFormat={displayFormat}
              onDisplayFormatChange={setDisplayFormat}
              decimalPlaces={decimalPlaces}
              onDecimalPlacesChange={setDecimalPlaces}
              resultUnit={resultUnit}
              onResultUnitChange={setResultUnit}
            />
          )}
          
          {currentStep === 2 && (
            <RangesStep
              ranges={calculatorRanges}
              onRangesChange={setCalculatorRanges}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Voltar')}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === STEPS.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('common.save', 'Salvar')}
              </>
            ) : (
              <>
                {t('common.next', 'Próximo')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
