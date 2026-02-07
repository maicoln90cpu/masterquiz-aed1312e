/**
 * Health Score Calculator
 * Implementa o algoritmo de pontuação detalhado para cada módulo do sistema
 */

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface ModuleScore {
  score: number;
  status: HealthStatus;
  breakdown: ScoreBreakdown[];
}

export interface ScoreBreakdown {
  criterion: string;
  maxPoints: number;
  earnedPoints: number;
  value: number | string | boolean;
  threshold: string;
}

// ============================================
// THRESHOLDS CONFIGURATION
// ============================================

export const THRESHOLDS = {
  ui: {
    lcp: { good: 2500, warning: 4000 }, // ms
    cls: { good: 0.1, warning: 0.25 },
    fid: { good: 100, warning: 300 }, // ms
    fcp: { good: 1800, warning: 3000 }, // ms
  },
  performance: {
    queryTime: { good: 500, warning: 1000 }, // ms
    bundleSize: { good: 700, warning: 900 }, // KB
    memoryUsage: { good: 300, warning: 500 }, // MB
  },
  database: {
    latency: { good: 50, warning: 100 }, // ms
    errorWindow: 15, // minutes
  },
  security: {
    cspViolations: { good: 0, warning: 5 },
    rateLimitHits: { good: 50, warning: 100 },
    failedLogins: { good: 20, warning: 50 },
  },
} as const;

// ============================================
// STATUS CLASSIFICATION
// ============================================

export function getStatusFromScore(score: number): HealthStatus {
  if (score >= 85) return 'healthy';
  if (score >= 60) return 'warning';
  return 'critical';
}

export function getStatusEmoji(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return '🟢';
    case 'warning': return '🟡';
    case 'critical': return '🔴';
  }
}

export function getStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'Saudável';
    case 'warning': return 'Atenção';
    case 'critical': return 'Crítico';
  }
}

// ============================================
// UI MODULE SCORING (100 points)
// ============================================

export interface UIMetrics {
  lcp?: number; // Largest Contentful Paint (ms)
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay (ms)
  fcp?: number; // First Contentful Paint (ms)
}

export function calculateUIScore(metrics: UIMetrics): ModuleScore {
  const breakdown: ScoreBreakdown[] = [];
  let totalPoints = 0;
  const maxPoints = 100;

  // LCP (25 points)
  if (metrics.lcp !== undefined) {
    let points = 0;
    let threshold = '';
    if (metrics.lcp < THRESHOLDS.ui.lcp.good) {
      points = 25;
      threshold = '< 2.5s (Bom)';
    } else if (metrics.lcp < THRESHOLDS.ui.lcp.warning) {
      points = 15;
      threshold = '2.5-4s (Moderado)';
    } else {
      points = 0;
      threshold = '> 4s (Ruim)';
    }
    totalPoints += points;
    breakdown.push({
      criterion: 'LCP (Largest Contentful Paint)',
      maxPoints: 25,
      earnedPoints: points,
      value: `${(metrics.lcp / 1000).toFixed(2)}s`,
      threshold
    });
  } else {
    breakdown.push({
      criterion: 'LCP (Largest Contentful Paint)',
      maxPoints: 25,
      earnedPoints: 15, // Default to warning level
      value: 'Não medido',
      threshold: 'Sem dados'
    });
    totalPoints += 15;
  }

  // CLS (25 points)
  if (metrics.cls !== undefined) {
    let points = 0;
    let threshold = '';
    if (metrics.cls < THRESHOLDS.ui.cls.good) {
      points = 25;
      threshold = '< 0.1 (Bom)';
    } else if (metrics.cls < THRESHOLDS.ui.cls.warning) {
      points = 15;
      threshold = '0.1-0.25 (Moderado)';
    } else {
      points = 0;
      threshold = '> 0.25 (Ruim)';
    }
    totalPoints += points;
    breakdown.push({
      criterion: 'CLS (Cumulative Layout Shift)',
      maxPoints: 25,
      earnedPoints: points,
      value: metrics.cls.toFixed(3),
      threshold
    });
  } else {
    breakdown.push({
      criterion: 'CLS (Cumulative Layout Shift)',
      maxPoints: 25,
      earnedPoints: 15,
      value: 'Não medido',
      threshold: 'Sem dados'
    });
    totalPoints += 15;
  }

  // FID (25 points)
  if (metrics.fid !== undefined) {
    let points = 0;
    let threshold = '';
    if (metrics.fid < THRESHOLDS.ui.fid.good) {
      points = 25;
      threshold = '< 100ms (Bom)';
    } else if (metrics.fid < THRESHOLDS.ui.fid.warning) {
      points = 15;
      threshold = '100-300ms (Moderado)';
    } else {
      points = 0;
      threshold = '> 300ms (Ruim)';
    }
    totalPoints += points;
    breakdown.push({
      criterion: 'FID (First Input Delay)',
      maxPoints: 25,
      earnedPoints: points,
      value: `${metrics.fid}ms`,
      threshold
    });
  } else {
    breakdown.push({
      criterion: 'FID (First Input Delay)',
      maxPoints: 25,
      earnedPoints: 15,
      value: 'Não medido',
      threshold: 'Sem dados'
    });
    totalPoints += 15;
  }

  // FCP (25 points)
  if (metrics.fcp !== undefined) {
    let points = 0;
    let threshold = '';
    if (metrics.fcp < THRESHOLDS.ui.fcp.good) {
      points = 25;
      threshold = '< 1.8s (Bom)';
    } else if (metrics.fcp < THRESHOLDS.ui.fcp.warning) {
      points = 15;
      threshold = '1.8-3s (Moderado)';
    } else {
      points = 0;
      threshold = '> 3s (Ruim)';
    }
    totalPoints += points;
    breakdown.push({
      criterion: 'FCP (First Contentful Paint)',
      maxPoints: 25,
      earnedPoints: points,
      value: `${(metrics.fcp / 1000).toFixed(2)}s`,
      threshold
    });
  } else {
    breakdown.push({
      criterion: 'FCP (First Contentful Paint)',
      maxPoints: 25,
      earnedPoints: 15,
      value: 'Não medido',
      threshold: 'Sem dados'
    });
    totalPoints += 15;
  }

  const score = Math.round((totalPoints / maxPoints) * 100);
  
  return {
    score,
    status: getStatusFromScore(score),
    breakdown
  };
}

