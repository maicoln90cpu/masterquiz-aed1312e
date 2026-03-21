import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn(),
        })),
        maybeSingle: vi.fn(),
      })),
    })),
  },
}));

// Override useUserRole
const mockUseUserRole = vi.fn();
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => mockUseUserRole(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
  return Wrapper;
};

describe('usePlanFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserRole.mockReturnValue({
      roles: [],
      loading: false,
      hasRole: () => false,
      isMasterAdmin: false,
      isAdmin: false,
      isUser: false,
    });
  });

  it('should return default features when no user is authenticated', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { usePlanFeatures } = await import('../usePlanFeatures');
    const { result } = renderHook(() => usePlanFeatures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allowFacebookPixel).toBe(false);
    expect(result.current.allowGTM).toBe(false);
  });

  it('should return true for all features when user is master_admin', async () => {
    const { supabase } = await import('@/integrations/supabase/client');

    mockUseUserRole.mockReturnValue({
      roles: ['master_admin'],
      loading: false,
      hasRole: (r: string) => r === 'master_admin',
      isMasterAdmin: true,
      isAdmin: true,
      isUser: true,
    });
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'admin@test.com' } as any },
      error: null,
    });

    const { usePlanFeatures } = await import('../usePlanFeatures');
    const { result } = renderHook(() => usePlanFeatures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isMasterAdmin).toBe(true);
    expect(result.current.allowFacebookPixel).toBe(true);
    expect(result.current.allowGTM).toBe(true);
  });
});
