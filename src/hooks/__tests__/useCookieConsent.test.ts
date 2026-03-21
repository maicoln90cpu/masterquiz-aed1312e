import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCookieConsent } from '../useCookieConsent';

// The hook uses 'mq_cookie_consent' as storage key and queries supabase on init.
// We need the global supabase mock from setup.ts which returns { data: null, error: null }
// for .from().select().eq().maybeSingle() — this means system_settings returns null,
// so requireConsent defaults to true.

const STORAGE_KEY = 'mq_cookie_consent';

describe('useCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial state', () => {
    it('should return showBanner=true when no consent stored', async () => {
      const { result } = renderHook(() => useCookieConsent());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.showBanner).toBe(true);
      expect(result.current.consent).toBeNull();
    });

    it('should return showBanner=false when consent exists', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));

      const { result } = renderHook(() => useCookieConsent());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.showBanner).toBe(false);
    });

    it('should load existing consent from localStorage', async () => {
      const storedConsent = {
        analytics: true,
        functional: false,
        marketing: true,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConsent));

      const { result } = renderHook(() => useCookieConsent());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.consent?.analytics).toBe(true);
      expect(result.current.consent?.marketing).toBe(true);
    });
  });

  describe('acceptAll', () => {
    it('should set all consent options to true', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptAll();
      });

      expect(result.current.consent?.analytics).toBe(true);
      expect(result.current.consent?.functional).toBe(true);
      expect(result.current.consent?.marketing).toBe(true);
    });

    it('should hide banner after accepting', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptAll();
      });

      expect(result.current.showBanner).toBe(false);
    });

    it('should save consent to localStorage', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptAll();
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.analytics).toBe(true);
      expect(parsed.functional).toBe(true);
      expect(parsed.marketing).toBe(true);
    });
  });

  describe('rejectAll', () => {
    it('should set functional=true and others=false', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.rejectAll();
      });

      // functional is always true per implementation
      expect(result.current.consent?.functional).toBe(true);
      expect(result.current.consent?.analytics).toBe(false);
      expect(result.current.consent?.marketing).toBe(false);
    });

    it('should hide banner after rejecting', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.rejectAll();
      });

      expect(result.current.showBanner).toBe(false);
    });
  });

  describe('savePreferences', () => {
    it('should update specific consent options', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.acceptAll();
      });

      await act(async () => {
        await result.current.savePreferences({ marketing: false });
      });

      expect(result.current.consent?.marketing).toBe(false);
      expect(result.current.consent?.analytics).toBe(true);
    });
  });

  describe('hasConsented helper', () => {
    it('should return true when consent exists', async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));

      const { result } = renderHook(() => useCookieConsent());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.hasConsented).toBe(true);
    });

    it('should return false when no consent given', async () => {
      const { result } = renderHook(() => useCookieConsent());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.hasConsented).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in localStorage gracefully', async () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useCookieConsent());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.consent).toBeNull();
      expect(result.current.showBanner).toBe(true);
    });
  });
});