// ============================================
// SECURITY MODULE SCORING (100 points)
// ============================================

export interface SecurityMetrics {
  rlsEnabled?: boolean;
  cspViolations?: number;
  rateLimitFunctional?: boolean;
  rateLimitHits?: number;
  failedLogins?: number;
  strongPasswordsEnabled?: boolean;
}

export function calculateSecurityScore(metrics: SecurityMetrics): ModuleScore {
  const breakdown: ScoreBreakdown[] = [];
  let totalPoints = 0;

  // RLS ativo (30 points)
  const rlsPoints = metrics.rlsEnabled !== false ? 30 : 0;
  totalPoints += rlsPoints;
  breakdown.push({
    criterion: 'RLS ativo em todas tabelas',
    maxPoints: 30,
    earnedPoints: rlsPoints,
    value: metrics.rlsEnabled !== false,
    threshold: 'Deve estar ativo'
  });

  // CSP violations (20 points)
  let cspPoints = 20;
  let cspThreshold = '0 violações (Bom)';
  if (metrics.cspViolations !== undefined) {
    if (metrics.cspViolations > THRESHOLDS.security.cspViolations.warning) {
      cspPoints = 0;
      cspThreshold = '> 5 violações (Ruim)';
    } else if (metrics.cspViolations > THRESHOLDS.security.cspViolations.good) {
      cspPoints = 10;
      cspThreshold = '1-5 violações (Moderado)';
    }
  }
  totalPoints += cspPoints;
  breakdown.push({
    criterion: 'Sem violações CSP',
    maxPoints: 20,
    earnedPoints: cspPoints,
    value: metrics.cspViolations ?? 0,
    threshold: cspThreshold
  });

  // Rate limiting (20 points)
  let rlPoints = metrics.rateLimitFunctional !== false ? 20 : 0;
  if (metrics.rateLimitHits !== undefined && metrics.rateLimitHits > THRESHOLDS.security.rateLimitHits.warning) {
    rlPoints = Math.max(0, rlPoints - 10);
  }
  totalPoints += rlPoints;
  breakdown.push({
    criterion: 'Rate limiting funcionando',
    maxPoints: 20,
    earnedPoints: rlPoints,
    value: metrics.rateLimitFunctional !== false,
    threshold: 'Deve estar ativo'
  });

  // Failed logins (15 points)
  let loginPoints = 15;
  let loginThreshold = '< 20 tentativas (Bom)';
  if (metrics.failedLogins !== undefined) {
    if (metrics.failedLogins > THRESHOLDS.security.failedLogins.warning) {
      loginPoints = 0;
      loginThreshold = '> 50 tentativas (Ruim)';
    } else if (metrics.failedLogins > THRESHOLDS.security.failedLogins.good) {
      loginPoints = 8;
      loginThreshold = '20-50 tentativas (Moderado)';
    }
  }
  totalPoints += loginPoints;
  breakdown.push({
    criterion: 'Sem tentativas de login suspeitas',
    maxPoints: 15,
    earnedPoints: loginPoints,
    value: metrics.failedLogins ?? 0,
    threshold: loginThreshold
  });

  // Strong passwords (15 points)
  const pwdPoints = metrics.strongPasswordsEnabled !== false ? 15 : 0;
  totalPoints += pwdPoints;
  breakdown.push({
    criterion: 'Senhas fortes habilitadas',
    maxPoints: 15,
    earnedPoints: pwdPoints,
    value: metrics.strongPasswordsEnabled !== false,
    threshold: 'Deve estar ativo'
  });

  return {
    score: totalPoints,
    status: getStatusFromScore(totalPoints),
    breakdown
  };
}

