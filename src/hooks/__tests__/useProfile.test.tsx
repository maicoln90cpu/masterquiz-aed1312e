import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from '../useProfile';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Override global AuthContext mock for this test file
let mockAuthUser: any = null;
let mockAuthLoading = false;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    session: mockAuthUser ? { access_token: 'token', user: mockAuthUser } : null,
    loading: mockAuthLoading,
  }),
  AuthProvider: ({ children }: any) => children,
}));

// Override supabase mock
vi.mock('@/integrations/supabase/client');

const createMockUser = (id = 'test-user-id') => ({
  id,
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
});

const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  full_name: 'Test User',
  company_slug: 'test-company',
  whatsapp: '+5511999999999',
  gtm_container_id: 'GTM-XXXXX',
  facebook_pixel_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

// useProfile agora usa TanStack Query (4.1) — provider obrigatório.
// Factory garante UM QueryClient estável por renderHook (não recria a cada
// re-render do wrapper interno do React Testing Library).
const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const mockProfilesSelect = (profile: any | null, error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

const mockProfilesUpsert = (data: any, error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

describe('useProfile', () => {
  // QueryClient/wrapper recriados a cada teste para isolar cache.
  let wrapper: ({ children }: { children: ReactNode }) => JSX.Element;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = null;
    mockAuthLoading = false;
    wrapper = makeWrapper();
  });

  describe('When user is not authenticated', () => {
    it('should return null profile and loading=false', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
    });
  });

  describe('When user is authenticated', () => {
    it('should fetch and return user profile', async () => {
      mockAuthUser = createMockUser();
      const mockProfile = createMockProfile();
      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile);
      });
    });

    it('should handle missing profile (PGRST116 error)', async () => {
      mockAuthUser = createMockUser();
      mockProfilesSelect(null, { code: 'PGRST116', message: 'No rows found' });

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
    });

    it('should log other errors', async () => {
      mockAuthUser = createMockUser();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockProfilesSelect(null, { code: 'OTHER_ERROR', message: 'Database error' });

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Profile fields', () => {
    it('should return company_slug from profile', async () => {
      mockAuthUser = createMockUser();
      const mockProfile = createMockProfile({ company_slug: 'my-company' });
      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.profile?.company_slug).toBe('my-company');
      });
    });

    it('should return full_name from profile', async () => {
      mockAuthUser = createMockUser();
      const mockProfile = createMockProfile({ full_name: 'John Doe' });
      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.profile?.full_name).toBe('John Doe');
      });
    });

    it('should return tracking ids from profile', async () => {
      mockAuthUser = createMockUser();
      const mockProfile = createMockProfile({
        gtm_container_id: 'GTM-12345',
        facebook_pixel_id: 'FB-PIXEL-123',
      });
      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.profile?.gtm_container_id).toBe('GTM-12345');
        expect(result.current.profile?.facebook_pixel_id).toBe('FB-PIXEL-123');
      });
    });
  });

  describe('updateProfile function', () => {
    it('should update profile successfully', async () => {
      mockAuthUser = createMockUser();
      const initialProfile = createMockProfile();
      const updatedProfile = createMockProfile({ full_name: 'Updated Name' });

      mockProfilesSelect(initialProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockProfilesUpsert(updatedProfile);

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProfile({ full_name: 'Updated Name' });
      });

      expect(updateResult.error).toBeNull();
      expect(updateResult.data).toEqual(updatedProfile);
    });

    it('should return error when not authenticated', async () => {
      mockAuthUser = null;

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProfile({ full_name: 'Test' });
      });

      expect(updateResult.error).toBeDefined();
      expect(updateResult.error.message).toBe('Not authenticated');
    });

    it('should handle update errors', async () => {
      mockAuthUser = createMockUser();
      const initialProfile = createMockProfile();

      mockProfilesSelect(initialProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockProfilesUpsert(null, { message: 'Update failed' });

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProfile({ full_name: 'Test' });
      });

      expect(updateResult.error).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockAuthUser = createMockUser();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      vi.mocked(supabase.from).mockReturnValue(chain as any);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Loading states', () => {
    it('should be loading while auth is loading', async () => {
      mockAuthLoading = true;

      const { result } = renderHook(() => useProfile(), { wrapper });

      expect(result.current.loading).toBe(true);
    });
  });
});
