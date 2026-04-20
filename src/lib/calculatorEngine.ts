import { logger } from '@/lib/logger';
/**
 * Motor de cálculo para quizzes do tipo calculadora
 * Avalia fórmulas matemáticas com variáveis das respostas do quiz
 */

interface VariableMapping {
  [variableName: string]: string; // variableName -> questionId
}

interface CalculatorRange {
  min: number;
  max: number;
  label: string;
  description: string;
}

interface QuestionBlock {
  type: string;
  options?: string[];
  scores?: number[];
  answerFormat?: string;
}

interface Question {
  id: string;
  blocks?: QuestionBlock[];
}

interface CalculatorResult {
  rawValue: number;
  formattedValue: string;
  range?: CalculatorRange;
  success: boolean;
  error?: string;
}

/**
 * Extrai o valor numérico (score) de uma resposta do quiz
 */
export function getAnswerScore(
  questionId: string,
  answer: string | string[] | undefined,
  questions: Question[]
): number {
  if (!answer) return 0;
  
  const question = questions.find(q => q.id === questionId);
  if (!question?.blocks) return 0;
  
  const questionBlock = question.blocks.find(b => b.type === 'question') as QuestionBlock | undefined;
  if (!questionBlock) return 0;
  
  const options = questionBlock.options || [];
  const scores = questionBlock.scores || [];
  
  // Múltipla escolha: somar scores de todas as opções selecionadas
  if (Array.isArray(answer)) {
    return answer.reduce((total, selectedOption) => {
      const optionIndex = options.indexOf(selectedOption);
      if (optionIndex !== -1 && scores[optionIndex] !== undefined) {
        return total + scores[optionIndex];
      }
      return total;
    }, 0);
  }
  
  // Escolha única ou sim/não
  const optionIndex = options.indexOf(answer);
  if (optionIndex !== -1 && scores[optionIndex] !== undefined) {
    return scores[optionIndex];
  }
  
  // Tentar converter a resposta diretamente para número (short_text numérico)
  const numericAnswer = parseFloat(answer);
  if (!isNaN(numericAnswer)) {
    return numericAnswer;
  }
  
  return 0;
}

/**
 * Substitui variáveis na fórmula pelos valores das respostas
 */
export function substituteVariables(
  formula: string,
  variableMapping: VariableMapping,
  answers: Record<string, string | string[]>,
  questions: Question[]
): string {
  let result = formula;
  
  Object.entries(variableMapping).forEach(([varName, questionId]) => {
    const answer = answers[questionId];
    const score = getAnswerScore(questionId, answer, questions);
    
    // Substituir todas as ocorrências da variável
    const regex = new RegExp(`\\{${varName}\\}`, 'g');
    result = result.replace(regex, String(score));
  });
  
  return result;
}

/**
 * Avalia uma fórmula matemática de forma segura
 * Só permite operações básicas: + - * / ( ) e números
 */
export function evaluateFormula(formula: string): number {
  // Remover espaços extras
  const cleanFormula = formula.replace(/\s+/g, ' ').trim();
  
  // Validar que só contém caracteres permitidos
  if (!/^[0-9+\-*/(). ]+$/.test(cleanFormula)) {
    throw new Error('Fórmula contém caracteres inválidos');
  }
  
  // Avaliar de forma segura usando Function
  try {
    const result = Function(`"use strict"; return (${cleanFormula})`)();
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Resultado inválido');
    }
    
    return result;
  } catch (error) {
    throw new Error('Erro ao calcular fórmula');
  }
}

/**
 * Formata o resultado para exibição
 */
export function formatResult(
  value: number,
  displayFormat: string,
  decimalPlaces: number,
  resultUnit?: string
): string {
  const rounded = Number(value.toFixed(decimalPlaces));
  
  switch (displayFormat) {
    case 'currency':
      return `R$ ${rounded.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`;
    case 'percentage':
      return `${rounded.toLocaleString('pt-BR', { 
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces 
      })}%`;
    case 'custom':
      return `${rounded.toLocaleString('pt-BR', { 
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces 
      })} ${resultUnit || ''}`.trim();
    default:
      return rounded.toLocaleString('pt-BR', { 
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces 
      });
  }
}

/**
 * Encontra a faixa (range) correspondente ao valor calculado
 */
export function findRange(
  value: number,
  ranges: CalculatorRange[]
): CalculatorRange | undefined {
  return ranges.find(range => value >= range.min && value <= range.max);
}

/**
 * Função principal: calcula o resultado do quiz calculadora
 */
export function calculateQuizResult(
  formula: string,
  variableMapping: VariableMapping,
  answers: Record<string, string | string[]>,
  questions: Question[],
  displayFormat: string = 'number',
  decimalPlaces: number = 2,
  resultUnit?: string,
  calculatorRanges: CalculatorRange[] = []
): CalculatorResult {
  try {
    // 1. Substituir variáveis pelos valores
    const substitutedFormula = substituteVariables(
      formula,
      variableMapping,
      answers,
      questions
    );
    
    logger.log('📊 Calculator:', {
      originalFormula: formula,
      substitutedFormula,
      variableMapping,
      answersCount: Object.keys(answers).length
    });
    
    // 2. Avaliar a fórmula
    const rawValue = evaluateFormula(substitutedFormula);
    
    // 3. Formatar o resultado
    const formattedValue = formatResult(rawValue, displayFormat, decimalPlaces, resultUnit);
    
    // 4. Encontrar a faixa correspondente
    const range = findRange(rawValue, calculatorRanges);
    
    logger.log('✅ Calculator result:', { rawValue, formattedValue, range: range?.label });
    
    return {
      rawValue,
      formattedValue,
      range,
      success: true
    };
  } catch (error) {
    logger.error('❌ Calculator error:', error);
    return {
      rawValue: 0,
      formattedValue: '—',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
