import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GitBranch, AlertCircle, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';

export interface ConditionRule {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

export interface QuestionConditions {
  logic: 'AND' | 'OR';
  rules: ConditionRule[];
}

interface ConditionBuilderProps {
  conditions: QuestionConditions | null;
  onChange: (conditions: QuestionConditions | null) => void;
  availableQuestions: { id: string; text: string; options?: string[] }[];
  currentQuestionIndex: number;
}

const OPERATORS = [
  { value: 'equals', label: 'É igual a' },
  { value: 'not_equals', label: 'É diferente de' },
  { value: 'contains', label: 'Contém' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
];

export const ConditionBuilder = ({
  conditions,
  onChange,
  availableQuestions,
  currentQuestionIndex,
}: ConditionBuilderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowQuizBranching, isLoading: planLoading } = usePlanFeatures();
  const [enabled, setEnabled] = useState(conditions !== null && conditions.rules.length > 0);
  const [localConditions, setLocalConditions] = useState<QuestionConditions>(
    conditions || { logic: 'AND', rules: [] }
  );

  // Filtrar apenas perguntas anteriores à atual
  const previousQuestions = availableQuestions.filter((_, idx) => idx < currentQuestionIndex);

  // ✅ useEffect ANTES de qualquer early return (Regra de Hooks do React)
  useEffect(() => {
    if (enabled && localConditions.rules.length > 0) {
      onChange(localConditions);
    } else if (!enabled) {
      onChange(null);
    }
  }, [enabled, localConditions, onChange]);

  // ✅ Agora pode fazer early returns com segurança
  // Verificar permissão do plano - mostrar versão bloqueada
  if (!allowQuizBranching && !planLoading) {
    return (
      <Card className="border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10 relative">
                <GitBranch className="h-4 w-4 text-primary" />
                <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  Quiz Branching
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                    Pro
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Crie perguntas condicionais baseadas em respostas anteriores
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/precos')}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAddRule = () => {
    if (previousQuestions.length === 0) return;
    
    const newRule: ConditionRule = {
      questionId: previousQuestions[0].id,
      operator: 'equals',
      value: '',
    };
    
    setLocalConditions(prev => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  const handleRemoveRule = (index: number) => {
    setLocalConditions(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleRuleChange = (index: number, field: keyof ConditionRule, value: string) => {
    setLocalConditions(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === index ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const handleLogicChange = (logic: 'AND' | 'OR') => {
    setLocalConditions(prev => ({ ...prev, logic }));
  };

  const getQuestionOptions = (questionId: string): string[] => {
    const question = previousQuestions.find(q => q.id === questionId);
    return question?.options || [];
  };

  if (currentQuestionIndex === 0) {
    return (
      <Card className="border-dashed border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-1.5 rounded-md bg-purple-500/10">
              <GitBranch className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Quiz Branching</p>
              <p className="text-xs">A primeira pergunta não pode ter condições (é sempre exibida)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (previousQuestions.length === 0) {
    return (
      <Card className="border-dashed border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-1.5 rounded-md bg-purple-500/10">
              <GitBranch className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Quiz Branching</p>
              <p className="text-xs">Configure perguntas anteriores para usar lógica condicional</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-500/10">
              <GitBranch className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Quiz Branching
                <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  Lógica Condicional
                </Badge>
              </CardTitle>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Mostrar esta pergunta apenas se condições forem atendidas (baseado em respostas anteriores)
        </p>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          {localConditions.rules.length > 1 && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Combinar regras com:</Label>
              <Select
                value={localConditions.logic}
                onValueChange={(v) => handleLogicChange(v as 'AND' | 'OR')}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">E (todas)</SelectItem>
                  <SelectItem value="OR">OU (qualquer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {localConditions.rules.map((rule, index) => {
            const questionOptions = getQuestionOptions(rule.questionId);
            
            return (
              <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {index > 0 && (
                  <Badge variant="outline" className="mr-2">
                    {localConditions.logic}
                  </Badge>
                )}
                
                <span className="text-sm font-medium">Se</span>
                
                <Select
                  value={rule.questionId}
                  onValueChange={(v) => handleRuleChange(index, 'questionId', v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecione pergunta" />
                  </SelectTrigger>
                  <SelectContent>
                    {previousQuestions.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.text.substring(0, 30)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={rule.operator}
                  onValueChange={(v) => handleRuleChange(index, 'operator', v)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {questionOptions.length > 0 ? (
                  <Select
                    value={rule.value}
                    onValueChange={(v) => handleRuleChange(index, 'value', v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Selecione valor" />
                    </SelectTrigger>
                    <SelectContent>
                      {questionOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={rule.value}
                    onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                    placeholder="Valor"
                    className="w-40"
                  />
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRule(index)}
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRule}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar condição
          </Button>
        </CardContent>
      )}
    </Card>
  );
};