// ============================================
// PERFORMANCE MODULE SCORING (100 points)
// ============================================

export interface PerformanceMetrics {
  avgQueryTime?: number; // ms
  bundleSize?: number; // KB
  memoryUsage?: number; // MB
  hasMemoryLeaks?: boolean;
  indexesOptimized?: boolean;
}

export function calculatePerformanceScore(metrics: PerformanceMetrics): ModuleScore {
  const breakdown: ScoreBreakdown[] = [];
  let totalPoints = 0;

  // Query time (30 points)
  let queryPoints = 30;
  let queryThreshold = '< 500ms (Bom)';
  if (metrics.avgQueryTime !== undefined) {
    if (metrics.avgQueryTime > THRESHOLDS.performance.queryTime.warning) {
      queryPoints = 0;
      queryThreshold = '> 1s (Ruim)';
    } else if (metrics.avgQueryTime > THRESHOLDS.performance.queryTime.good) {
      queryPoints = 15;
      queryThreshold = '500ms-1s (Moderado)';
    }
  }
  totalPoints += queryPoints;
  breakdown.push({
    criterion: 'Tempo médio de queries',
    maxPoints: 30,
    earnedPoints: queryPoints,
    value: metrics.avgQueryTime !== undefined ? `${metrics.avgQueryTime}ms` : 'Não medido',
    threshold: queryThreshold
  });

  // Bundle size (25 points)
  let bundlePoints = 25;
  let bundleThreshold = '< 700KB (Bom)';
  if (metrics.bundleSize !== undefined) {
    if (metrics.bundleSize > THRESHOLDS.performance.bundleSize.warning) {
      bundlePoints = 0;
      bundleThreshold = '> 900KB (Ruim)';
    } else if (metrics.bundleSize > THRESHOLDS.performance.bundleSize.good) {
      bundlePoints = 15;
      bundleThreshold = '700-900KB (Moderado)';
    }
  }
  totalPoints += bundlePoints;
  breakdown.push({
    criterion: 'Tamanho do bundle',
    maxPoints: 25,
    earnedPoints: bundlePoints,
    value: metrics.bundleSize !== undefined ? `${metrics.bundleSize}KB` : 'Não medido',
    threshold: bundleThreshold
  });

  // Memory leaks (25 points)
  const memoryPoints = metrics.hasMemoryLeaks === true ? 0 : 25;
  totalPoints += memoryPoints;
  breakdown.push({
    criterion: 'Sem memory leaks',
    maxPoints: 25,
    earnedPoints: memoryPoints,
    value: metrics.hasMemoryLeaks !== true,
    threshold: 'Sem vazamentos detectados'
  });

  // Indexes optimized (20 points)
  const indexPoints = metrics.indexesOptimized !== false ? 20 : 10;
  totalPoints += indexPoints;
  breakdown.push({
    criterion: 'Índices otimizados',
    maxPoints: 20,
    earnedPoints: indexPoints,
    value: metrics.indexesOptimized !== false,
    threshold: 'Índices configurados'
  });

  return {
    score: totalPoints,
    status: getStatusFromScore(totalPoints),
    breakdown
  };
}

