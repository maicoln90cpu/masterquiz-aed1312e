import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookieConsent } from '../useCookieConsent';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initial state', () => {
    it('should return showBanner=true when no consent stored', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.showBanner).toBe(true);
      expect(result.current.consent).toBeNull();
    });

    it('should return showBanner=false when consent exists', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
      }));

      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.showBanner).toBe(false);
    });

    it('should load existing consent from localStorage', () => {
      const storedConsent = {
        analytics: true,
        functional: false,
        marketing: true,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedConsent));

      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.consent).toEqual(storedConsent);
    });
  });

  describe('acceptAll', () => {
    it('should set all consent options to true', () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(result.current.consent).toEqual({
        analytics: true,
        functional: true,
        marketing: true,
      });
    });

    it('should hide banner after accepting', () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(result.current.showBanner).toBe(false);
    });

    it('should save consent to localStorage', () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cookie-consent',
        JSON.stringify({
          analytics: true,
          functional: true,
          marketing: true,
        })
      );
    });
  });

  describe('rejectAll', () => {
    it('should set all consent options to false', () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.rejectAll();
      });

      expect(result.current.consent).toEqual({
        analytics: false,
        functional: false,
        marketing: false,
      });
    });

    it('should hide banner after rejecting', () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.rejectAll();
      });

      expect(result.current.showBanner).toBe(false);
    });
  });

  describe('savePreferences', () => {
    it('should update specific consent options', async () => {
      const { result } = renderHook(() => useCookieConsent());

      // First accept all
      await act(async () => {
        await result.current.acceptAll();
      });

      // Then update specific option
      await act(async () => {
        await result.current.savePreferences({ marketing: false });
      });

      expect(result.current.consent?.marketing).toBe(false);
    });
  });

  describe('hasConsented helper', () => {
    it('should return true when consent exists', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        analytics: true,
        functional: true,
        marketing: false,
        timestamp: Date.now(),
      }));

      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.hasConsented).toBe(true);
    });

    it('should return false when no consent given', () => {
      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.hasConsented).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const { result } = renderHook(() => useCookieConsent());
      
      expect(result.current.consent).toBeNull();
      expect(result.current.showBanner).toBe(true);
    });
  });
});
