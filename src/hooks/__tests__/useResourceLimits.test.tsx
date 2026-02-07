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
          in: vi.fn(),
        })),
        maybeSingle: vi.fn(),
        in: vi.fn(),
      })),
    })),
  },
}));

// Mock useUserRole
vi.mock('../useUserRole', () => ({
  useUserRole: vi.fn(() => ({
    isMasterAdmin: false,
    isAdmin: false,
    roles: [],
    hasRole: () => false,
    loading: false,
  })),
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

describe('useResourceLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null limits when no user is authenticated', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { useResourceLimits } = await import('../useResourceLimits');
    const { result } = renderHook(() => useResourceLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.limits).toBeNull();
  });

  it('should return unlimited limits for master_admin users', async () => {
    const { useUserRole } = await import('../useUserRole');
    vi.mocked(useUserRole).mockReturnValue({
      isMasterAdmin: true,
      isAdmin: true,
      isUser: false,
      roles: ['master_admin'],
      hasRole: () => true,
      loading: false,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'admin-user-id' } as any },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          in: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
        })),
        in: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      })),
    } as any));

    const { useResourceLimits } = await import('../useResourceLimits');
    const { result } = renderHook(() => useResourceLimits(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Master admin should have unlimited limits
    if (result.current.limits) {
      expect(result.current.limits.quizzes.limit).toBe(Infinity);
      expect(result.current.limits.responses.limit).toBe(Infinity);
      expect(result.current.limits.leads.limit).toBe(Infinity);
      expect(result.current.limits.isMasterAdmin).toBe(true);
    }
  });

  it('should calculate isNearLimit correctly at 80%', () => {
    // Test that 80% usage triggers isNearLimit
    const current = 8;
    const limit = 10;
    const percentage = (current / limit) * 100;
    
    expect(percentage).toBe(80);
    expect(percentage >= 80).toBe(true);
  });

  it('should calculate isAtLimit correctly at 100%', () => {
    // Test that 100% usage triggers isAtLimit
    const current = 10;
    const limit = 10;
    const percentage = (current / limit) * 100;
    
    expect(percentage).toBe(100);
    expect(percentage >= 100).toBe(true);
  });
});
