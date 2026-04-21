import { describe, it, expect } from 'vitest';
import {
  calculateUIScore,
  calculateSecurityScore,
  calculatePerformanceScore,
  calculateDatabaseScore,
  getStatusFromScore,
} from '@/lib/healthScoreCalculator';

describe('healthScoreCalculator — getStatusFromScore', () => {
  it('classifica >=85 como healthy', () => {
    expect(getStatusFromScore(85)).toBe('healthy');
    expect(getStatusFromScore(100)).toBe('healthy');
  });
  it('classifica 60-84 como warning', () => {
    expect(getStatusFromScore(60)).toBe('warning');
    expect(getStatusFromScore(84)).toBe('warning');
  });
  it('classifica <60 como critical', () => {
    expect(getStatusFromScore(59)).toBe('critical');
    expect(getStatusFromScore(0)).toBe('critical');
  });
});

describe('healthScoreCalculator — UI', () => {
  it('LCP/CLS/FID/FCP perfeitos = score 100 healthy', () => {
    const r = calculateUIScore({ lcp: 1000, cls: 0.05, fid: 50, fcp: 1000 });
    expect(r.score).toBe(100);
    expect(r.status).toBe('healthy');
    expect(r.breakdown).toHaveLength(4);
  });

  it('LCP/CLS/FID/FCP ruins = score 0 critical', () => {
    const r = calculateUIScore({ lcp: 5000, cls: 0.5, fid: 500, fcp: 4000 });
    expect(r.score).toBe(0);
    expect(r.status).toBe('critical');
  });

  it('métricas ausentes recebem 15 pts default cada (score 60 warning)', () => {
    const r = calculateUIScore({});
    expect(r.score).toBe(60);
    expect(r.status).toBe('warning');
  });
});

describe('healthScoreCalculator — Security', () => {
  it('tudo ativo e zero violações = 100', () => {
    const r = calculateSecurityScore({
      rlsEnabled: true,
      cspViolations: 0,
      rateLimitFunctional: true,
      failedLogins: 0,
      strongPasswordsEnabled: true,
    });
    expect(r.score).toBe(100);
  });

  it('RLS desligado zera 30 pontos', () => {
    const r = calculateSecurityScore({
      rlsEnabled: false,
      cspViolations: 0,
      rateLimitFunctional: true,
      failedLogins: 0,
      strongPasswordsEnabled: true,
    });
    expect(r.score).toBe(70);
  });
});

describe('healthScoreCalculator — Performance', () => {
  it('queries lentas + bundle grande reduzem score', () => {
    const r = calculatePerformanceScore({
      avgQueryTime: 1500, // > 1000 = 0pts
      bundleSize: 1000, // > 900 = 0pts
      hasMemoryLeaks: false,
      indexesOptimized: true,
    });
    // 0 + 0 + 25 + 20 = 45
    expect(r.score).toBe(45);
    expect(r.status).toBe('critical');
  });
});

describe('healthScoreCalculator — Database', () => {
  it('latência alta + erros recentes derrubam score', () => {
    const r = calculateDatabaseScore({
      latency: 200, // > 100 = 0pts
      errorsLast15min: 10, // > 5 = 0pts
      connectionHealthy: true,
      storageAvailable: 80,
    });
    // 0 + 0 + 20 + 20 = 40
    expect(r.score).toBe(40);
    expect(r.status).toBe('critical');
  });
});