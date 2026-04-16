import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

import { fetchGTMId, checkGTMScript, checkDataLayer } from '../gtmDiagnosticService';

describe('gtmDiagnosticService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchGTMId', () => {
    it('retorna null quando user não autenticado', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await fetchGTMId();
      expect(result).toBeNull();
    });

    it('retorna GTM ID do perfil do user', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      const chain: Record<string, any> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.maybeSingle = vi.fn(() => Promise.resolve({ data: { gtm_container_id: 'GTM-XXXXX' }, error: null }));
      mockFrom.mockReturnValue(chain);

      const result = await fetchGTMId();
      expect(result).toBe('GTM-XXXXX');
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });

    it('retorna null quando perfil sem GTM ID', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
      const chain: Record<string, any> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.maybeSingle = vi.fn(() => Promise.resolve({ data: { gtm_container_id: null }, error: null }));
      mockFrom.mockReturnValue(chain);

      const result = await fetchGTMId();
      expect(result).toBeNull();
    });
  });

  describe('checkGTMScript', () => {
    it('retorna false em ambiente sem DOM', () => {
      // jsdom exists, so test with actual DOM
      const result = checkGTMScript('GTM-TEST');
      // No GTM scripts injected in test DOM
      expect(result).toBe(false);
    });
  });

  describe('checkDataLayer', () => {
    it('retorna false quando dataLayer não existe', () => {
      const result = checkDataLayer();
      expect(result).toBe(false);
    });

    it('retorna true quando dataLayer existe e tem itens', () => {
      (window as any).dataLayer = [{ event: 'gtm.js' }];
      const result = checkDataLayer();
      expect(result).toBe(true);
      delete (window as any).dataLayer;
    });

    it('retorna false quando dataLayer é array vazio', () => {
      (window as any).dataLayer = [];
      const result = checkDataLayer();
      expect(result).toBe(false);
      delete (window as any).dataLayer;
    });
  });
});
