import { describe, it, expect } from 'vitest';
import {
  evaluateConditions,
  filterVisibleQuestions,
  detectConditionCycles,
} from '../conditionEvaluator';

// ============================================================
// OPERATOR TESTS - equals
// ============================================================
describe('Operator: equals', () => {
  it('retorna true para string igual (case insensitive)', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'equals' as const, value: 'sim' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'Sim' })).toBe(true);
    expect(evaluateConditions(conditions, { q1: 'SIM' })).toBe(true);
    expect(evaluateConditions(conditions, { q1: 'sim' })).toBe(true);
  });

  it('retorna false para string diferente', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'equals' as const, value: 'sim' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'não' })).toBe(false);
  });

  it('funciona com array (múltipla escolha)', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'equals' as const, value: 'Opção B' }],
    };
    
    // Valor está no array
    expect(evaluateConditions(conditions, { q1: ['Opção A', 'Opção B'] })).toBe(true);
    // Valor não está no array
    expect(evaluateConditions(conditions, { q1: ['Opção A', 'Opção C'] })).toBe(false);
  });
});

// ============================================================
// OPERATOR TESTS - not_equals
// ============================================================
describe('Operator: not_equals', () => {
  it('retorna true para string diferente', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'not_equals' as const, value: 'sim' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'não' })).toBe(true);
  });

  it('retorna false para string igual', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'not_equals' as const, value: 'sim' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'sim' })).toBe(false);
  });

  it('funciona com array (múltipla escolha)', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'not_equals' as const, value: 'Opção B' }],
    };
    
    // Valor não está no array → true
    expect(evaluateConditions(conditions, { q1: ['Opção A', 'Opção C'] })).toBe(true);
    // Valor está no array → false
    expect(evaluateConditions(conditions, { q1: ['Opção A', 'Opção B'] })).toBe(false);
  });
});

// ============================================================
// OPERATOR TESTS - contains
// ============================================================
describe('Operator: contains', () => {
  it('retorna true quando string contém valor', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'contains' as const, value: 'mundo' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'Olá mundo!' })).toBe(true);
  });

  it('retorna false quando string não contém valor', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'contains' as const, value: 'xyz' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'Olá mundo!' })).toBe(false);
  });

  it('funciona com array (verifica se algum item contém)', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'contains' as const, value: 'premium' }],
    };
    
    expect(evaluateConditions(conditions, { q1: ['Plano básico', 'Plano premium'] })).toBe(true);
    expect(evaluateConditions(conditions, { q1: ['Plano básico', 'Plano free'] })).toBe(false);
  });

  it('é case insensitive', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'contains' as const, value: 'PREMIUM' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'plano premium' })).toBe(true);
  });
});

// ============================================================
// OPERATOR TESTS - greater_than
// ============================================================
describe('Operator: greater_than', () => {
  it('retorna true quando número é maior', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'greater_than' as const, value: '50' }],
    };
    
    expect(evaluateConditions(conditions, { q1: '75' })).toBe(true);
  });

  it('retorna false quando número é menor ou igual', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'greater_than' as const, value: '50' }],
    };
    
    expect(evaluateConditions(conditions, { q1: '50' })).toBe(false);
    expect(evaluateConditions(conditions, { q1: '25' })).toBe(false);
  });

  it('retorna false para valores não numéricos', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'greater_than' as const, value: '50' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'abc' })).toBe(false);
  });

  it('funciona com decimais', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'greater_than' as const, value: '3.14' }],
    };
    
    expect(evaluateConditions(conditions, { q1: '3.15' })).toBe(true);
    expect(evaluateConditions(conditions, { q1: '3.13' })).toBe(false);
  });
});

// ============================================================
// OPERATOR TESTS - less_than
// ============================================================
describe('Operator: less_than', () => {
  it('retorna true quando número é menor', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'less_than' as const, value: '50' }],
    };
    
    expect(evaluateConditions(conditions, { q1: '25' })).toBe(true);
  });

  it('retorna false quando número é maior ou igual', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'less_than' as const, value: '50' }],
    };
    
    expect(evaluateConditions(conditions, { q1: '50' })).toBe(false);
    expect(evaluateConditions(conditions, { q1: '75' })).toBe(false);
  });

  it('retorna false para valores não numéricos', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'less_than' as const, value: '50' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'abc' })).toBe(false);
  });
});

// ============================================================
// LOGIC: AND
// ============================================================
describe('Logic: AND', () => {
  it('retorna true quando todas as regras são verdadeiras', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [
        { questionId: 'q1', operator: 'equals' as const, value: 'sim' },
        { questionId: 'q2', operator: 'equals' as const, value: 'sim' },
      ],
    };
    
    expect(evaluateConditions(conditions, { q1: 'sim', q2: 'sim' })).toBe(true);
  });

  it('retorna false quando pelo menos uma regra é falsa', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [
        { questionId: 'q1', operator: 'equals' as const, value: 'sim' },
        { questionId: 'q2', operator: 'equals' as const, value: 'sim' },
      ],
    };
    
    expect(evaluateConditions(conditions, { q1: 'sim', q2: 'não' })).toBe(false);
    expect(evaluateConditions(conditions, { q1: 'não', q2: 'sim' })).toBe(false);
    expect(evaluateConditions(conditions, { q1: 'não', q2: 'não' })).toBe(false);
  });
});

