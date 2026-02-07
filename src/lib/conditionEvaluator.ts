/**
 * Avaliador de condições para Quiz Branching
 * Verifica se uma pergunta deve ser exibida baseado nas respostas anteriores
 */

import type { QuestionConditions, ConditionRule } from '@/components/quiz/ConditionBuilder';

/**
 * Avalia uma única regra de condição
 */
const evaluateRule = (
  rule: ConditionRule,
  answers: Record<string, any>
): boolean => {
  const answer = answers[rule.questionId];
  
  // Se não há resposta para a pergunta referenciada, a condição falha
  if (answer === undefined || answer === null) {
    return false;
  }

  const answerStr = String(answer).toLowerCase();
  const valueStr = String(rule.value).toLowerCase();

  switch (rule.operator) {
    case 'equals':
      if (Array.isArray(answer)) {
        // Para múltipla escolha, verifica se o valor está no array
        return answer.map(a => String(a).toLowerCase()).includes(valueStr);
      }
      return answerStr === valueStr;

    case 'not_equals':
      if (Array.isArray(answer)) {
        return !answer.map(a => String(a).toLowerCase()).includes(valueStr);
      }
      return answerStr !== valueStr;

    case 'contains':
      if (Array.isArray(answer)) {
        return answer.some(a => String(a).toLowerCase().includes(valueStr));
      }
      return answerStr.includes(valueStr);

    case 'greater_than':
      const numAnswer = parseFloat(answerStr);
      const numValue = parseFloat(valueStr);
      if (isNaN(numAnswer) || isNaN(numValue)) return false;
      return numAnswer > numValue;

    case 'less_than':
      const numAns = parseFloat(answerStr);
      const numVal = parseFloat(valueStr);
      if (isNaN(numAns) || isNaN(numVal)) return false;
      return numAns < numVal;

    default:
      return false;
  }
};

/**
 * Avalia todas as condições de uma pergunta
 * @param conditions - Condições da pergunta
 * @param answers - Respostas do usuário (questionId -> valor)
 * @returns true se a pergunta deve ser exibida, false caso contrário
 */
export const evaluateConditions = (
  conditions: QuestionConditions | null | undefined,
  answers: Record<string, any>
): boolean => {
  // Se não há condições, a pergunta sempre é exibida
  if (!conditions || !conditions.rules || conditions.rules.length === 0) {
    return true;
  }

  const results = conditions.rules.map(rule => evaluateRule(rule, answers));

  if (conditions.logic === 'AND') {
    // Todas as regras devem ser verdadeiras
    return results.every(r => r);
  } else {
    // Pelo menos uma regra deve ser verdadeira
    return results.some(r => r);
  }
};

/**
 * Filtra perguntas que devem ser exibidas baseado nas condições e respostas
 * @param questions - Lista de perguntas com conditions
 * @param answers - Respostas do usuário
 * @returns Lista de perguntas filtradas que devem ser exibidas
 */
export const filterVisibleQuestions = <T extends { id: string; conditions?: QuestionConditions | null }>(
  questions: T[],
  answers: Record<string, any>
): T[] => {
  return questions.filter(question => 
    evaluateConditions(question.conditions, answers)
  );
};

/**
 * Detecta ciclos potenciais nas condições (prevenção de loops infinitos)
 * @param questions - Lista de perguntas com conditions
 * @returns Array de IDs de perguntas que formam ciclos
 */
export const detectConditionCycles = (
  questions: { id: string; conditions?: QuestionConditions | null }[]
): string[] => {
  const cycles: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (questionId: string): boolean => {
    if (recursionStack.has(questionId)) {
      return true;
    }
    if (visited.has(questionId)) {
      return false;
    }

    visited.add(questionId);
    recursionStack.add(questionId);

    const question = questions.find(q => q.id === questionId);
    if (question?.conditions?.rules) {
      for (const rule of question.conditions.rules) {
        if (hasCycle(rule.questionId)) {
          cycles.push(questionId);
          return true;
        }
      }
    }

    recursionStack.delete(questionId);
    return false;
  };

  for (const question of questions) {
    if (!visited.has(question.id)) {
      hasCycle(question.id);
    }
  }

  return cycles;
};
