// Must unmock before any other imports
vi.unmock('@/hooks/useUserRole');
vi.unmock('@/contexts/AuthContext');

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserRole } from '../useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

// Mock supabase with all methods AuthProvider needs
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Create mock user
const createMockUser = (id = 'test-user-id') => ({
  id,
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
});

// Create mock session
const createMockSession = (userId = 'test-user-id') => ({
  access_token: 'test-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser(userId),
});

// Wrapper with AuthProvider
const createWrapper = (session: any = null) => {
  vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
    setTimeout(() => callback('INITIAL_SESSION', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
          id: 'test-sub',
        },
      },
    } as any;
  });

  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session },
    error: null,
  } as any);

  return ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

// Mock select chain
const mockSelectChain = (data: any[] | null, error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When user is not authenticated', () => {
    it('should return empty roles and loading=false', async () => {
      const wrapper = createWrapper(null);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toEqual([]);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isMasterAdmin).toBe(false);
      expect(result.current.isUser).toBe(false);
    });
  });

  describe('When user is authenticated', () => {
    it('should fetch and return user roles', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'user' }, { role: 'admin' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.roles).toContain('user');
        expect(result.current.roles).toContain('admin');
      });
    });

    it('should correctly identify admin role', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'admin' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isMasterAdmin).toBe(false);
      });
    });

    it('should correctly identify master_admin role', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'master_admin' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isMasterAdmin).toBe(true);
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should return isUser=true when user has any role', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'user' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isUser).toBe(true);
      });
    });
  });

  describe('hasRole function', () => {
    it('should return true for existing role', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'admin' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.hasRole('admin')).toBe(true);
      });
    });

    it('should return false for non-existing role', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'user' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.hasRole('master_admin')).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle fetch error gracefully', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle null data response', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain(null);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toEqual([]);
    });
  });

  describe('Role hierarchy', () => {
    it('should treat master_admin as admin', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'master_admin' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isMasterAdmin).toBe(true);
      });
    });

    it('should NOT treat regular admin as master_admin', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);

      mockSelectChain([{ role: 'admin' }]);

      const { result } = renderHook(() => useUserRole(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isMasterAdmin).toBe(false);
      });
    });
  });
});