// ============================================================
// LOGIC: OR
// ============================================================
describe('Logic: OR', () => {
  it('retorna true quando pelo menos uma regra é verdadeira', () => {
    const conditions = {
      logic: 'OR' as const,
      rules: [
        { questionId: 'q1', operator: 'equals' as const, value: 'sim' },
        { questionId: 'q2', operator: 'equals' as const, value: 'sim' },
      ],
    };
    
    expect(evaluateConditions(conditions, { q1: 'sim', q2: 'não' })).toBe(true);
    expect(evaluateConditions(conditions, { q1: 'não', q2: 'sim' })).toBe(true);
    expect(evaluateConditions(conditions, { q1: 'sim', q2: 'sim' })).toBe(true);
  });

  it('retorna false quando todas as regras são falsas', () => {
    const conditions = {
      logic: 'OR' as const,
      rules: [
        { questionId: 'q1', operator: 'equals' as const, value: 'sim' },
        { questionId: 'q2', operator: 'equals' as const, value: 'sim' },
      ],
    };
    
    expect(evaluateConditions(conditions, { q1: 'não', q2: 'não' })).toBe(false);
  });
});

// ============================================================
// EDGE CASES
// ============================================================
describe('Edge cases', () => {
  it('retorna true quando não há condições', () => {
    expect(evaluateConditions(null, {})).toBe(true);
    expect(evaluateConditions(undefined, {})).toBe(true);
  });

  it('retorna true quando rules é array vazio', () => {
    const conditions = { logic: 'AND' as const, rules: [] };
    expect(evaluateConditions(conditions, {})).toBe(true);
  });

  it('retorna false quando resposta referenciada não existe', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'equals' as const, value: 'sim' }],
    };
    
    expect(evaluateConditions(conditions, {})).toBe(false);
    expect(evaluateConditions(conditions, { q2: 'sim' })).toBe(false);
  });

  it('retorna false para operador desconhecido', () => {
    const conditions = {
      logic: 'AND' as const,
      rules: [{ questionId: 'q1', operator: 'unknown_op' as any, value: 'sim' }],
    };
    
    expect(evaluateConditions(conditions, { q1: 'sim' })).toBe(false);
  });
});

// ============================================================
// filterVisibleQuestions
// ============================================================
describe('filterVisibleQuestions', () => {
  it('filtra perguntas baseado nas condições', () => {
    const questions = [
      { id: 'q1', conditions: null },
      { id: 'q2', conditions: { logic: 'AND' as const, rules: [{ questionId: 'q1', operator: 'equals' as const, value: 'sim' }] } },
      { id: 'q3', conditions: { logic: 'AND' as const, rules: [{ questionId: 'q1', operator: 'equals' as const, value: 'não' }] } },
    ];
    
    const answers = { q1: 'sim' };
    const visible = filterVisibleQuestions(questions, answers);
    
    expect(visible.map(q => q.id)).toEqual(['q1', 'q2']);
  });

  it('mostra todas as perguntas quando não há condições', () => {
    const questions = [
      { id: 'q1', conditions: null },
      { id: 'q2', conditions: undefined },
      { id: 'q3' },
    ];
    
    const visible = filterVisibleQuestions(questions as any, {});
    expect(visible.length).toBe(3);
  });

  it('retorna array vazio quando todas as perguntas são filtradas', () => {
    const questions = [
      { id: 'q1', conditions: { logic: 'AND' as const, rules: [{ questionId: 'q0', operator: 'equals' as const, value: 'impossivel' }] } },
    ];
    
    const visible = filterVisibleQuestions(questions, {});
    expect(visible.length).toBe(0);
  });
});

// ============================================================
// detectConditionCycles
// ============================================================
describe('detectConditionCycles', () => {
  it('detecta ciclo simples (A → B → A)', () => {
    const questions = [
      { id: 'q1', conditions: { rules: [{ questionId: 'q2', operator: 'equals', value: 'x' }] } },
      { id: 'q2', conditions: { rules: [{ questionId: 'q1', operator: 'equals', value: 'x' }] } },
    ];
    
    const cycles = detectConditionCycles(questions as any);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('detecta ciclo indireto (A → B → C → A)', () => {
    const questions = [
      { id: 'q1', conditions: { rules: [{ questionId: 'q3', operator: 'equals', value: 'x' }] } },
      { id: 'q2', conditions: { rules: [{ questionId: 'q1', operator: 'equals', value: 'x' }] } },
      { id: 'q3', conditions: { rules: [{ questionId: 'q2', operator: 'equals', value: 'x' }] } },
    ];
    
    const cycles = detectConditionCycles(questions as any);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('não detecta ciclo quando não há', () => {
    const questions = [
      { id: 'q1', conditions: null },
      { id: 'q2', conditions: { rules: [{ questionId: 'q1', operator: 'equals', value: 'x' }] } },
      { id: 'q3', conditions: { rules: [{ questionId: 'q2', operator: 'equals', value: 'x' }] } },
    ];
    
    const cycles = detectConditionCycles(questions as any);
    expect(cycles.length).toBe(0);
  });

  it('não detecta ciclo quando perguntas são independentes', () => {
    const questions = [
      { id: 'q1', conditions: null },
      { id: 'q2', conditions: null },
      { id: 'q3', conditions: null },
    ];
    
    const cycles = detectConditionCycles(questions as any);
    expect(cycles.length).toBe(0);
  });

  it('funciona com array vazio', () => {
    const cycles = detectConditionCycles([]);
    expect(cycles.length).toBe(0);
  });

  it('detecta auto-referência', () => {
    const questions = [
      { id: 'q1', conditions: { rules: [{ questionId: 'q1', operator: 'equals', value: 'x' }] } },
    ];
    
    const cycles = detectConditionCycles(questions as any);
    expect(cycles).toContain('q1');
  });
});
