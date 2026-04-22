// ✅ Etapa 4: ConditionBuilder visual com drag-and-drop, autocomplete de opções e UX melhorada
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, GitBranch, Lock, Sparkles, GripVertical, Copy, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface ConditionRule {
  id?: string;
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
  { value: 'equals', label: 'É igual a', icon: '=' },
  { value: 'not_equals', label: 'É diferente de', icon: '≠' },
  { value: 'contains', label: 'Contém', icon: '∋' },
  { value: 'greater_than', label: 'Maior que', icon: '>' },
  { value: 'less_than', label: 'Menor que', icon: '<' },
];

// Gerar ID único para regras
const generateRuleId = () => `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Migrar regras antigas sem id — garante que todas tenham id
const migrateRules = (rules: any[]): (ConditionRule & { id: string })[] =>
  rules.map(r => ({ ...r, id: r.id || generateRuleId() }));

// ========== Sortable Rule Card ==========
interface SortableRuleCardProps {
  rule: ConditionRule;
  index: number;
  logic: 'AND' | 'OR';
  previousQuestions: { id: string; text: string; options?: string[] }[];
  onUpdate: (index: number, field: keyof ConditionRule, value: string) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  showLogicBadge: boolean;
}

const SortableRuleCard = ({
  rule, index, logic, previousQuestions,
  onUpdate, onRemove, onDuplicate, showLogicBadge,
}: SortableRuleCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const questionOptions = previousQuestions.find(q => q.id === rule.questionId)?.options || [];
  const questionLabel = previousQuestions.find(q => q.id === rule.questionId)?.text || 'Pergunta';
  const operatorInfo = OPERATORS.find(op => op.value === rule.operator);

  // Resumo legível da regra
  const ruleSummary = `"${questionLabel.substring(0, 25)}${questionLabel.length > 25 ? '…' : ''}" ${operatorInfo?.icon || '='} "${rule.value || '…'}"`;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logic badge between rules */}
      {showLogicBadge && (
        <div className="flex justify-center -mb-1 -mt-1">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold px-2 py-0",
              logic === 'AND'
                ? 'border-blue-400/50 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                : 'border-amber-400/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
            )}
          >
            {logic === 'AND' ? 'E' : 'OU'}
          </Badge>
        </div>
      )}

      <div className={cn(
        "relative flex items-start gap-2 p-3 rounded-lg border transition-all group",
        isDragging
          ? "border-primary shadow-lg ring-2 ring-primary/20 bg-background"
          : "border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
      )}>
        {/* Drag handle */}
        <button
          type="button"
          className="mt-1 p-1 rounded text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Rule content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Row 1: Readable summary */}
          <p className="text-xs text-muted-foreground truncate" title={ruleSummary}>
            Regra {index + 1}: {ruleSummary}
          </p>

          {/* Row 2: Editable fields */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-primary shrink-0">SE</span>

            {/* Question selector */}
            <Select
              value={rule.questionId}
              onValueChange={(v) => onUpdate(index, 'questionId', v)}
            >
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Pergunta..." />
              </SelectTrigger>
              <SelectContent>
                {previousQuestions.map((q, qIdx) => (
                  <SelectItem key={q.id} value={q.id} className="text-xs">
                    <span className="font-mono text-muted-foreground mr-1">P{qIdx + 1}.</span>
                    {q.text.substring(0, 35)}{q.text.length > 35 ? '…' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator */}
            <Select
              value={rule.operator}
              onValueChange={(v) => onUpdate(index, 'operator', v)}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value} className="text-xs">
                    <span className="font-mono mr-1">{op.icon}</span> {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value: dropdown if question has options, text input otherwise */}
            {questionOptions.length > 0 ? (
              <Select
                value={rule.value}
                onValueChange={(v) => onUpdate(index, 'value', v)}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Valor..." />
                </SelectTrigger>
                <SelectContent>
                  {questionOptions.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={rule.value}
                onChange={(e) => onUpdate(index, 'value', e.target.value)}
                placeholder="Valor..."
                className="w-36 h-8 text-xs"
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDuplicate(index)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left"><p>Duplicar regra</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left"><p>Remover regra</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

// ========== Preview da avaliação ==========
const ConditionPreview = ({ conditions, previousQuestions }: {
  conditions: QuestionConditions;
  previousQuestions: { id: string; text: string; options?: string[] }[];
}) => {
  if (conditions.rules.length === 0) return null;

  const logicWord = conditions.logic === 'AND' ? 'E' : 'OU';

  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
      <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
        <Eye className="h-3 w-3" />
        Resumo da lógica:
      </p>
      <p className="text-xs text-foreground/80">
        Esta pergunta será exibida{' '}
        <span className="font-medium">
          {conditions.logic === 'AND' ? 'somente se TODAS' : 'se QUALQUER UMA'}
        </span>
        {' '}das condições forem verdadeiras:
      </p>
      <ul className="text-xs text-muted-foreground space-y-0.5 ml-3">
        {conditions.rules.map((rule, idx) => {
          const q = previousQuestions.find(pq => pq.id === rule.questionId);
          const op = OPERATORS.find(o => o.value === rule.operator);
          return (
            <li key={rule.id || idx} className="flex items-center gap-1">
              {idx > 0 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 mr-1">{logicWord}</Badge>
              )}
              <span>"{q?.text?.substring(0, 25) || '?'}…"</span>
              <span className="font-mono text-primary">{op?.icon}</span>
              <span className="font-medium">"{rule.value || '?'}"</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ========== Main Component ==========
export const ConditionBuilder = ({
  conditions,
  onChange,
  availableQuestions,
  currentQuestionIndex,
}: ConditionBuilderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allowQuizBranching, isLoading: planLoading } = usePlanFeatures();
  const [enabled, setEnabled] = useState(conditions !== null && (conditions.rules?.length || 0) > 0);
  const [localConditions, setLocalConditions] = useState<QuestionConditions>(() => {
    if (!conditions) return { logic: 'AND', rules: [] };
    return { ...conditions, rules: migrateRules(conditions.rules || []) };
  });
  const [showPreview, setShowPreview] = useState(true);

  const previousQuestions = availableQuestions.filter((_, idx) => idx < currentQuestionIndex);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync to parent
  useEffect(() => {
    if (enabled && localConditions.rules.length > 0) {
      onChange(localConditions);
    } else if (!enabled) {
      onChange(null);
    }
  }, [enabled, localConditions, onChange]);

  // Sync from parent
  useEffect(() => {
    if (conditions) {
      setLocalConditions({ ...conditions, rules: migrateRules(conditions.rules || []) });
      setEnabled(conditions.rules?.length > 0);
    }
  }, [conditions]);

  // Blocked plan state
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
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Pro</Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Crie perguntas condicionais baseadas em respostas anteriores
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/precos')} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // First question — no conditions possible
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

  // No previous questions with options
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

  // ========== Handlers ==========
  const handleAddRule = () => {
    const newRule: ConditionRule = {
      id: generateRuleId(),
      questionId: previousQuestions[0].id,
      operator: 'equals',
      value: '',
    };
    setLocalConditions(prev => ({ ...prev, rules: [...prev.rules, newRule] }));
  };

  const handleRemoveRule = (index: number) => {
    setLocalConditions(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  };

  const handleDuplicateRule = (index: number) => {
    setLocalConditions(prev => {
      const original = prev.rules[index];
      const clone: ConditionRule = { ...original, id: generateRuleId() };
      const newRules = [...prev.rules];
      newRules.splice(index + 1, 0, clone);
      return { ...prev, rules: newRules };
    });
  };

  const handleRuleChange = (index: number, field: keyof ConditionRule, value: string) => {
    setLocalConditions(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? { ...rule, [field]: value } : rule),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalConditions(prev => {
      const oldIdx = prev.rules.findIndex(r => r.id === active.id);
      const newIdx = prev.rules.findIndex(r => r.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return { ...prev, rules: arrayMove(prev.rules, oldIdx, newIdx) };
    });
  };

  const ruleIds = localConditions.rules.map(r => r.id);

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
                {localConditions.rules.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {localConditions.rules.length} regra{localConditions.rules.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowPreview(p => !p)}
                  >
                    {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{showPreview ? 'Ocultar resumo' : 'Mostrar resumo'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Mostrar esta pergunta apenas se condições forem atendidas
        </p>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-3">
          {/* Logic selector */}
          {localConditions.rules.length > 1 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Label className="text-xs shrink-0">Combinar com:</Label>
              <div className="flex gap-1">
                {(['AND', 'OR'] as const).map(l => (
                  <Button
                    key={l}
                    type="button"
                    variant={localConditions.logic === l ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "h-7 text-xs px-3",
                      localConditions.logic === l && l === 'AND' && "bg-blue-600 hover:bg-blue-700",
                      localConditions.logic === l && l === 'OR' && "bg-amber-600 hover:bg-amber-700",
                    )}
                    onClick={() => setLocalConditions(prev => ({ ...prev, logic: l }))}
                  >
                    {l === 'AND' ? 'E (todas)' : 'OU (qualquer)'}
                  </Button>
                ))}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p><strong>E:</strong> Todas as regras devem ser verdadeiras</p>
                    <p><strong>OU:</strong> Basta uma regra ser verdadeira</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Sortable rules */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ruleIds} strategy={verticalListSortingStrategy}>
              <AnimatePresence mode="popLayout">
                <div className="space-y-2">
                  {localConditions.rules.map((rule, index) => (
                    <SortableRuleCard
                      key={rule.id}
                      rule={rule}
                      index={index}
                      logic={localConditions.logic}
                      previousQuestions={previousQuestions}
                      onUpdate={handleRuleChange}
                      onRemove={handleRemoveRule}
                      onDuplicate={handleDuplicateRule}
                      showLogicBadge={index > 0}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </SortableContext>
          </DndContext>

          {/* Add rule button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRule}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar condição
          </Button>

          {/* Preview */}
          {showPreview && localConditions.rules.length > 0 && (
            <ConditionPreview conditions={localConditions} previousQuestions={previousQuestions} />
          )}
        </CardContent>
      )}
    </Card>
  );
};
