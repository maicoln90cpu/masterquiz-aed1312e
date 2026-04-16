import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

import {
  fetchSLAMetrics,
  fetchAICosts,
  fetchDeliveryStats,
  fetchRecentErrors,
  fetchPerformanceTop,
  fetchWebVitals,
  fetchMetricsHealthCheck,
} from '../observabilityService';

// Helper to create chained mock
function chainMock(resolvedValue: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, any> = {};
  const terminalMethods = ['single', 'maybeSingle'];
  const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'gte', 'lte', 'order', 'limit', 'range'];

  for (const m of chainMethods) {
    chain[m] = vi.fn(() => chain);
  }
  for (const m of terminalMethods) {
    chain[m] = vi.fn(() => Promise.resolve(resolvedValue));
  }
  // Make the chain itself thenable (for queries without .single())
  chain.then = (resolve: any) => resolve(resolvedValue);
  // Support count queries
  if (resolvedValue.count !== undefined) {
    chain.select = vi.fn(() => {
      // Return itself, which when awaited gives count
      const withCount = { ...chain };
      withCount.then = (resolve: any) => resolve({ ...resolvedValue });
      // For .gte etc chain
      for (const m of chainMethods.filter(x => x !== 'select')) {
        withCount[m] = vi.fn(() => withCount);
      }
      return withCount;
    });
  }
  return chain;
}

