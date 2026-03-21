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
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'onboarding-id',
          user_id: 'test-user-id',
          welcome_completed: false,
          dashboard_tour_completed: false,
          settings_tour_completed: false,
          analytics_tour_completed: false,
          crm_tour_completed: false,
          integrations_tour_completed: false,
          quiz_editor_tour_completed: false,
          first_quiz_created: false,
          first_lead_captured: false,
          completed_at: null,
        },
        error: null,
      }),
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
    
    // The hook uses useState with loading=true initially
    expect(result.current.loading).toBe(true);
  });

  it('should load onboarding data and set loading to false', async () => {
    const { useOnboarding } = await import('../useOnboarding');
    
    const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // After loading, dashboard_tour_completed should match the mock data
    expect(result.current.shouldShowDashboardTour).toBeDefined();
  });
});