// ============================================
// DATABASE MODULE SCORING (100 points)
// ============================================

export interface DatabaseMetrics {
  latency?: number; // ms
  errorsLast15min?: number;
  connectionHealthy?: boolean;
  storageAvailable?: number; // percentage
}

export function calculateDatabaseScore(metrics: DatabaseMetrics): ModuleScore {
  const breakdown: ScoreBreakdown[] = [];
  let totalPoints = 0;

  // Latency (30 points)
  let latencyPoints = 30;
  let latencyThreshold = '< 50ms (Bom)';
  if (metrics.latency !== undefined) {
    if (metrics.latency > THRESHOLDS.database.latency.warning) {
      latencyPoints = 0;
      latencyThreshold = '> 100ms (Ruim)';
    } else if (metrics.latency > THRESHOLDS.database.latency.good) {
      latencyPoints = 15;
      latencyThreshold = '50-100ms (Moderado)';
    }
  }
  totalPoints += latencyPoints;
  breakdown.push({
    criterion: 'Latência de conexão',
    maxPoints: 30,
    earnedPoints: latencyPoints,
    value: metrics.latency !== undefined ? `${metrics.latency}ms` : 'Não medido',
    threshold: latencyThreshold
  });

  // Errors (30 points)
  let errorPoints = 30;
  let errorThreshold = '0 erros (Bom)';
  if (metrics.errorsLast15min !== undefined && metrics.errorsLast15min > 0) {
    if (metrics.errorsLast15min > 5) {
      errorPoints = 0;
      errorThreshold = '> 5 erros (Ruim)';
    } else {
      errorPoints = 15;
      errorThreshold = '1-5 erros (Moderado)';
    }
  }
  totalPoints += errorPoints;
  breakdown.push({
    criterion: 'Sem erros (últimos 15min)',
    maxPoints: 30,
    earnedPoints: errorPoints,
    value: metrics.errorsLast15min ?? 0,
    threshold: errorThreshold
  });

  // Connection health (20 points)
  const connectionPoints = metrics.connectionHealthy !== false ? 20 : 0;
  totalPoints += connectionPoints;
  breakdown.push({
    criterion: 'Conexões saudáveis',
    maxPoints: 20,
    earnedPoints: connectionPoints,
    value: metrics.connectionHealthy !== false,
    threshold: 'Conexão ativa'
  });

  // Storage (20 points)
  let storagePoints = 20;
  let storageThreshold = '> 50% disponível (Bom)';
  if (metrics.storageAvailable !== undefined) {
    if (metrics.storageAvailable < 20) {
      storagePoints = 0;
      storageThreshold = '< 20% disponível (Crítico)';
    } else if (metrics.storageAvailable < 50) {
      storagePoints = 10;
      storageThreshold = '20-50% disponível (Moderado)';
    }
  }
  totalPoints += storagePoints;
  breakdown.push({
    criterion: 'Espaço disponível',
    maxPoints: 20,
    earnedPoints: storagePoints,
    value: metrics.storageAvailable !== undefined ? `${metrics.storageAvailable}%` : 'Não medido',
    threshold: storageThreshold
  });

  return {
    score: totalPoints,
    status: getStatusFromScore(totalPoints),
    breakdown
  };
}

// ============================================
// INTEGRATIONS MODULE SCORING (100 points)
// ============================================

export interface IntegrationsMetrics {
  webhookSuccessRate?: number; // percentage
  failedWebhooks?: number;
  activeIntegrations?: number;
  staleIntegrations?: number;
  apiTimeouts?: number;
}

