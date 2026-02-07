import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'onboarding-id',
              user_id: 'test-user-id',
              welcome_completed: false,
              dashboard_tour_completed: false,
            },
            error: null,
          }),
        })),
      })),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

describe('useOnboarding', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return React.createElement(QueryClientProvider, { client: queryClient }, children);
    };
  };

  it('should initialize with loading state', async () => {
    const { useOnboarding } = await import('../useOnboarding');
    
    const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });
    
    expect(result.current.status).toBe('loading');
  });

  it('should compute shouldShowDashboardTour correctly', async () => {
    const { useOnboarding } = await import('../useOnboarding');
    
    const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });
    
    expect(result.current.shouldShowDashboardTour).toBe(false);
  });
});
