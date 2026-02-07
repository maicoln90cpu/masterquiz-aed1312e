import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAnswerScore,
  substituteVariables,
  evaluateFormula,
  formatResult,
  findRange,
  calculateQuizResult,
} from '../calculatorEngine';

// Mock console.log para evitar poluição no output dos testes
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// getAnswerScore - EXTRAÇÃO DE SCORES
// ============================================================
describe('getAnswerScore', () => {
  const mockQuestions = [
    {
      id: 'q1',
      blocks: [
        {
          type: 'question',
          options: ['Opção A', 'Opção B', 'Opção C'],
          scores: [10, 20, 30],
        },
      ],
    },
    {
      id: 'q2',
      blocks: [
        {
          type: 'question',
          options: ['Sim', 'Não'],
          scores: [100, 0],
        },
      ],
    },
  ];

  describe('Escolha única', () => {
    it('retorna score correto para opção selecionada', () => {
      const score = getAnswerScore('q1', 'Opção B', mockQuestions);
      expect(score).toBe(20);
    });

    it('retorna 0 para opção não encontrada', () => {
      const score = getAnswerScore('q1', 'Opção X', mockQuestions);
      expect(score).toBe(0);
    });

    it('retorna 0 para pergunta não encontrada', () => {
      const score = getAnswerScore('q999', 'Opção A', mockQuestions);
      expect(score).toBe(0);
    });

    it('retorna 0 para resposta undefined', () => {
      const score = getAnswerScore('q1', undefined, mockQuestions);
      expect(score).toBe(0);
    });
  });

  describe('Múltipla escolha', () => {
    it('soma scores de múltiplas opções', () => {
      const score = getAnswerScore('q1', ['Opção A', 'Opção C'], mockQuestions);
      expect(score).toBe(40); // 10 + 30
    });

    it('ignora opções não encontradas', () => {
      const score = getAnswerScore('q1', ['Opção A', 'Opção X'], mockQuestions);
      expect(score).toBe(10); // Apenas Opção A
    });

    it('retorna 0 para array vazio', () => {
      const score = getAnswerScore('q1', [], mockQuestions);
      expect(score).toBe(0);
    });
  });

  describe('Resposta numérica (short_text)', () => {
    it('converte texto numérico para número', () => {
      const questionsWithoutScores = [
        { id: 'q3', blocks: [{ type: 'question', options: [], scores: [] }] },
      ];
      const score = getAnswerScore('q3', '42.5', questionsWithoutScores);
      expect(score).toBe(42.5);
    });

    it('retorna 0 para texto não numérico', () => {
      const questionsWithoutScores = [
        { id: 'q3', blocks: [{ type: 'question', options: [], scores: [] }] },
      ];
      const score = getAnswerScore('q3', 'texto', questionsWithoutScores);
      expect(score).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('retorna 0 quando pergunta não tem blocks', () => {
      const questions = [{ id: 'q1' }];
      const score = getAnswerScore('q1', 'Qualquer', questions as any);
      expect(score).toBe(0);
    });

    it('retorna 0 quando não há bloco question', () => {
      const questions = [{ id: 'q1', blocks: [{ type: 'text' }] }];
      const score = getAnswerScore('q1', 'Qualquer', questions as any);
      expect(score).toBe(0);
    });
  });
});

// ============================================================
// substituteVariables - SUBSTITUIÇÃO DE VARIÁVEIS
// ============================================================
describe('substituteVariables', () => {
  const mockQuestions = [
    {
      id: 'q1',
      blocks: [{ type: 'question', options: ['A', 'B'], scores: [10, 20] }],
    },
    {
      id: 'q2',
      blocks: [{ type: 'question', options: ['X', 'Y'], scores: [5, 15] }],
    },
  ];

  it('substitui variáveis simples', () => {
    const formula = '{peso} + {altura}';
    const mapping = { peso: 'q1', altura: 'q2' };
    const answers = { q1: 'B', q2: 'Y' };
    
    const result = substituteVariables(formula, mapping, answers, mockQuestions);
    expect(result).toBe('20 + 15');
  });

  it('substitui múltiplas ocorrências da mesma variável', () => {
    const formula = '{x} + {x} * 2';
    const mapping = { x: 'q1' };
    const answers = { q1: 'A' };
    
    const result = substituteVariables(formula, mapping, answers, mockQuestions);
    expect(result).toBe('10 + 10 * 2');
  });

  it('mantém fórmula intacta quando variável não existe', () => {
    const formula = '{inexistente} + 5';
    const mapping = {};
    const answers = {};
    
    const result = substituteVariables(formula, mapping, answers, mockQuestions);
    expect(result).toBe('{inexistente} + 5');
  });

  it('funciona com fórmulas complexas', () => {
    const formula = '({a} + {b}) / 2 * {c}';
    const mapping = { a: 'q1', b: 'q2', c: 'q1' };
    const answers = { q1: 'B', q2: 'X' };
    
    const result = substituteVariables(formula, mapping, answers, mockQuestions);
    expect(result).toBe('(20 + 5) / 2 * 20');
  });
});

// ============================================================
// evaluateFormula - AVALIAÇÃO SEGURA
// ============================================================
describe('evaluateFormula', () => {
  describe('Operações básicas', () => {
    it('avalia adição', () => {
      expect(evaluateFormula('10 + 5')).toBe(15);
    });

    it('avalia subtração', () => {
      expect(evaluateFormula('20 - 8')).toBe(12);
    });

    it('avalia multiplicação', () => {
      expect(evaluateFormula('6 * 7')).toBe(42);
    });

    it('avalia divisão', () => {
      expect(evaluateFormula('100 / 4')).toBe(25);
    });

    it('avalia parênteses', () => {
      expect(evaluateFormula('(10 + 5) * 2')).toBe(30);
    });

    it('avalia decimais', () => {
      expect(evaluateFormula('10.5 + 2.3')).toBeCloseTo(12.8);
    });

    it('avalia expressões complexas', () => {
      expect(evaluateFormula('((10 + 5) * 2) / 3 + 1')).toBe(11);
    });
  });

  describe('Segurança', () => {
    it('rejeita caracteres não permitidos', () => {
      expect(() => evaluateFormula('10 + alert(1)')).toThrow('caracteres inválidos');
    });

    it('rejeita variáveis JavaScript', () => {
      expect(() => evaluateFormula('document.cookie')).toThrow('caracteres inválidos');
    });

    it('rejeita funções', () => {
      expect(() => evaluateFormula('Math.pow(2,3)')).toThrow('caracteres inválidos');
    });

    it('rejeita strings', () => {
      expect(() => evaluateFormula('"test"')).toThrow('caracteres inválidos');
    });

    it('rejeita template literals', () => {
      expect(() => evaluateFormula('`test`')).toThrow('caracteres inválidos');
    });

    it('rejeita operadores de atribuição', () => {
      expect(() => evaluateFormula('x = 10')).toThrow('caracteres inválidos');
    });

    it('rejeita comparações', () => {
      expect(() => evaluateFormula('10 > 5')).toThrow('caracteres inválidos');
    });
  });

  describe('Edge cases', () => {
    it('lida com espaços extras', () => {
      expect(evaluateFormula('  10   +   5  ')).toBe(15);
    });

    it('lida com números negativos', () => {
      expect(evaluateFormula('10 + -5')).toBe(5);
    });

    it('lida com número zero', () => {
      expect(evaluateFormula('0 + 0')).toBe(0);
    });

    it('lida com números grandes', () => {
      expect(evaluateFormula('1000000 * 1000')).toBe(1000000000);
    });

    it('rejeita divisão que resulta em Infinity', () => {
      expect(() => evaluateFormula('1 / 0')).toThrow('Resultado inválido');
    });
  });
});

// ============================================================
// formatResult - FORMATAÇÃO DE RESULTADOS
// ============================================================
describe('formatResult', () => {
  describe('Formato numérico padrão', () => {
    it('formata número simples', () => {
      const result = formatResult(1234.5678, 'number', 2);
      expect(result).toBe('1.234,57');
    });

    it('respeita casas decimais', () => {
      const result = formatResult(100, 'number', 0);
      expect(result).toBe('100');
    });

    it('formata com 4 casas decimais', () => {
      const result = formatResult(3.14159, 'number', 4);
      expect(result).toBe('3,1416');
    });
  });

  describe('Formato moeda (currency)', () => {
    it('formata como Real brasileiro', () => {
      const result = formatResult(1500.99, 'currency', 2);
      expect(result).toBe('R$ 1.500,99');
    });

    it('sempre usa 2 casas decimais', () => {
      const result = formatResult(100, 'currency', 0);
      expect(result).toBe('R$ 100,00');
    });
  });

  describe('Formato porcentagem (percentage)', () => {
    it('formata com símbolo %', () => {
      const result = formatResult(75.5, 'percentage', 1);
      expect(result).toBe('75,5%');
    });

    it('formata inteiro', () => {
      const result = formatResult(100, 'percentage', 0);
      expect(result).toBe('100%');
    });
  });

  describe('Formato customizado', () => {
    it('adiciona unidade personalizada', () => {
      const result = formatResult(42, 'custom', 0, 'pontos');
      expect(result).toBe('42 pontos');
    });

    it('funciona sem unidade', () => {
      const result = formatResult(42, 'custom', 0);
      expect(result).toBe('42');
    });

    it('funciona com unidade vazia', () => {
      const result = formatResult(42, 'custom', 0, '');
      expect(result).toBe('42');
    });
  });
});

// ============================================================
// findRange - BUSCA DE FAIXAS
// ============================================================
describe('findRange', () => {
  const ranges = [
    { min: 0, max: 30, label: 'Baixo', description: 'Pontuação baixa' },
    { min: 31, max: 70, label: 'Médio', description: 'Pontuação média' },
    { min: 71, max: 100, label: 'Alto', description: 'Pontuação alta' },
  ];

  it('encontra faixa para valor no início', () => {
    const range = findRange(0, ranges);
    expect(range?.label).toBe('Baixo');
  });

  it('encontra faixa para valor no meio', () => {
    const range = findRange(50, ranges);
    expect(range?.label).toBe('Médio');
  });

  it('encontra faixa para valor no final', () => {
    const range = findRange(100, ranges);
    expect(range?.label).toBe('Alto');
  });

  it('encontra faixa para valor exato no limite', () => {
    const range = findRange(30, ranges);
    expect(range?.label).toBe('Baixo');
  });

  it('retorna undefined para valor fora das faixas', () => {
    const range = findRange(150, ranges);
    expect(range).toBeUndefined();
  });

  it('retorna undefined para valor negativo', () => {
    const range = findRange(-10, ranges);
    expect(range).toBeUndefined();
  });

  it('retorna undefined para array vazio', () => {
    const range = findRange(50, []);
    expect(range).toBeUndefined();
  });
});

// ============================================================
// calculateQuizResult - FUNÇÃO PRINCIPAL
// ============================================================
describe('calculateQuizResult', () => {
  const mockQuestions = [
    {
      id: 'q1',
      blocks: [{ type: 'question', options: ['A', 'B'], scores: [10, 20] }],
    },
    {
      id: 'q2',
      blocks: [{ type: 'question', options: ['X', 'Y'], scores: [5, 15] }],
    },
  ];

  it('calcula resultado simples', () => {
    const result = calculateQuizResult(
      '{a} + {b}',
      { a: 'q1', b: 'q2' },
      { q1: 'B', q2: 'Y' },
      mockQuestions
    );
    
    expect(result.success).toBe(true);
    expect(result.rawValue).toBe(35); // 20 + 15
    expect(result.formattedValue).toBe('35');
  });

  it('aplica formato de moeda', () => {
    const result = calculateQuizResult(
      '{a} * 100',
      { a: 'q1' },
      { q1: 'B' },
      mockQuestions,
      'currency'
    );
    
    expect(result.success).toBe(true);
    expect(result.formattedValue).toBe('R$ 2.000,00');
  });

  it('aplica formato de porcentagem', () => {
    const result = calculateQuizResult(
      '{a}',
      { a: 'q1' },
      { q1: 'B' },
      mockQuestions,
      'percentage'
    );
    
    expect(result.success).toBe(true);
    expect(result.formattedValue).toBe('20,00%');
  });

  it('encontra faixa correspondente', () => {
    const ranges = [
      { min: 0, max: 25, label: 'Baixo', description: 'Desc1' },
      { min: 26, max: 50, label: 'Alto', description: 'Desc2' },
    ];
    
    const result = calculateQuizResult(
      '{a} + {b}',
      { a: 'q1', b: 'q2' },
      { q1: 'B', q2: 'Y' },
      mockQuestions,
      'number',
      2,
      undefined,
      ranges
    );
    
    expect(result.range?.label).toBe('Alto');
  });

  it('retorna erro para fórmula inválida', () => {
    const result = calculateQuizResult(
      '{a} + abc',
      { a: 'q1' },
      { q1: 'A' },
      mockQuestions
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.rawValue).toBe(0);
    expect(result.formattedValue).toBe('—');
  });

  it('retorna erro para divisão por zero', () => {
    const questionsWithZero = [
      { id: 'q1', blocks: [{ type: 'question', options: ['A'], scores: [0] }] },
    ];
    
    const result = calculateQuizResult(
      '100 / {a}',
      { a: 'q1' },
      { q1: 'A' },
      questionsWithZero
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