export function calculateIntegrationsScore(metrics: IntegrationsMetrics): ModuleScore {
  const breakdown: ScoreBreakdown[] = [];
  let totalPoints = 0;

  // Webhook success rate (40 points)
  let webhookPoints = 40;
  let webhookThreshold = '> 90% sucesso (Bom)';
  if (metrics.webhookSuccessRate !== undefined) {
    if (metrics.webhookSuccessRate < 70) {
      webhookPoints = 0;
      webhookThreshold = '< 70% sucesso (Ruim)';
    } else if (metrics.webhookSuccessRate < 90) {
      webhookPoints = 20;
      webhookThreshold = '70-90% sucesso (Moderado)';
    }
  } else if (metrics.failedWebhooks !== undefined && metrics.failedWebhooks > 5) {
    webhookPoints = 20;
    webhookThreshold = 'Falhas detectadas';
  }
  totalPoints += webhookPoints;
  breakdown.push({
    criterion: 'Taxa de sucesso de webhooks',
    maxPoints: 40,
    earnedPoints: webhookPoints,
    value: metrics.webhookSuccessRate !== undefined ? `${metrics.webhookSuccessRate}%` : 'N/A',
    threshold: webhookThreshold
  });

  // Active integrations (30 points)
  const integrationPoints = (metrics.activeIntegrations ?? 0) > 0 ? 30 : 20;
  totalPoints += integrationPoints;
  breakdown.push({
    criterion: 'Integrações ativas',
    maxPoints: 30,
    earnedPoints: integrationPoints,
    value: metrics.activeIntegrations ?? 0,
    threshold: 'Configuradas e funcionando'
  });

  // Stale integrations (15 points)
  let stalePoints = 15;
  if (metrics.staleIntegrations !== undefined && metrics.staleIntegrations > 0) {
    stalePoints = metrics.staleIntegrations > 2 ? 0 : 8;
  }
  totalPoints += stalePoints;
  breakdown.push({
    criterion: 'Integrações atualizadas',
    maxPoints: 15,
    earnedPoints: stalePoints,
    value: metrics.staleIntegrations ?? 0,
    threshold: 'Sync < 24h'
  });

  // API timeouts (15 points)
  let timeoutPoints = 15;
  if (metrics.apiTimeouts !== undefined && metrics.apiTimeouts > 0) {
    timeoutPoints = metrics.apiTimeouts > 5 ? 0 : 8;
  }
  totalPoints += timeoutPoints;
  breakdown.push({
    criterion: 'Sem timeouts de API',
    maxPoints: 15,
    earnedPoints: timeoutPoints,
    value: metrics.apiTimeouts ?? 0,
    threshold: '0 timeouts'
  });

  return {
    score: totalPoints,
    status: getStatusFromScore(totalPoints),
    breakdown
  };
}

// ============================================
// OVERALL SCORE CALCULATION
// ============================================

export const MODULE_WEIGHTS = {
  ui: 0.15,
  security: 0.30,
  performance: 0.20,
  database: 0.25,
  integrations: 0.10
} as const;

export interface OverallHealthScore {
  score: number;
  status: HealthStatus;
  modules: {
    ui: ModuleScore;
    security: ModuleScore;
    performance: ModuleScore;
    database: ModuleScore;
    integrations: ModuleScore;
  };
}

export function calculateOverallScore(
  ui: ModuleScore,
  security: ModuleScore,
  performance: ModuleScore,
  database: ModuleScore,
  integrations: ModuleScore
): OverallHealthScore {
  const weightedScore = Math.round(
    ui.score * MODULE_WEIGHTS.ui +
    security.score * MODULE_WEIGHTS.security +
    performance.score * MODULE_WEIGHTS.performance +
    database.score * MODULE_WEIGHTS.database +
    integrations.score * MODULE_WEIGHTS.integrations
  );

  return {
    score: weightedScore,
    status: getStatusFromScore(weightedScore),
    modules: { ui, security, performance, database, integrations }
  };
}

// ============================================
// MAINTENANCE SCHEDULE RECOMMENDATION
// ============================================

export interface MaintenanceRecommendation {
  module: string;
  priority: 'immediate' | '3days' | 'monthly';
  action: string;
  deadline: string;
}

export function getMaintenanceSchedule(scores: Record<string, ModuleScore>): MaintenanceRecommendation[] {
  const recommendations: MaintenanceRecommendation[] = [];

  for (const [module, score] of Object.entries(scores)) {
    if (score.status === 'critical') {
      recommendations.push({
        module,
        priority: 'immediate',
        action: `Revisar ${module.toUpperCase()} imediatamente - Score: ${score.score}/100`,
        deadline: 'Agora'
      });
    } else if (score.status === 'warning') {
      recommendations.push({
        module,
        priority: '3days',
        action: `Agendar manutenção para ${module.toUpperCase()} - Score: ${score.score}/100`,
        deadline: '3 dias'
      });
    } else {
      recommendations.push({
        module,
        priority: 'monthly',
        action: `Revisão mensal de ${module.toUpperCase()} - Score: ${score.score}/100`,
        deadline: 'Próximo mês'
      });
    }
  }

  // Sort by priority
  const priorityOrder = { immediate: 0, '3days': 1, monthly: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}
