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
      const score = getAnswerScore('q1', 'Opção Inexistente', mockQuestions);
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
      const score = getAnswerScore('q1', ['Opção A', 'Inexistente'], mockQuestions);
      expect(score).toBe(10);
    });

    it('retorna 0 para array vazio', () => {
      const score = getAnswerScore('q1', [], mockQuestions);
      expect(score).toBe(0);
    });
  });

  describe('Texto numérico', () => {
    it('converte texto numérico para número', () => {
      const score = getAnswerScore('q1', '42', mockQuestions);
      expect(score).toBe(42);
    });

    it('retorna 0 para texto não numérico', () => {
      const score = getAnswerScore('q1', 'abc', mockQuestions);
      expect(score).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('retorna 0 quando pergunta não tem blocks', () => {
      const questions = [{ id: 'q1' }];
      const score = getAnswerScore('q1', 'A', questions as any);
      expect(score).toBe(0);
    });

    it('retorna 0 quando não há bloco question', () => {
      const questions = [{ id: 'q1', blocks: [{ type: 'text' }] }];
      const score = getAnswerScore('q1', 'A', questions as any);
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
    const result = substituteVariables(
      '{a} + {b}',
      { a: 'q1', b: 'q2' },
      { q1: 'A', q2: 'Y' },
      mockQuestions
    );
    expect(result).toBe('10 + 15');
  });

  it('substitui múltiplas ocorrências da mesma variável', () => {
    const result = substituteVariables(
      '{a} + {a}',
      { a: 'q1' },
      { q1: 'B' },
      mockQuestions
    );
    expect(result).toBe('20 + 20');
  });

  it('mantém fórmula intacta quando variável não existe', () => {
    const result = substituteVariables(
      '{a} + {c}',
      { a: 'q1' },
      { q1: 'A' },
      mockQuestions
    );
    expect(result).toBe('10 + {c}');
  });

  it('funciona com fórmulas complexas', () => {
    const result = substituteVariables(
      '({a} * 2) + ({b} / 3)',
      { a: 'q1', b: 'q2' },
      { q1: 'B', q2: 'X' },
      mockQuestions
    );
    expect(result).toBe('(20 * 2) + (5 / 3)');
  });
});

// ============================================================
// evaluateFormula - AVALIAÇÃO SEGURA
// ============================================================
describe('evaluateFormula', () => {
  describe('Operações básicas', () => {
    it('avalia adição', () => {
      expect(evaluateFormula('10 + 20')).toBe(30);
    });

    it('avalia subtração', () => {
      expect(evaluateFormula('50 - 15')).toBe(35);
    });

    it('avalia multiplicação', () => {
      expect(evaluateFormula('6 * 7')).toBe(42);
    });

    it('avalia divisão', () => {
      expect(evaluateFormula('100 / 4')).toBe(25);
    });

    it('avalia parênteses', () => {
      expect(evaluateFormula('(10 + 20) * 2')).toBe(60);
    });

    it('avalia decimais', () => {
      expect(evaluateFormula('10.5 + 0.5')).toBe(11);
    });

    it('avalia expressões complexas', () => {
      expect(evaluateFormula('(10 + 20) * 2 / 3')).toBe(20);
    });
  });

  describe('Segurança', () => {
    it('rejeita caracteres não permitidos', () => {
      expect(() => evaluateFormula('10 + alert(1)')).toThrow();
    });

    it('rejeita variáveis JavaScript', () => {
      expect(() => evaluateFormula('window.location')).toThrow();
    });

    it('rejeita funções', () => {
      expect(() => evaluateFormula('Math.random()')).toThrow();
    });

    it('rejeita strings', () => {
      expect(() => evaluateFormula('"hello"')).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('avalia zero', () => {
      expect(evaluateFormula('0')).toBe(0);
    });

    it('avalia número negativo', () => {
      expect(evaluateFormula('-5 + 10')).toBe(5);
    });

    it('rejeita divisão que resulta em Infinity', () => {
      expect(() => evaluateFormula('1 / 0')).toThrow('Erro ao calcular fórmula');
    });

    it('rejeita NaN', () => {
      expect(() => evaluateFormula('0 / 0')).toThrow();
    });
  });
});

// ============================================================
// formatResult - FORMATAÇÃO
// ============================================================
describe('formatResult', () => {
  it('formata número simples', () => {
    const result = formatResult(42, 'number', 0);
    expect(result).toBe('42');
  });

  it('formata com casas decimais', () => {
    const result = formatResult(42.567, 'number', 2);
    expect(result).toBe('42,57');
  });

  it('formata como moeda', () => {
    const result = formatResult(1500, 'currency', 2);
    expect(result).toBe('R$ 1.500,00');
  });

  it('formata como porcentagem', () => {
    const result = formatResult(75.5, 'percentage', 1);
    expect(result).toBe('75,5%');
  });

  it('formata com unidade customizada', () => {
    const result = formatResult(100, 'custom', 0, 'kg');
    expect(result).toBe('100 kg');
  });

  it('formata sem unidade customizada', () => {
    const result = formatResult(100, 'custom', 0);
    expect(result).toBe('100');
  });

  it('formata zero', () => {
    const result = formatResult(0, 'number', 0);
    expect(result).toBe('0');
  });

  it('formata número grande', () => {
    const result = formatResult(1000000, 'currency', 2);
    expect(result).toBe('R$ 1.000.000,00');
  });
});

// ============================================================
// findRange - FAIXAS
// ============================================================
describe('findRange', () => {
  const ranges = [
    { min: 0, max: 25, label: 'Baixo', description: 'Pontuação baixa' },
    { min: 26, max: 50, label: 'Médio', description: 'Pontuação média' },
    { min: 51, max: 100, label: 'Alto', description: 'Pontuação alta' },
  ];

  it('encontra faixa correta para valor baixo', () => {
    const range = findRange(10, ranges);
    expect(range?.label).toBe('Baixo');
  });

  it('encontra faixa correta para valor médio', () => {
    const range = findRange(35, ranges);
    expect(range?.label).toBe('Médio');
  });

  it('encontra faixa correta para valor alto', () => {
    const range = findRange(75, ranges);
    expect(range?.label).toBe('Alto');
  });

  it('encontra faixa para valor no limite inferior', () => {
    const range = findRange(0, ranges);
    expect(range?.label).toBe('Baixo');
  });

  it('encontra faixa para valor no limite superior', () => {
    const range = findRange(100, ranges);
    expect(range?.label).toBe('Alto');
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
    expect(result.formattedValue).toBe('35,00');
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
