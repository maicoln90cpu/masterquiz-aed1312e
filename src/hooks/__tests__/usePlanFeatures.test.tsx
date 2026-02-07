import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
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

    // Should return free plan defaults
    expect(result.current.allowFacebookPixel).toBe(false);
    expect(result.current.allowGTM).toBe(false);
  });

  it('should return true for all features when user is master_admin', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'admin@test.com' } as any },
      error: null,
    });

    // Mock user_roles query to return master_admin
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { role: 'master_admin' },
                error: null,
              }),
            })),
          })),
        } as any;
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      } as any;
    });

    const { usePlanFeatures } = await import('../usePlanFeatures');
    const { result } = renderHook(() => usePlanFeatures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Master admin should have all features
    expect(result.current.isMasterAdmin).toBe(true);
  });
});
