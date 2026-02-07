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

describe('useSubscriptionLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null subscription when user is not authenticated', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { useSubscriptionLimits } = await import('../useSubscriptionLimits');
    const { result } = renderHook(() => useSubscriptionLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
  });

  it('should return subscription data for authenticated user', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user-id' } as any },
      error: null,
    });

    const mockSubscription = {
      id: 'sub-1',
      user_id: 'test-user-id',
      plan_type: 'paid',
      status: 'active',
      quiz_limit: 10,
      response_limit: 1000,
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'user_subscriptions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: mockSubscription,
                error: null,
              }),
            })),
          })),
        } as any;
      }
      if (table === 'user_roles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
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

    const { useSubscriptionLimits } = await import('../useSubscriptionLimits');
    const { result } = renderHook(() => useSubscriptionLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription?.plan_type).toBe('paid');
    expect(result.current.subscription?.quiz_limit).toBe(10);
  });

  it('should return unlimited subscription for master_admin', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'admin-user-id' } as any },
      error: null,
    });

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

    const { useSubscriptionLimits } = await import('../useSubscriptionLimits');
    const { result } = renderHook(() => useSubscriptionLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Master admin should have unlimited subscription
    expect(result.current.subscription?.quiz_limit).toBe(Infinity);
    expect(result.current.subscription?.response_limit).toBe(Infinity);
  });
});
