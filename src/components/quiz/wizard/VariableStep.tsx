import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Variable } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  order_number: number;
}

interface VariableMapping {
  [variableName: string]: string; // variableName -> questionId
}

interface VariableStepProps {
  questions: Question[];
  variableMapping: VariableMapping;
  onVariableMappingChange: (mapping: VariableMapping) => void;
}

export const VariableStep = ({
  questions,
  variableMapping,
  onVariableMappingChange,
}: VariableStepProps) => {
  const { t } = useTranslation();

  // Inverter mapping para questionId -> variableName para facilitar UI
  const questionToVariable: Record<string, string> = {};
  Object.entries(variableMapping).forEach(([varName, qId]) => {
    questionToVariable[qId] = varName;
  });

  const toggleQuestion = (questionId: string, checked: boolean) => {
    const newMapping = { ...variableMapping };
    
    if (checked) {
      // Gerar próximo nome de variável disponível (X1, X2, X3...)
      const usedNumbers = Object.keys(variableMapping)
        .filter(k => k.startsWith('X'))
        .map(k => parseInt(k.slice(1)))
        .filter(n => !isNaN(n));
      
      let nextNum = 1;
      while (usedNumbers.includes(nextNum)) {
        nextNum++;
      }
      
      newMapping[`X${nextNum}`] = questionId;
    } else {
      // Remover variável associada a esta pergunta
      const varToRemove = Object.entries(newMapping).find(([_, qId]) => qId === questionId)?.[0];
      if (varToRemove) {
        delete newMapping[varToRemove];
      }
    }
    
    onVariableMappingChange(newMapping);
  };

  const updateVariableName = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    if (variableMapping[newName]) return; // Nome já existe
    
    const newMapping = { ...variableMapping };
    const questionId = newMapping[oldName];
    delete newMapping[oldName];
    newMapping[newName.toUpperCase()] = questionId;
    
    onVariableMappingChange(newMapping);
  };

  const isSelected = (questionId: string) => {
    return Object.values(variableMapping).includes(questionId);
  };

  const getVariableName = (questionId: string) => {
    return Object.entries(variableMapping).find(([_, qId]) => qId === questionId)?.[0] || '';
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Variable className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">
          {t('createQuiz.calculator.selectVariables', 'Selecionar Variáveis')}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('createQuiz.calculator.selectVariablesDesc', 'Escolha quais perguntas serão usadas na fórmula')}
        </p>
      </div>

      {questions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('createQuiz.calculator.noQuestions', 'Nenhuma pergunta criada ainda. Crie perguntas primeiro.')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {questions.map((question, idx) => {
            const selected = isSelected(question.id);
            const varName = getVariableName(question.id);
            
            return (
              <Card 
                key={question.id} 
                className={`transition-all ${selected ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`q-${question.id}`}
                      checked={selected}
                      onCheckedChange={(checked) => toggleQuestion(question.id, !!checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={`q-${question.id}`} 
                        className="text-sm font-medium cursor-pointer block"
                      >
                        <Badge variant="outline" className="mr-2 font-mono">
                          Q{idx + 1}
                        </Badge>
                        {question.question_text.length > 60 
                          ? question.question_text.slice(0, 60) + '...' 
                          : question.question_text}
                      </Label>
                    </div>
                    
                    {selected && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">=</span>
                        <Input
                          value={varName}
                          onChange={(e) => updateVariableName(varName, e.target.value)}
                          className="w-16 h-8 text-center font-mono text-sm uppercase"
                          placeholder="X1"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {Object.keys(variableMapping).length > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">
            {t('createQuiz.calculator.variablesPreview', 'Variáveis definidas:')}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(variableMapping).map(([varName, qId]) => {
              const question = questions.find(q => q.id === qId);
              return (
                <Badge key={varName} variant="secondary" className="font-mono">
                  {varName} = Q{question ? question.order_number + 1 : '?'}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