describe('observabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSLAMetrics', () => {
    it('retorna métricas calculadas corretamente', async () => {
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'client_error_logs') {
          return chainMock({ data: null, error: null, count: 14 });
        }
        if (table === 'performance_logs') {
          return chainMock({
            data: [
              { duration_ms: 100 },
              { duration_ms: 200 },
              { duration_ms: 300 },
              { duration_ms: 1500 },
            ],
            error: null,
          });
        }
        return chainMock({ data: null, error: null });
      });

      const result = await fetchSLAMetrics(7);
      expect(result.totalOperations).toBe(4);
      expect(result.avgLatencyMs).toBe(525); // (100+200+300+1500)/4
      expect(result.errorsPerDay).toBe(2); // 14/7
      expect(result.uptimeEstimate).toBeGreaterThanOrEqual(95);
      expect(mockFrom).toHaveBeenCalledWith('client_error_logs');
      expect(mockFrom).toHaveBeenCalledWith('performance_logs');
    });

    it('retorna zeros quando sem dados', async () => {
      mockFrom.mockImplementation(() => chainMock({ data: [], error: null, count: 0 }));
      const result = await fetchSLAMetrics(7);
      expect(result.totalOperations).toBe(0);
      expect(result.avgLatencyMs).toBe(0);
      expect(result.p95LatencyMs).toBe(0);
    });
  });

  describe('fetchAICosts', () => {
    it('agrega custos por dia corretamente', async () => {
      mockFrom.mockImplementation(() =>
        chainMock({
          data: [
            { total_tokens: 1000, estimated_cost_usd: 0.01, created_at: '2026-04-10T10:00:00Z' },
            { total_tokens: 2000, estimated_cost_usd: 0.02, created_at: '2026-04-10T14:00:00Z' },
            { total_tokens: 500, estimated_cost_usd: 0.005, created_at: '2026-04-11T10:00:00Z' },
          ],
          error: null,
        })
      );

      const result = await fetchAICosts(30);
      expect(result.totalGenerations).toBe(3);
      expect(result.totalTokens).toBe(3500);
      expect(result.estimatedCostUSD).toBe(0.035);
      expect(result.dailyCosts).toHaveLength(2);
      expect(result.dailyCosts[0].date).toBe('2026-04-10');
      expect(result.dailyCosts[0].generations).toBe(2);
    });

    it('retorna vazio quando sem dados', async () => {
      mockFrom.mockImplementation(() => chainMock({ data: [], error: null }));
      const result = await fetchAICosts(30);
      expect(result.totalGenerations).toBe(0);
      expect(result.totalTokens).toBe(0);
      expect(result.dailyCosts).toHaveLength(0);
    });
  });

  describe('fetchDeliveryStats', () => {
    it('conta status de WhatsApp e Email corretamente', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'recovery_contacts') {
          return chainMock({
            data: [
              { status: 'sent' },
              { status: 'sent' },
              { status: 'delivered' },
              { status: 'failed' },
            ],
            error: null,
          });
        }
        if (table === 'email_recovery_contacts') {
          return chainMock({
            data: [
              { status: 'sent' },
              { status: 'pending' },
            ],
            error: null,
          });
        }
        return chainMock({ data: [], error: null });
      });

      const result = await fetchDeliveryStats(7);
      expect(result.whatsapp.sent).toBe(2);
      expect(result.whatsapp.delivered).toBe(1);
      expect(result.whatsapp.failed).toBe(1);
      expect(result.email.sent).toBe(1);
      expect(result.email.pending).toBe(1);
    });
  });

  describe('fetchRecentErrors', () => {
    it('agrupa erros por componente e detecta spike', async () => {
      const errors = Array.from({ length: 15 }, (_, i) => ({
        component_name: 'Dashboard',
        error_message: 'TypeError: null',
        created_at: `2026-04-16T${String(10).padStart(2, '0')}:${String(i).padStart(2, '0')}:00Z`,
      }));

      mockFrom.mockImplementation(() => chainMock({ data: errors, error: null }));

      const result = await fetchRecentErrors(10);
      expect(result.totalLast24h).toBe(15);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].component).toBe('Dashboard');
      expect(result.groups[0].count).toBe(15);
      expect(result.hasSpikeAlert).toBe(true); // 15 > threshold 10
    });

    it('sem spike quando abaixo do threshold', async () => {
      mockFrom.mockImplementation(() =>
        chainMock({
          data: [
            { component_name: 'App', error_message: 'err', created_at: '2026-04-16T10:00:00Z' },
          ],
          error: null,
        })
      );

      const result = await fetchRecentErrors(10);
      expect(result.hasSpikeAlert).toBe(false);
    });
  });

  describe('fetchPerformanceTop', () => {
    it('retorna operações ordenadas por P95', async () => {
      mockFrom.mockImplementation(() =>
        chainMock({
          data: [
            { operation_name: 'loadQuiz', operation_type: 'query', duration_ms: 500 },
            { operation_name: 'loadQuiz', operation_type: 'query', duration_ms: 100 },
            { operation_name: 'saveQuiz', operation_type: 'mutation', duration_ms: 800 },
          ],
          error: null,
        })
      );

      const result = await fetchPerformanceTop(7);
      expect(result.length).toBeGreaterThanOrEqual(1);
      // saveQuiz has higher p95
      expect(result[0].operation).toBe('saveQuiz');
    });
  });

  describe('fetchWebVitals', () => {
    it('transforma metadata de eventos GTM em WebVitalEntry', async () => {
      mockFrom.mockImplementation(() =>
        chainMock({
          data: [
            {
              metadata: { metric_name: 'LCP', metric_value: 2500, metric_rating: 'good' },
              created_at: '2026-04-16T10:00:00Z',
            },
          ],
          error: null,
        })
      );

      const result = await fetchWebVitals(7);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('LCP');
      expect(result[0].value).toBe(2500);
      expect(result[0].rating).toBe('good');
    });

    it('filtra entries sem nome', async () => {
      mockFrom.mockImplementation(() =>
        chainMock({
          data: [
            { metadata: {}, created_at: '2026-04-16T10:00:00Z' },
            { metadata: { metric_name: 'FCP', metric_value: 1000 }, created_at: '2026-04-16T10:00:00Z' },
          ],
          error: null,
        })
      );

      const result = await fetchWebVitals(7);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('FCP');
    });
  });

  describe('fetchMetricsHealthCheck', () => {
    it('verifica 5 canais de métricas', async () => {
      mockFrom.mockImplementation(() =>
        chainMock({
          data: [{ created_at: new Date().toISOString() }],
          error: null,
        })
      );

      const result = await fetchMetricsHealthCheck();
      expect(result).toHaveLength(5);
      expect(result.every(c => c.hasRecentData)).toBe(true);
      expect(result.map(c => c.channel)).toContain('errors');
      expect(result.map(c => c.channel)).toContain('performance');
    });
  });
});
