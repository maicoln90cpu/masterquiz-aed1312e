import { ReactElement, ReactNode, createContext, useContext } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';

// ============================================================
// MOCK AUTH CONTEXT
// ============================================================

interface MockAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const MockAuthContext = createContext<MockAuthContextType>({
  user: null,
  session: null,
  loading: false,
});

export const useMockAuth = () => useContext(MockAuthContext);

interface MockAuthProviderProps {
  children: ReactNode;
  user?: User | null;
  session?: Session | null;
  loading?: boolean;
}

export const MockAuthProvider = ({ 
  children, 
  user = null, 
  session = null, 
  loading = false 
}: MockAuthProviderProps) => (
  <MockAuthContext.Provider value={{ user, session, loading }}>
    {children}
  </MockAuthContext.Provider>
);

// ============================================================
// TEST USER HELPERS
// ============================================================

/**
 * Creates a mock Supabase user for testing
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-id-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  role: 'authenticated',
  ...overrides,
});

/**
 * Creates a mock Supabase session for testing
 */
export const createMockSession = (user?: User): Session => {
  const mockUser = user ?? createMockUser();
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser,
  };
};

// ============================================================
// CUSTOM RENDER FUNCTION
// ============================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  user?: User | null;
  session?: Session | null;
  authLoading?: boolean;
  useMemoryRouter?: boolean;
}

/**
 * Custom render function that includes all providers:
 * - QueryClientProvider (TanStack Query)
 * - BrowserRouter or MemoryRouter
 * - MockAuthProvider
 */
function render(
  ui: ReactElement, 
  { 
    initialRoute = '/',
    user = null,
    session = null,
    authLoading = false,
    useMemoryRouter = false,
    ...options 
  }: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const Router = useMemoryRouter 
    ? ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      )
    : ({ children }: { children: ReactNode }) => (
        <BrowserRouter>{children}</BrowserRouter>
      );

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MockAuthProvider user={user} session={session} loading={authLoading}>
          {children}
        </MockAuthProvider>
      </Router>
    </QueryClientProvider>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Render with an authenticated user
 */
export function renderAuthenticated(
  ui: ReactElement,
  options?: Omit<CustomRenderOptions, 'user' | 'session'>
) {
  const user = createMockUser();
  const session = createMockSession(user);
  return render(ui, { ...options, user, session });
}

/**
 * Render with loading auth state
 */
export function renderLoading(
  ui: ReactElement,
  options?: Omit<CustomRenderOptions, 'authLoading'>
) {
  return render(ui, { ...options, authLoading: true });
}

// ============================================================
// RE-EXPORTS
// ============================================================

// Re-export everything from testing-library
export * from '@testing-library/react';
export { render };

// Export userEvent for interaction testing
export { default as userEvent } from '@testing-library/user-event';
