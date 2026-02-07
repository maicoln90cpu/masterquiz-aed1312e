import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from '../useProfile';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
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

// Create mock profile
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

// Mock the profiles table query chain
const mockProfilesSelect = (profile: any | null, error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error }),
  };
  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
};

// Mock the profiles upsert chain
const mockProfilesUpsert = (data: any, error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When user is not authenticated', () => {
    it('should return null profile and loading=false', async () => {
      const wrapper = createWrapper(null);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
    });
  });

  describe('When user is authenticated', () => {
    it('should fetch and return user profile', async () => {
      const session = createMockSession();
      const mockProfile = createMockProfile();
      const wrapper = createWrapper(session);

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
      const session = createMockSession();
      const wrapper = createWrapper(session);

      // PGRST116 = no rows returned
      mockProfilesSelect(null, { code: 'PGRST116', message: 'No rows found' });

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.profile).toBeNull();
    });

    it('should log other errors', async () => {
      const session = createMockSession();
      const wrapper = createWrapper(session);
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
      const session = createMockSession();
      const mockProfile = createMockProfile({ company_slug: 'my-company' });
      const wrapper = createWrapper(session);

      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.profile?.company_slug).toBe('my-company');
      });
    });

    it('should return full_name from profile', async () => {
      const session = createMockSession();
      const mockProfile = createMockProfile({ full_name: 'John Doe' });
      const wrapper = createWrapper(session);

      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.profile?.full_name).toBe('John Doe');
      });
    });

    it('should return tracking ids from profile', async () => {
      const session = createMockSession();
      const mockProfile = createMockProfile({
        gtm_container_id: 'GTM-12345',
        facebook_pixel_id: 'FB-PIXEL-123',
      });
      const wrapper = createWrapper(session);

      mockProfilesSelect(mockProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.profile?.gtm_container_id).toBe('GTM-12345');
        expect(result.current.profile?.facebook_pixel_id).toBe('FB-PIXEL-123');
      });
    });
  });

  describe('updateProfile function', () => {
    it('should update profile successfully', async () => {
      const session = createMockSession();
      const initialProfile = createMockProfile();
      const updatedProfile = createMockProfile({ full_name: 'Updated Name' });
      const wrapper = createWrapper(session);

      // First call returns initial profile
      mockProfilesSelect(initialProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup for update
      mockProfilesUpsert(updatedProfile);

      let updateResult: any;
      await act(async () => {
        updateResult = await result.current.updateProfile({ full_name: 'Updated Name' });
      });

      expect(updateResult.error).toBeNull();
      expect(updateResult.data).toEqual(updatedProfile);
    });

    it('should return error when not authenticated', async () => {
      const wrapper = createWrapper(null);

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
      const session = createMockSession();
      const initialProfile = createMockProfile();
      const wrapper = createWrapper(session);

      mockProfilesSelect(initialProfile);

      const { result } = renderHook(() => useProfile(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup for failed update
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
      const session = createMockSession();
      const wrapper = createWrapper(session);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock network error
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
      // Don't resolve the session immediately
      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
            id: 'test-sub',
          },
        },
      } as any));

      vi.mocked(supabase.auth.getSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useProfile(), { wrapper });

      // Should remain loading
      expect(result.current.loading).toBe(true);
    });
  });
});
