import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn(), id: 'test-sub' } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.webp' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.webp' } }),
      })),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock AuthContext - used by useUserRole and many components
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

// Mock useUserRole - used by usePlanFeatures, useSubscriptionLimits, etc.
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({
    roles: [],
    loading: false,
    hasRole: () => false,
    isMasterAdmin: false,
    isAdmin: false,
    isUser: false,
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.defaultValue || key,
    i18n: {
      language: 'pt',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock react-router-dom - preserve real components, mock hooks
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  };
});

// Mock framer-motion to avoid jsdom animation issues
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const React = await import('react');
  return {
    ...actual,
    motion: new Proxy(actual.motion || {}, {
      get: (_target: any, prop: string) => {
        if (typeof prop === 'string' && /^[a-z]/.test(prop)) {
          return React.forwardRef((props: any, ref: any) => {
            const { initial, animate, exit, transition, variants, whileHover, whileTap, whileFocus, whileInView, layout, layoutId, ...rest } = props;
            return React.createElement(prop, { ...rest, ref });
          });
        }
        return _target[prop];
      },
    }),
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => true,
    useMotionValue: (initial: number) => ({ get: () => initial, set: vi.fn() }),
    useTransform: () => ({ get: () => 0, set: vi.fn() }),
    useSpring: () => ({ get: () => 0, set: vi.fn() }),
  };
});

// Mock DOMPurify for consistent behavior in jsdom
vi.mock('dompurify', () => {
  const createDOMPurify = () => {
    const sanitize = (dirty: string, config?: any) => {
      if (!dirty) return '';
      
      const allowedTags = new Set(config?.ALLOWED_TAGS || []);
      const forbiddenTags = new Set(config?.FORBID_TAGS || []);
      const allowedAttrs = new Set(config?.ALLOWED_ATTR || []);
      const forbiddenAttrs = new Set(config?.FORBID_ATTR || []);
      
      // Simple tag-based sanitization for test consistency
      let result = dirty;
      
      // Remove forbidden tags and their content
      for (const tag of forbiddenTags) {
        const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
        result = result.replace(regex, '');
        const selfClosing = new RegExp(`<${tag}[^>]*/?>`, 'gi');
        result = result.replace(selfClosing, '');
      }
      
      // Remove script tags always
      result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      result = result.replace(/<script[^>]*\/?>/gi, '');
      
      // Remove event handlers
      result = result.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');
      
      // Remove javascript: in href
      result = result.replace(/href\s*=\s*"javascript:[^"]*"/gi, '');
      result = result.replace(/href\s*=\s*'javascript:[^']*'/gi, '');
      
      // Remove data: URLs in src for security
      result = result.replace(/src\s*=\s*"data:[^"]*"/gi, 'src=""');
      
      // Remove expression() in styles
      result = result.replace(/expression\s*\([^)]*\)/gi, '');
      
      // Remove meta, base tags
      result = result.replace(/<meta[^>]*\/?>/gi, '');
      result = result.replace(/<base[^>]*\/?>/gi, '');
      
      // Remove SVG with scripts
      result = result.replace(/<svg[^>]*on\w+[^>]*>[\s\S]*?<\/svg>/gi, '');
      
      // If we have allowed tags, strip tags not in the list
      if (allowedTags.size > 0) {
        // Remove tags not in allowedTags (keep their content)
        result = result.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tagName) => {
          const tag = tagName.toLowerCase();
          if (allowedTags.has(tag)) {
            // Strip forbidden/unknown attributes from allowed tags
            if (allowedAttrs.size > 0) {
              return match.replace(/\s+([a-z][a-z0-9-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, (attrMatch: string, attrName: string) => {
                const attr = attrName.toLowerCase();
                if (allowedAttrs.has(attr) && !forbiddenAttrs.has(attr)) {
                  return attrMatch;
                }
                return '';
              });
            }
            return match;
          }
          // Not allowed - remove tag but keep content
          return '';
        });
      }
      
      // Remove unicode-escaped javascript
      result = result.replace(/\\u006a/gi, 'j');
      if (result.includes('javascript:')) {
        result = result.replace(/href\s*=\s*"[^"]*javascript:[^"]*"/gi, '');
      }
      
      return result.trim();
    };
    
    return {
      sanitize,
      addHook: vi.fn(),
      removeHook: vi.fn(),
      removeHooks: vi.fn(),
      isSupported: true,
    };
  };
  
  return {
    default: createDOMPurify(),
    __esModule: true,
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
});
